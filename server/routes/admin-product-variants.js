import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Ürüne ait tüm varyantları getir
router.get('/product/:productId', adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT 
          Id, ProductId, Name, Price, IsDefault, DisplayOrder, IsActive,
          CreatedAt, UpdatedAt
        FROM ProductVariants
        WHERE ProductId = @productId
        ORDER BY DisplayOrder, Name
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Varyant listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Varyantlar yüklenirken bir hata oluştu',
    });
  }
});

// Tek varyant detayı
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          Id, ProductId, Name, Price, IsDefault, DisplayOrder, IsActive,
          CreatedAt, UpdatedAt
        FROM ProductVariants
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Varyant bulunamadı',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Varyant detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Varyant bilgisi yüklenirken bir hata oluştu',
    });
  }
});

// Yeni varyant oluştur
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      productId,
      name,
      price,
      isDefault,
      displayOrder,
    } = req.body;

    if (!productId || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Ürün ID, varyant adı ve fiyat gerekli',
      });
    }

    const pool = await getConnection();

    // Eğer bu varsayılan olacaksa, diğerlerinin varsayılan flagini kaldır
    if (isDefault) {
      await pool
        .request()
        .input('productId', sql.Int, productId)
        .query(`
          UPDATE ProductVariants
          SET IsDefault = 0
          WHERE ProductId = @productId
        `);
    }

    const result = await pool
      .request()
      .input('productId', sql.Int, productId)
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(10, 2), price)
      .input('isDefault', sql.Bit, isDefault || false)
      .input('displayOrder', sql.Int, displayOrder || 0)
      .query(`
        INSERT INTO ProductVariants (
          ProductId, Name, Price, IsDefault, DisplayOrder
        )
        OUTPUT INSERTED.*
        VALUES (
          @productId, @name, @price, @isDefault, @displayOrder
        )
      `);

    res.status(201).json({
      success: true,
      message: 'Varyant başarıyla oluşturuldu',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Varyant oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Varyant oluşturulurken bir hata oluştu',
    });
  }
});

// Varyant güncelle
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      isDefault,
      displayOrder,
      isActive,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Varyant adı ve fiyat gerekli',
      });
    }

    const pool = await getConnection();

    // Önce varyantın productId'sini al
    const variantResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT ProductId FROM ProductVariants WHERE Id = @id');

    if (variantResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Varyant bulunamadı',
      });
    }

    const productId = variantResult.recordset[0].ProductId;

    // Eğer bu varsayılan olacaksa, diğerlerinin varsayılan flagini kaldır
    if (isDefault) {
      await pool
        .request()
        .input('productId', sql.Int, productId)
        .input('id', sql.Int, id)
        .query(`
          UPDATE ProductVariants
          SET IsDefault = 0
          WHERE ProductId = @productId AND Id != @id
        `);
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(10, 2), price)
      .input('isDefault', sql.Bit, isDefault !== undefined ? isDefault : false)
      .input('displayOrder', sql.Int, displayOrder || 0)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
      .query(`
        UPDATE ProductVariants
        SET 
          Name = @name,
          Price = @price,
          IsDefault = @isDefault,
          DisplayOrder = @displayOrder,
          IsActive = @isActive,
          UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Varyant bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Varyant başarıyla güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Varyant güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Varyant güncellenirken bir hata oluştu',
    });
  }
});

// Varyant sil
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Soft delete
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE ProductVariants
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE Id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Varyant bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Varyant başarıyla silindi',
    });
  } catch (error) {
    console.error('Varyant silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Varyant silinirken bir hata oluştu',
    });
  }
});

// Toplu varyant güncelleme (bir ürün için tüm varyantları güncelle)
router.post('/bulk-update/:productId', adminAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { variants } = req.body; // Array of variant objects

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Varyant listesi gerekli',
      });
    }

    const pool = await getConnection();

    // Transaction başlat
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Önce tüm varyantları pasif yap
      await transaction.request()
        .input('productId', sql.Int, productId)
        .query('UPDATE ProductVariants SET IsActive = 0 WHERE ProductId = @productId');

      // Her varyantı ekle veya güncelle
      for (const variant of variants) {
        if (variant.id) {
          // Güncelle
          await transaction.request()
            .input('id', sql.Int, variant.id)
            .input('name', sql.NVarChar, variant.name)
            .input('price', sql.Decimal(10, 2), variant.price)
            .input('isDefault', sql.Bit, variant.isDefault || false)
            .input('displayOrder', sql.Int, variant.displayOrder || 0)
            .query(`
              UPDATE ProductVariants
              SET Name = @name, Price = @price, IsDefault = @isDefault, 
                  DisplayOrder = @displayOrder, IsActive = 1, UpdatedAt = GETDATE()
              WHERE Id = @id
            `);
        } else {
          // Yeni ekle
          await transaction.request()
            .input('productId', sql.Int, productId)
            .input('name', sql.NVarChar, variant.name)
            .input('price', sql.Decimal(10, 2), variant.price)
            .input('isDefault', sql.Bit, variant.isDefault || false)
            .input('displayOrder', sql.Int, variant.displayOrder || 0)
            .query(`
              INSERT INTO ProductVariants (ProductId, Name, Price, IsDefault, DisplayOrder)
              VALUES (@productId, @name, @price, @isDefault, @displayOrder)
            `);
        }
      }

      await transaction.commit();

      // Güncel varyantları getir
      const result = await pool.request()
        .input('productId', sql.Int, productId)
        .query(`
          SELECT Id, ProductId, Name, Price, IsDefault, DisplayOrder, IsActive
          FROM ProductVariants
          WHERE ProductId = @productId AND IsActive = 1
          ORDER BY DisplayOrder, Name
        `);

      res.json({
        success: true,
        message: 'Varyantlar başarıyla güncellendi',
        data: result.recordset,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Toplu varyant güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Varyantlar güncellenirken bir hata oluştu',
    });
  }
});

export default router;

