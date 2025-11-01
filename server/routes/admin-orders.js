import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';
import { sendCancelledOrderEmail } from '../config/email.js';

const router = express.Router();

// Tüm siparişleri getir
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pool = await getConnection();

    // Restoran bazlı kullanıcı ise, OrderItems üzerinden restoran filtresi uygula
    let query = `
      SELECT DISTINCT
        o.Id, o.OrderNumber, o.CustomerName, o.CustomerPhone, o.CustomerAddress,
        o.Notes, o.TotalAmount, o.Status, o.CreatedAt, o.UpdatedAt
      FROM Orders o
    `;

    const conditions = [];
    const request = pool.request();

    // Restoran bazlı filtreleme
    if (req.admin.RestaurantId) {
      query += ' INNER JOIN OrderItems oi ON o.Id = oi.OrderId';
      conditions.push('oi.RestaurantId = @restaurantId');
      request.input('restaurantId', sql.Int, req.admin.RestaurantId);
    }

    // Mutfak kuyruğu: Sadece ödemesi yapılmış veya offline ödeme bekleyen siparişler
    // Online (Paid) ve offline (AwaitingPayment) siparişler aynı kuyruğa düşer
    conditions.push("o.PaymentStatus IN ('Paid', 'AwaitingPayment')");

    if (status) {
      conditions.push('o.Status = @status');
      request.input('status', sql.NVarChar, status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY o.CreatedAt DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const result = await request.query(query);

    // Toplam sayı
    let countQuery = `
      SELECT COUNT(DISTINCT o.Id) as total 
      FROM Orders o
    `;
    
    if (req.admin.RestaurantId) {
      countQuery += ' INNER JOIN OrderItems oi ON o.Id = oi.OrderId';
    }
    
    const countConditions = [];
    if (req.admin.RestaurantId) {
      countConditions.push('oi.RestaurantId = @countRestaurantId');
    }
    // Mutfak kuyruğu: Sadece ödemesi yapılmış veya offline ödeme bekleyen siparişler
    countConditions.push("o.PaymentStatus IN ('Paid', 'AwaitingPayment')");
    if (status) {
      countConditions.push('o.Status = @countStatus');
    }
    
    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countRequest = pool.request();
    if (req.admin.RestaurantId) {
      countRequest.input('countRestaurantId', sql.Int, req.admin.RestaurantId);
    }
    if (status) {
      countRequest.input('countStatus', sql.NVarChar, status);
    }

    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      data: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Sipariş listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler yüklenirken bir hata oluştu',
    });
  }
});

// Sipariş detayı
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const orderResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT *
        FROM Orders
        WHERE Id = @id
      `);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    const order = orderResult.recordset[0];

    // Sipariş öğelerini getir
    let itemsQuery = `
      SELECT *
      FROM OrderItems
      WHERE OrderId = @orderId
    `;
    
    const itemsRequest = pool.request().input('orderId', sql.Int, id);
    
    // Restoran bazlı kullanıcı ise sadece kendi restoranının ürünlerini göster
    if (req.admin.RestaurantId) {
      itemsQuery += ' AND RestaurantId = @restaurantId';
      itemsRequest.input('restaurantId', sql.Int, req.admin.RestaurantId);
    }
    
    const itemsResult = await itemsRequest.query(itemsQuery);

    // Eğer restoran bazlı kullanıcı ise ve bu siparişte hiç ürün yoksa erişim reddedilir
    if (req.admin.RestaurantId && itemsResult.recordset.length === 0) {
      // Siparişin başka restoranlara ait ürünleri olup olmadığını kontrol et
      const otherItemsCheck = await pool
        .request()
        .input('orderId', sql.Int, id)
        .query(`
          SELECT COUNT(*) as count
          FROM OrderItems
          WHERE OrderId = @orderId
        `);
      
      if (otherItemsCheck.recordset[0].count > 0) {
        return res.status(403).json({
          success: false,
          message: 'Bu siparişe erişim yetkiniz yok',
        });
      }
    }

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

// Sipariş durumu güncelle
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz sipariş durumu',
      });
    }

    const pool = await getConnection();

    // Restoran bazlı kullanıcı ise, siparişte kendi restoranının ürünü olup olmadığını kontrol et
    if (req.admin.RestaurantId) {
      const orderCheck = await pool
        .request()
        .input('orderId', sql.Int, id)
        .input('restaurantId', sql.Int, req.admin.RestaurantId)
        .query(`
          SELECT COUNT(*) as count
          FROM OrderItems
          WHERE OrderId = @orderId AND RestaurantId = @restaurantId
        `);
      
      if (orderCheck.recordset[0].count === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bu siparişi güncelleme yetkiniz yok',
        });
      }
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE Orders
        SET Status = @status, UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Sipariş durumu güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Sipariş durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş durumu güncellenirken bir hata oluştu',
    });
  }
});

// Sipariş notunu güncelle
router.patch('/:id/notes', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const pool = await getConnection();

    // Restoran bazlı kullanıcı ise, siparişte kendi restoranının ürünü olup olmadığını kontrol et
    if (req.admin.RestaurantId) {
      const orderCheck = await pool
        .request()
        .input('orderId', sql.Int, id)
        .input('restaurantId', sql.Int, req.admin.RestaurantId)
        .query(`
          SELECT COUNT(*) as count
          FROM OrderItems
          WHERE OrderId = @orderId AND RestaurantId = @restaurantId
        `);
      
      if (orderCheck.recordset[0].count === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bu siparişi güncelleme yetkiniz yok',
        });
      }
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        UPDATE Orders
        SET Notes = @notes, UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Sipariş notu güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Sipariş not güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş notu güncellenirken bir hata oluştu',
    });
  }
});

// Sipariş sil
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // İptal nedeni
    const pool = await getConnection();

    // Restoran bazlı kullanıcı ise, siparişte kendi restoranının ürünü olup olmadığını kontrol et
    if (req.admin.RestaurantId) {
      const orderCheck = await pool
        .request()
        .input('orderId', sql.Int, id)
        .input('restaurantId', sql.Int, req.admin.RestaurantId)
        .query(`
          SELECT COUNT(*) as count
          FROM OrderItems
          WHERE OrderId = @orderId AND RestaurantId = @restaurantId
        `);
      
      if (orderCheck.recordset[0].count === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bu siparişi iptal etme yetkiniz yok',
        });
      }
    }

    // Önce sipariş bilgilerini al
    const orderResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT *
        FROM Orders
        WHERE Id = @id
      `);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    const order = orderResult.recordset[0];

    // Sipariş ürünlerini al
    const itemsResult = await pool
      .request()
      .input('orderId', sql.Int, id)
      .query(`
        SELECT *
        FROM OrderItems
        WHERE OrderId = @orderId
      `);

    const orderItems = itemsResult.recordset.map((item) => ({
      ProductName: item.ProductName,
      ProductPrice: parseFloat(item.ProductPrice),
      Quantity: item.Quantity,
      Subtotal: parseFloat(item.Subtotal),
    }));

    // Siparişi iptal et
    const updateResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Orders
        SET Status = 'Cancelled', UpdatedAt = GETDATE()
        WHERE Id = @id
      `);

    if (updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş iptal edilemedi',
      });
    }

    // E-posta gönder (arka planda)
    const orderData = {
      OrderNumber: order.OrderNumber,
      CustomerName: order.CustomerName,
      CustomerPhone: order.CustomerPhone,
      CustomerAddress: order.CustomerAddress,
      Notes: order.Notes,
      TotalAmount: parseFloat(order.TotalAmount),
      CreatedAt: order.CreatedAt,
    };

    sendCancelledOrderEmail(orderData, orderItems, reason).catch((err) =>
      console.error('İptal e-postası gönderimi başarısız:', err)
    );

    res.json({
      success: true,
      message: 'Sipariş iptal edildi ve bildirim gönderildi',
    });
  } catch (error) {
    console.error('Sipariş silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş iptal edilirken bir hata oluştu',
    });
  }
});

export default router;

