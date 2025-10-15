import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { customerAuth } from './customer-auth.js';

const router = express.Router();

// Müşterinin tüm siparişlerini getir
router.get('/my-orders', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pool = await getConnection();

    // Siparişleri getir
    const offset = (page - 1) * limit;
    const ordersResult = await pool
      .request()
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT 
          Id, OrderNumber, CustomerName, CustomerPhone, CustomerAddress,
          Notes, TotalAmount, Status, CreatedAt
        FROM Orders
        WHERE CustomerId = @customerId
        ORDER BY CreatedAt DESC
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `);

    // Toplam sipariş sayısı
    const countResult = await pool
      .request()
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT COUNT(*) as total
        FROM Orders
        WHERE CustomerId = @customerId
      `);

    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      data: ordersResult.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Siparişler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler yüklenirken bir hata oluştu',
    });
  }
});

// Tek sipariş detayı
router.get('/my-orders/:orderNumber', customerAuth, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const pool = await getConnection();

    // Siparişi getir ve müşteriye ait olduğunu doğrula
    const orderResult = await pool
      .request()
      .input('orderNumber', sql.NVarChar, orderNumber)
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT *
        FROM Orders
        WHERE OrderNumber = @orderNumber 
        AND (CustomerId = @customerId OR CustomerId IS NULL)
      `);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    const order = orderResult.recordset[0];

    // Sipariş ürünlerini getir
    const itemsResult = await pool
      .request()
      .input('orderId', sql.Int, order.Id)
      .query(`
        SELECT *
        FROM OrderItems
        WHERE OrderId = @orderId
      `);

    res.json({
      success: true,
      data: {
        order,
        items: itemsResult.recordset,
      },
    });
  } catch (error) {
    console.error('Sipariş detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş bilgisi yüklenirken bir hata oluştu',
    });
  }
});

// İstatistikler
router.get('/statistics', customerAuth, async (req, res) => {
  try {
    const pool = await getConnection();

    // Toplam sipariş sayısı
    const totalOrdersResult = await pool
      .request()
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT COUNT(*) as count
        FROM Orders
        WHERE CustomerId = @customerId
      `);

    // Toplam harcama
    const totalSpentResult = await pool
      .request()
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT ISNULL(SUM(TotalAmount), 0) as total
        FROM Orders
        WHERE CustomerId = @customerId AND Status != 'Cancelled'
      `);

    // Son sipariş
    const lastOrderResult = await pool
      .request()
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT TOP 1 OrderNumber, CreatedAt, TotalAmount, Status
        FROM Orders
        WHERE CustomerId = @customerId
        ORDER BY CreatedAt DESC
      `);

    // Sipariş durumları
    const statusCountResult = await pool
      .request()
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT Status, COUNT(*) as count
        FROM Orders
        WHERE CustomerId = @customerId
        GROUP BY Status
      `);

    res.json({
      success: true,
      data: {
        totalOrders: totalOrdersResult.recordset[0].count,
        totalSpent: totalSpentResult.recordset[0].total,
        lastOrder: lastOrderResult.recordset[0] || null,
        ordersByStatus: statusCountResult.recordset,
      },
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler yüklenirken bir hata oluştu',
    });
  }
});

// Favorilere ekle
router.post('/favorites/:productId', customerAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const pool = await getConnection();

    // Ürün var mı kontrol et
    const productCheck = await pool
      .request()
      .input('productId', sql.Int, productId)
      .query(`
        SELECT Id FROM Products WHERE Id = @productId AND IsActive = 1
      `);

    if (productCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    // Favorilere ekle (duplicate kontrolü UNIQUE constraint ile)
    try {
      await pool
        .request()
        .input('customerId', sql.Int, req.customer.Id)
        .input('productId', sql.Int, productId)
        .query(`
          INSERT INTO CustomerFavorites (CustomerId, ProductId)
          VALUES (@customerId, @productId)
        `);

      res.json({
        success: true,
        message: 'Ürün favorilere eklendi',
      });
    } catch (err) {
      if (err.number === 2627) { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'Ürün zaten favorilerde',
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('Favori ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Favorilere eklenirken bir hata oluştu',
    });
  }
});

// Favorilerden çıkar
router.delete('/favorites/:productId', customerAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const pool = await getConnection();

    await pool
      .request()
      .input('customerId', sql.Int, req.customer.Id)
      .input('productId', sql.Int, productId)
      .query(`
        DELETE FROM CustomerFavorites
        WHERE CustomerId = @customerId AND ProductId = @productId
      `);

    res.json({
      success: true,
      message: 'Ürün favorilerden çıkarıldı',
    });
  } catch (error) {
    console.error('Favori çıkarma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Favorilerden çıkarılırken bir hata oluştu',
    });
  }
});

// Favori ürünleri listele
router.get('/favorites', customerAuth, async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('customerId', sql.Int, req.customer.Id)
      .query(`
        SELECT 
          p.Id, p.Name, p.Description, p.Price, p.ImageUrl,
          p.RestaurantId, r.Name as RestaurantName,
          f.CreatedAt as AddedAt
        FROM CustomerFavorites f
        INNER JOIN Products p ON f.ProductId = p.Id
        INNER JOIN Restaurants r ON p.RestaurantId = r.Id
        WHERE f.CustomerId = @customerId AND p.IsActive = 1
        ORDER BY f.CreatedAt DESC
      `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Favoriler getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Favoriler yüklenirken bir hata oluştu',
    });
  }
});

export default router;

