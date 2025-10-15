import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Tüm kategorileri getir (global/ortak kategoriler)
router.get('/', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        c.Id, c.Name, c.Icon, c.Color, c.IsActive, c.CreatedAt
      FROM Categories c
      ORDER BY c.Name
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Kategori listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler yüklenirken bir hata oluştu',
    });
  }
});

// Tüm aktif kategorileri getir (restoran bazlı değil artık)
router.get('/active', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT Id, Name, Icon, Color
      FROM Categories
      WHERE IsActive = 1
      ORDER BY Name
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Aktif kategoriler hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler yüklenirken bir hata oluştu',
    });
  }
});

// Restoran-kategori atama sistemi kaldırıldı - kategoriler artık tüm restoranlar için ortak

// Tek kategori detayı
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT Id, Name, Icon, Color, IsActive, CreatedAt
        FROM Categories
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Kategori detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori bilgisi yüklenirken bir hata oluştu',
    });
  }
});

// Yeni kategori oluştur (global)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Kategori adı gerekli',
      });
    }

    const pool = await getConnection();

    // Aynı isimde kategori var mı kontrol et
    const existing = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .query(`SELECT Id FROM Categories WHERE Name = @name`);

    if (existing.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir kategori zaten mevcut',
      });
    }

    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('icon', sql.NVarChar, icon || 'Utensils')
      .input('color', sql.NVarChar, color || 'bg-gray-500')
      .query(`
        INSERT INTO Categories (Name, Icon, Color)
        OUTPUT INSERTED.*
        VALUES (@name, @icon, @color)
      `);

    res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori oluşturulurken bir hata oluştu',
    });
  }
});

// Kategori güncelle
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Kategori adı gerekli',
      });
    }

    const pool = await getConnection();

    // Aynı isimde başka kategori var mı kontrol et
    const existing = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('id', sql.Int, id)
      .query(`SELECT Id FROM Categories WHERE Name = @name AND Id != @id`);

    if (existing.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir kategori zaten mevcut',
      });
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('icon', sql.NVarChar, icon || 'Utensils')
      .input('color', sql.NVarChar, color || 'bg-gray-500')
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
      .query(`
        UPDATE Categories
        SET 
          Name = @name,
          Icon = @icon,
          Color = @color,
          IsActive = @isActive
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Kategori güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori güncellenirken bir hata oluştu',
    });
  }
});

// Kategori sil
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Kategoriye ait ürün var mı kontrol et
    const productsCheck = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT COUNT(*) as count
        FROM Products
        WHERE CategoryId = @id AND IsActive = 1
      `);

    if (productsCheck.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategoriye ait aktif ürünler var. Önce ürünleri silin veya başka bir kategoriye taşıyın.',
      });
    }

    // Kategoriyi pasif et (soft delete)
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Categories
        SET IsActive = 0
        WHERE Id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi',
    });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori silinirken bir hata oluştu',
    });
  }
});

export default router;
