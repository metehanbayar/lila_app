import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Tüm ürünleri getir (aktif ve pasif dahil - admin için)
router.get('/', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();
    
    let query = `
      SELECT 
        p.Id, p.RestaurantId, p.CategoryId, p.Name, p.Description,
        p.Price, p.ImageUrl, p.IsActive, p.IsFeatured, p.DisplayOrder,
        p.CreatedAt, p.UpdatedAt,
        r.Name as RestaurantName, r.Slug as RestaurantSlug,
        c.Name as CategoryName
      FROM Products p
      LEFT JOIN Restaurants r ON p.RestaurantId = r.Id
      LEFT JOIN Categories c ON p.CategoryId = c.Id
    `;
    
    const request = pool.request();
    
    // Restoran bazlı kullanıcı ise sadece kendi restoranının ürünlerini göster
    if (req.admin.RestaurantId) {
      query += ' WHERE p.RestaurantId = @restaurantId';
      request.input('restaurantId', sql.Int, req.admin.RestaurantId);
    }
    
    query += ' ORDER BY r.Name, c.Name, p.DisplayOrder, p.Name';
    
    const result = await request.query(query);

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

// Restorana ait ürünler (aktif ve pasif dahil - admin için)
router.get('/restaurant/:restaurantId', adminAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Restoran bazlı kullanıcı ise sadece kendi restoranının ürünlerini görebilir
    if (req.admin.RestaurantId && parseInt(restaurantId) !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu restorana erişim yetkiniz yok',
      });
    }
    
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
        WHERE p.RestaurantId = @restaurantId
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

    const product = result.recordset[0];

    // Restoran bazlı kullanıcı ise sadece kendi restoranının ürünlerini görebilir
    if (req.admin.RestaurantId && product.RestaurantId !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu ürüne erişim yetkiniz yok',
      });
    }

    res.json({
      success: true,
      data: product,
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

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Ürün adı ve fiyat gerekli',
      });
    }

    // Restoran bazlı kullanıcı ise sadece kendi restoranı için ürün oluşturabilir
    const finalRestaurantId = req.admin.RestaurantId || restaurantId;
    
    if (!finalRestaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restoran bilgisi gerekli',
      });
    }

    // Restoran bazlı kullanıcı ise, parametre olarak gelen restaurantId'yi yok say
    if (req.admin.RestaurantId && restaurantId && restaurantId !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu restoran için ürün oluşturamazsınız',
      });
    }

    const pool = await getConnection();

    const result = await pool
      .request()
      .input('restaurantId', sql.Int, finalRestaurantId)
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

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Ürün adı ve fiyat gerekli',
      });
    }

    const pool = await getConnection();

    // Önce ürünü kontrol et
    const productCheck = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT RestaurantId FROM Products WHERE Id = @id`);

    if (productCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    const existingProduct = productCheck.recordset[0];

    // Restoran bazlı kullanıcı ise sadece kendi restoranının ürünlerini güncelleyebilir
    if (req.admin.RestaurantId && existingProduct.RestaurantId !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu ürünü güncelleme yetkiniz yok',
      });
    }

    // Restoran bazlı kullanıcı ise sadece kendi restoranı için ürün güncelleyebilir
    const finalRestaurantId = req.admin.RestaurantId || restaurantId || existingProduct.RestaurantId;

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('restaurantId', sql.Int, finalRestaurantId)
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

    // Önce ürünü kontrol et
    const productCheck = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT RestaurantId FROM Products WHERE Id = @id`);

    if (productCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    const existingProduct = productCheck.recordset[0];

    // Restoran bazlı kullanıcı ise sadece kendi restoranının ürünlerini silebilir
    if (req.admin.RestaurantId && existingProduct.RestaurantId !== req.admin.RestaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu ürünü silme yetkiniz yok',
      });
    }

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

// Ürün durumunu değiştir (aktif/pasif)
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

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('isActive', sql.Bit, isActive)
      .query(`
        UPDATE Products
        SET IsActive = @isActive, UpdatedAt = GETDATE()
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
      message: `Ürün ${isActive ? 'aktif' : 'pasif'} edildi`,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Ürün durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün durumu güncellenirken bir hata oluştu',
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

