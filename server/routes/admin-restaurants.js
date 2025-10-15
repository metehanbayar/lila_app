import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Restoranlarımızı getir (aktif ve pasif)
router.get('/', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        Id, Name, Slug, Description, Color, ImageUrl, IsActive,
        CreatedAt, UpdatedAt
      FROM Restaurants
      ORDER BY Id
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Restoran listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Restoranlar yüklenirken bir hata oluştu',
    });
  }
});

// Tek restoran detayı
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          Id, Name, Slug, Description, Color, ImageUrl, IsActive,
          CreatedAt, UpdatedAt
        FROM Restaurants
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Restoran detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Restoran bilgisi yüklenirken bir hata oluştu',
    });
  }
});

// Yeni restoran oluştur
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, slug, description, color, imageUrl } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Restoran adı ve slug gerekli',
      });
    }

    const pool = await getConnection();

    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('slug', sql.NVarChar, slug)
      .input('description', sql.NVarChar, description || null)
      .input('color', sql.NVarChar, color || '#EC4899')
      .input('imageUrl', sql.NVarChar, imageUrl || null)
      .query(`
        INSERT INTO Restaurants (Name, Slug, Description, Color, ImageUrl)
        OUTPUT INSERTED.*
        VALUES (@name, @slug, @description, @color, @imageUrl)
      `);

    res.status(201).json({
      success: true,
      message: 'Restoran başarıyla oluşturuldu',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Restoran oluşturma hatası:', error);
    
    if (error.number === 2627) { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Bu slug zaten kullanılıyor',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Restoran oluşturulurken bir hata oluştu',
    });
  }
});

// Restoran güncelle
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, color, imageUrl, isActive } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Restoran adı ve slug gerekli',
      });
    }

    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('slug', sql.NVarChar, slug)
      .input('description', sql.NVarChar, description || null)
      .input('color', sql.NVarChar, color || '#EC4899')
      .input('imageUrl', sql.NVarChar, imageUrl || null)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
      .query(`
        UPDATE Restaurants
        SET 
          Name = @name,
          Slug = @slug,
          Description = @description,
          Color = @color,
          ImageUrl = @imageUrl,
          IsActive = @isActive,
          UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Restoran başarıyla güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Restoran güncelleme hatası:', error);
    
    if (error.number === 2627) {
      return res.status(400).json({
        success: false,
        message: 'Bu slug zaten kullanılıyor',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Restoran güncellenirken bir hata oluştu',
    });
  }
});

// Restoran sil
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Soft delete - IsActive = 0
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Restaurants
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE Id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Restoran başarıyla silindi',
    });
  } catch (error) {
    console.error('Restoran silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Restoran silinirken bir hata oluştu',
    });
  }
});

export default router;

