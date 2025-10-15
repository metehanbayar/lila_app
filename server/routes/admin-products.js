import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Tüm ürünleri getir (sadece aktif olanlar)
router.get('/', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        p.Id, p.RestaurantId, p.CategoryId, p.Name, p.Description,
        p.Price, p.ImageUrl, p.IsActive, p.IsFeatured, p.DisplayOrder,
        p.CreatedAt, p.UpdatedAt,
        r.Name as RestaurantName, r.Slug as RestaurantSlug,
        c.Name as CategoryName
      FROM Products p
      LEFT JOIN Restaurants r ON p.RestaurantId = r.Id
      LEFT JOIN Categories c ON p.CategoryId = c.Id
      WHERE p.IsActive = 1
      ORDER BY r.Name, c.Name, p.DisplayOrder, p.Name
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Ürün listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler yüklenirken bir hata oluştu',
    });
  }
});

// Restorana ait ürünler (sadece aktif olanlar)
router.get('/restaurant/:restaurantId', adminAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('restaurantId', sql.Int, restaurantId)
      .query(`
        SELECT 
          p.Id, p.RestaurantId, p.CategoryId, p.Name, p.Description,
          p.Price, p.ImageUrl, p.IsActive, p.IsFeatured, p.DisplayOrder,
          c.Name as CategoryName
        FROM Products p
        LEFT JOIN Categories c ON p.CategoryId = c.Id
        WHERE p.RestaurantId = @restaurantId AND p.IsActive = 1
        ORDER BY c.Name, p.DisplayOrder, p.Name
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Restoran ürünleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler yüklenirken bir hata oluştu',
    });
  }
});

// Tek ürün detayı
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          p.Id, p.RestaurantId, p.CategoryId, p.Name, p.Description,
          p.Price, p.ImageUrl, p.IsActive, p.IsFeatured, p.DisplayOrder,
          p.CreatedAt, p.UpdatedAt,
          r.Name as RestaurantName,
          c.Name as CategoryName
        FROM Products p
        LEFT JOIN Restaurants r ON p.RestaurantId = r.Id
        LEFT JOIN Categories c ON p.CategoryId = c.Id
        WHERE p.Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Ürün detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün bilgisi yüklenirken bir hata oluştu',
    });
  }
});

// Yeni ürün oluştur
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      restaurantId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isFeatured,
      displayOrder,
    } = req.body;

    if (!restaurantId || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Restoran, ürün adı ve fiyat gerekli',
      });
    }

    const pool = await getConnection();

    const result = await pool
      .request()
      .input('restaurantId', sql.Int, restaurantId)
      .input('categoryId', sql.Int, categoryId || null)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('price', sql.Decimal(10, 2), price)
      .input('imageUrl', sql.NVarChar, imageUrl || null)
      .input('isFeatured', sql.Bit, isFeatured || false)
      .input('displayOrder', sql.Int, displayOrder || 0)
      .query(`
        INSERT INTO Products (
          RestaurantId, CategoryId, Name, Description, Price,
          ImageUrl, IsFeatured, DisplayOrder
        )
        OUTPUT INSERTED.*
        VALUES (
          @restaurantId, @categoryId, @name, @description, @price,
          @imageUrl, @isFeatured, @displayOrder
        )
      `);

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün oluşturulurken bir hata oluştu',
    });
  }
});

// Ürün güncelle
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      restaurantId,
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isActive,
      isFeatured,
      displayOrder,
    } = req.body;

    if (!restaurantId || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Restoran, ürün adı ve fiyat gerekli',
      });
    }

    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('restaurantId', sql.Int, restaurantId)
      .input('categoryId', sql.Int, categoryId || null)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .input('price', sql.Decimal(10, 2), price)
      .input('imageUrl', sql.NVarChar, imageUrl || null)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : true)
      .input('isFeatured', sql.Bit, isFeatured || false)
      .input('displayOrder', sql.Int, displayOrder || 0)
      .query(`
        UPDATE Products
        SET 
          RestaurantId = @restaurantId,
          CategoryId = @categoryId,
          Name = @name,
          Description = @description,
          Price = @price,
          ImageUrl = @imageUrl,
          IsActive = @isActive,
          IsFeatured = @isFeatured,
          DisplayOrder = @displayOrder,
          UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün güncellenirken bir hata oluştu',
    });
  }
});

// Ürün sil
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Sipariş detaylarındaki ürünü kontrol et (OrderItems tablosu)
    const orderCheck = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT COUNT(*) as count FROM OrderItems WHERE ProductId = @id`);

    if (orderCheck.recordset[0].count > 0) {
      // Eğer siparişlerde kullanılmışsa soft delete yap
      const result = await pool
        .request()
        .input('id', sql.Int, id)
        .query(`
          UPDATE Products
          SET IsActive = 0, UpdatedAt = GETDATE()
          WHERE Id = @id
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ürün bulunamadı',
        });
      }

      return res.json({
        success: true,
        message: 'Ürün pasif edildi (siparişlerde kullanıldığı için tamamen silinemiyor)',
      });
    }

    // Önce varyantları sil (eğer varsa)
    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ProductVariants')
        DELETE FROM ProductVariants WHERE ProductId = @id
      `);

    // Favorilerden sil (eğer tablo varsa)
    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CustomerFavorites')
        DELETE FROM CustomerFavorites WHERE ProductId = @id
      `);

    // Hard delete - Ürünü tamamen sil
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM Products WHERE Id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Ürün başarıyla silindi',
    });
  } catch (error) {
    console.error('Ürün silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün silinirken bir hata oluştu',
    });
  }
});

// Ürün sırasını güncelle (bulk update)
router.post('/reorder', adminAuth, async (req, res) => {
  try {
    const { productOrders } = req.body; // [{ productId: 1, displayOrder: 0 }, ...]

    if (!productOrders || !Array.isArray(productOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Ürün sıralama bilgisi gerekli',
      });
    }

    const pool = await getConnection();

    // Her ürün için DisplayOrder güncelle
    for (const { productId, displayOrder } of productOrders) {
      await pool
        .request()
        .input('productId', sql.Int, productId)
        .input('displayOrder', sql.Int, displayOrder)
        .query(`
          UPDATE Products
          SET DisplayOrder = @displayOrder, UpdatedAt = GETDATE()
          WHERE Id = @productId
        `);
    }

    res.json({
      success: true,
      message: 'Ürün sıralaması başarıyla güncellendi',
    });
  } catch (error) {
    console.error('Ürün sıralama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün sıralaması güncellenirken bir hata oluştu',
    });
  }
});

export default router;

