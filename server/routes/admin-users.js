import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Tüm kullanıcıları getir (sadece sistem admin'leri görebilir veya restoran bazlı filtreleme)
router.get('/', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();
    
    // Eğer kullanıcı bir restorana bağlıysa, sadece o restoranın kullanıcılarını göster
    // Sistem admin'i ise (RestaurantId NULL), tüm kullanıcıları göster
    let query = `
      SELECT 
        au.Id, au.Username, au.FullName, au.Email, au.IsActive, 
        au.RestaurantId, au.CreatedAt, au.LastLogin,
        r.Name as RestaurantName
      FROM AdminUsers au
      LEFT JOIN Restaurants r ON au.RestaurantId = r.Id
    `;
    
    const request = pool.request();
    
    // Restoran bazlı kullanıcı ise sadece kendi restoranının kullanıcılarını göster
    if (req.admin.RestaurantId) {
      query += ' WHERE au.RestaurantId = @restaurantId';
      request.input('restaurantId', sql.Int, req.admin.RestaurantId);
    }
    
    query += ' ORDER BY au.CreatedAt DESC';
    
    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar yüklenirken bir hata oluştu',
    });
  }
});

// Tek kullanıcı detayı
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          au.Id, au.Username, au.FullName, au.Email, au.IsActive, 
          au.RestaurantId, au.CreatedAt, au.LastLogin,
          r.Name as RestaurantName
        FROM AdminUsers au
        LEFT JOIN Restaurants r ON au.RestaurantId = r.Id
        WHERE au.Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const user = result.recordset[0];

    // Restoran bazlı kullanıcı ise, sadece kendi restoranının kullanıcılarını görebilir
    if (req.admin.RestaurantId && user.RestaurantId !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcıya erişim yetkiniz yok',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Kullanıcı detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgisi yüklenirken bir hata oluştu',
    });
  }
});

// Yeni kullanıcı oluştur
router.post('/', adminAuth, async (req, res) => {
  try {
    const { username, password, fullName, email, restaurantId, isActive } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı, şifre ve tam ad gerekli',
      });
    }

    // Restoran bazlı kullanıcı ise, sadece kendi restoranı için kullanıcı oluşturabilir
    const finalRestaurantId = req.admin.RestaurantId || restaurantId || null;

    const pool = await getConnection();

    // Kullanıcı adı kontrolü
    const usernameCheck = await pool
      .request()
      .input('username', sql.NVarChar, username)
      .query(`SELECT Id FROM AdminUsers WHERE Username = @username`);

    if (usernameCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor',
      });
    }

    const result = await pool
      .request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email || null)
      .input('restaurantId', sql.Int, finalRestaurantId)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
      .query(`
        INSERT INTO AdminUsers (Username, Password, FullName, Email, RestaurantId, IsActive)
        OUTPUT INSERTED.*
        VALUES (@username, @password, @fullName, @email, @restaurantId, @isActive)
      `);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    
    if (error.number === 2627) { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kullanıcı oluşturulurken bir hata oluştu',
    });
  }
});

// Kullanıcı güncelle
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, fullName, email, restaurantId, isActive } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Tam ad gerekli',
      });
    }

    const pool = await getConnection();

    // Önce kullanıcıyı kontrol et
    const userCheck = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT RestaurantId FROM AdminUsers WHERE Id = @id`);

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const existingUser = userCheck.recordset[0];

    // Restoran bazlı kullanıcı ise, sadece kendi restoranının kullanıcılarını güncelleyebilir
    if (req.admin.RestaurantId && existingUser.RestaurantId !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcıyı güncelleme yetkiniz yok',
      });
    }

    // Kullanıcı adı kontrolü (kendisi hariç)
    if (username) {
      const usernameCheck = await pool
        .request()
        .input('username', sql.NVarChar, username)
        .input('id', sql.Int, id)
        .query(`SELECT Id FROM AdminUsers WHERE Username = @username AND Id != @id`);

      if (usernameCheck.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu kullanıcı adı zaten kullanılıyor',
        });
      }
    }

    // Restoran ataması: Sistem admin'i ise restaurantId parametresini kullan, değilse mevcut restoranı koru
    const finalRestaurantId = req.admin.RestaurantId 
      ? req.admin.RestaurantId 
      : (restaurantId !== undefined ? restaurantId : existingUser.RestaurantId);

    // Güncelleme sorgusu (şifre değiştirilirse güncelle)
    let updateQuery = `
      UPDATE AdminUsers
      SET 
        Username = @username,
        FullName = @fullName,
        Email = @email,
        RestaurantId = @restaurantId,
        IsActive = @isActive
    `;

    const updateRequest = pool
      .request()
      .input('id', sql.Int, id)
      .input('username', sql.NVarChar, username || undefined)
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email || null)
      .input('restaurantId', sql.Int, finalRestaurantId)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : true);

    if (password) {
      updateQuery += `, Password = @password`;
      updateRequest.input('password', sql.NVarChar, password);
    }

    updateQuery += ` OUTPUT INSERTED.* WHERE Id = @id`;

    const result = await updateRequest.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı güncellenemedi',
      });
    }

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    
    if (error.number === 2627) { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı zaten kullanılıyor',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Kullanıcı güncellenirken bir hata oluştu',
    });
  }
});

// Kullanıcı durumunu değiştir (aktif/pasif)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir durum değeri gerekli (true/false)',
      });
    }

    const pool = await getConnection();

    // Önce kullanıcıyı kontrol et
    const userCheck = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT RestaurantId FROM AdminUsers WHERE Id = @id`);

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const existingUser = userCheck.recordset[0];

    // Restoran bazlı kullanıcı ise, sadece kendi restoranının kullanıcılarını güncelleyebilir
    if (req.admin.RestaurantId && existingUser.RestaurantId !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcıyı güncelleme yetkiniz yok',
      });
    }

    // Kendi hesabını pasif etmeye izin verme
    if (id == req.admin.Id && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı pasif edemezsiniz',
      });
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE AdminUsers
        SET IsActive = @isActive
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    res.json({
      success: true,
      message: `Kullanıcı ${isActive ? 'aktif' : 'pasif'} edildi`,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Kullanıcı durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı durumu güncellenirken bir hata oluştu',
    });
  }
});

// Kullanıcı sil (soft delete - pasif et)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Önce kullanıcıyı kontrol et
    const userCheck = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT RestaurantId FROM AdminUsers WHERE Id = @id`);

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const existingUser = userCheck.recordset[0];

    // Restoran bazlı kullanıcı ise, sadece kendi restoranının kullanıcılarını silebilir
    if (req.admin.RestaurantId && existingUser.RestaurantId !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kullanıcıyı silme yetkiniz yok',
      });
    }

    // Kendi hesabını silmeye izin verme
    if (id == req.admin.Id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz',
      });
    }

    // Soft delete - pasif et
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE AdminUsers
        SET IsActive = 0
        WHERE Id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla pasif edildi',
    });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinirken bir hata oluştu',
    });
  }
});

export default router;

