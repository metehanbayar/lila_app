import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Restoranlarımızı getir
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT Id, Name, Slug, Description, Color, ImageUrl, IsActive, DeliveryTime, MinOrder
      FROM Restaurants
      WHERE IsActive = 1
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

// Tek bir restoranın detayını getir
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('slug', sql.NVarChar, slug)
      .query(`
        SELECT Id, Name, Slug, Description, Color, ImageUrl, IsActive, DeliveryTime, MinOrder
        FROM Restaurants
        WHERE Slug = @slug AND IsActive = 1
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

// Minimum sipariş kontrolü
router.post('/check-min-order', async (req, res) => {
  try {
    const { restaurantIds } = req.body;
    
    if (!restaurantIds || !Array.isArray(restaurantIds) || restaurantIds.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }
    
    const pool = await getConnection();
    
    const idsString = restaurantIds.join(',');
    const result = await pool.request().query(`
      SELECT Id, Name, MinOrder, Color
      FROM Restaurants
      WHERE Id IN (${idsString}) AND IsActive = 1
    `);
    
    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Minimum sipariş kontrolü hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Minimum sipariş kontrolü yapılırken bir hata oluştu',
    });
  }
});

export default router;

