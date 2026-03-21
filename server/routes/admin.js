import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { issueToken, verifyToken } from '../services/auth-token.js';

const router = express.Router();

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Yetkilendirme token\'ı bulunamadı',
      });
    }

    const payload = verifyToken(token);
    if (payload.role !== 'admin' || !payload.sub) {
      throw new Error('Invalid admin token.');
    }

    const adminId = Number.parseInt(payload.sub, 10);
    if (!Number.isInteger(adminId) || adminId <= 0) {
      throw new Error('Invalid admin id in token.');
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, adminId)
      .query(`
        SELECT au.Id, au.Username, au.FullName, au.Email, au.IsActive, au.RestaurantId,
               r.Name as RestaurantName
        FROM AdminUsers au
        LEFT JOIN Restaurants r ON au.RestaurantId = r.Id
        WHERE au.Id = @id AND au.IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz yetkilendirme',
      });
    }

    req.admin = result.recordset[0];
    next();
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(401).json({
      success: false,
      message: 'Yetkilendirme hatası',
    });
  }
};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı ve şifre gerekli',
      });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT au.Id, au.Username, au.FullName, au.Email, au.IsActive, au.RestaurantId,
               r.Name as RestaurantName
        FROM AdminUsers au
        LEFT JOIN Restaurants r ON au.RestaurantId = r.Id
        WHERE au.Username = @username AND au.Password = @password AND au.IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı',
      });
    }

    const admin = result.recordset[0];

    await pool
      .request()
      .input('id', sql.Int, admin.Id)
      .query(`
        UPDATE AdminUsers
        SET LastLogin = GETDATE()
        WHERE Id = @id
      `);

    const token = issueToken({
      role: 'admin',
      sub: String(admin.Id),
      username: admin.Username,
    });

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.Id,
          username: admin.Username,
          fullName: admin.FullName,
          email: admin.Email,
          restaurantId: admin.RestaurantId,
          restaurantName: admin.RestaurantName,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş yapılırken bir hata oluştu',
    });
  }
});

router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();

    const restaurantCount = await pool.request().query(`
      SELECT COUNT(*) as count FROM Restaurants WHERE IsActive = 1
    `);

    const productCount = await pool.request().query(`
      SELECT COUNT(*) as count FROM Products WHERE IsActive = 1
    `);

    const orderCount = await pool.request().query(`
      SELECT COUNT(*) as count FROM Orders
    `);

    const todayOrderCount = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM Orders
      WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
    `);

    const totalRevenue = await pool.request().query(`
      SELECT ISNULL(SUM(TotalAmount), 0) as total
      FROM Orders
      WHERE Status != 'Cancelled'
    `);

    const todayRevenue = await pool.request().query(`
      SELECT ISNULL(SUM(TotalAmount), 0) as total
      FROM Orders
      WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)
      AND Status != 'Cancelled'
    `);

    const ordersByStatus = await pool.request().query(`
      SELECT Status, COUNT(*) as count
      FROM Orders
      GROUP BY Status
    `);

    res.json({
      success: true,
      data: {
        restaurants: restaurantCount.recordset[0].count,
        products: productCount.recordset[0].count,
        totalOrders: orderCount.recordset[0].count,
        todayOrders: todayOrderCount.recordset[0].count,
        totalRevenue: totalRevenue.recordset[0].total,
        todayRevenue: todayRevenue.recordset[0].total,
        ordersByStatus: ordersByStatus.recordset,
      },
    });
  } catch (error) {
    console.error('Dashboard stats hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler yüklenirken bir hata oluştu',
    });
  }
});

router.get('/dashboard/recent-orders', adminAuth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT TOP 10
        Id, OrderNumber, CustomerName, CustomerPhone,
        TotalAmount, Status, CreatedAt
      FROM Orders
      ORDER BY CreatedAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Recent orders hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Son siparişler yüklenirken bir hata oluştu',
    });
  }
});

export default router;
