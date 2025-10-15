import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Tüm siparişleri getir
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pool = await getConnection();

    let query = `
      SELECT 
        Id, OrderNumber, CustomerName, CustomerPhone, CustomerAddress,
        Notes, TotalAmount, Status, CreatedAt, UpdatedAt
      FROM Orders
    `;

    const conditions = [];
    const request = pool.request();

    if (status) {
      conditions.push('Status = @status');
      request.input('status', sql.NVarChar, status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY CreatedAt DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const result = await request.query(query);

    // Toplam sayı
    let countQuery = 'SELECT COUNT(*) as total FROM Orders';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countRequest = pool.request();
    if (status) {
      countRequest.input('status', sql.NVarChar, status);
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

    const itemsResult = await pool
      .request()
      .input('orderId', sql.Int, id)
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
    const pool = await getConnection();

    // Siparişi iptal et
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Orders
        SET Status = 'Cancelled', UpdatedAt = GETDATE()
        WHERE Id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Sipariş iptal edildi',
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

