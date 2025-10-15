import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Tüm kategorileri getir (public) - Global/ortak kategoriler
router.get('/categories', async (req, res) => {
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
    console.error('Kategori listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler yüklenirken bir hata oluştu',
    });
  }
});

// Ürün arama
router.get('/search', async (req, res) => {
  try {
    const { q, restaurantId, categoryId } = req.query;

    const pool = await getConnection();
    
    let query = `
      SELECT 
        p.Id, p.Name, p.Description, p.Price, p.ImageUrl, 
        p.RestaurantId, p.CategoryId, p.IsFeatured,
        r.Name as RestaurantName, r.Color as RestaurantColor,
        c.Name as CategoryName
      FROM Products p
      INNER JOIN Restaurants r ON p.RestaurantId = r.Id
      LEFT JOIN Categories c ON p.CategoryId = c.Id
      WHERE p.IsActive = 1 
        AND r.IsActive = 1
    `;

    const request = pool.request();

    // Arama terimi varsa ekle
    if (q && q.trim().length >= 2) {
      query += ' AND (p.Name LIKE @searchTerm OR p.Description LIKE @searchTerm)';
      request.input('searchTerm', sql.NVarChar, `%${q}%`);
    }

    // Restoran filtresi varsa ekle
    if (restaurantId) {
      query += ' AND p.RestaurantId = @restaurantId';
      request.input('restaurantId', sql.Int, restaurantId);
    }

    // Kategori filtresi varsa ekle
    if (categoryId) {
      query += ' AND p.CategoryId = @categoryId';
      request.input('categoryId', sql.Int, categoryId);
    }

    query += ' ORDER BY p.IsFeatured DESC, p.Name ASC';

    const result = await request.query(query);

    // Varyantları getir
    if (result.recordset.length > 0) {
      const productIds = result.recordset.map(p => p.Id);
      const variantsResult = await pool
        .request()
        .query(`
          SELECT 
            Id, ProductId, Name, Price, IsDefault, DisplayOrder
          FROM ProductVariants
          WHERE ProductId IN (${productIds.join(',')}) 
            AND IsActive = 1
          ORDER BY DisplayOrder, Id
        `);

      // Varyantları ürünlere ekle
      result.recordset.forEach(product => {
        product.variants = variantsResult.recordset.filter(v => v.ProductId === product.Id);
      });
    }

    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length,
      searchTerm: q,
    });
  } catch (error) {
    console.error('Ürün arama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Arama yapılırken bir hata oluştu',
    });
  }
});

// Restorana ait tüm ürünleri getir (kategorileriyle birlikte)
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const pool = await getConnection();

    // Kategorileri getir (ortak kategoriler)
    const categoriesResult = await pool
      .request()
      .query(`
        SELECT Id, Name
        FROM Categories
        WHERE IsActive = 1
        ORDER BY Name
      `);

    // Ürünleri getir
    const productsResult = await pool
      .request()
      .input('restaurantId', sql.Int, restaurantId)
      .query(`
        SELECT 
          Id, CategoryId, Name, Description, 
          Price, ImageUrl, IsFeatured, DisplayOrder
        FROM Products
        WHERE RestaurantId = @restaurantId AND IsActive = 1
        ORDER BY DisplayOrder, Name
      `);

    // Tüm ürünlerin varyantlarını getir
    const variantsResult = await pool
      .request()
      .input('restaurantId', sql.Int, restaurantId)
      .query(`
        SELECT 
          pv.Id, pv.ProductId, pv.Name, pv.Price, 
          pv.IsDefault, pv.DisplayOrder
        FROM ProductVariants pv
        INNER JOIN Products p ON pv.ProductId = p.Id
        WHERE p.RestaurantId = @restaurantId AND pv.IsActive = 1
        ORDER BY pv.ProductId, pv.DisplayOrder, pv.Name
      `);

    // Ürünlere varyantlarını ekle
    const productsWithVariants = productsResult.recordset.map((product) => ({
      ...product,
      variants: variantsResult.recordset.filter(
        (variant) => variant.ProductId === product.Id
      ),
    }));

    // Kategorilere ürünleri ekle
    const categories = categoriesResult.recordset.map((category) => ({
      ...category,
      products: productsWithVariants.filter(
        (product) => product.CategoryId === category.Id
      ),
    }));

    res.json({
      success: true,
      data: {
        categories,
        allProducts: productsWithVariants,
      },
    });
  } catch (error) {
    console.error('Ürün listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler yüklenirken bir hata oluştu',
    });
  }
});

// Tek bir ürünün detayını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          Id, RestaurantId, CategoryId, Name, Description,
          Price, ImageUrl, IsFeatured, IsActive
        FROM Products
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı',
      });
    }

    // Ürünün varyantlarını getir
    const variantsResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          Id, ProductId, Name, Price, IsDefault, DisplayOrder
        FROM ProductVariants
        WHERE ProductId = @id AND IsActive = 1
        ORDER BY DisplayOrder, Name
      `);

    const product = {
      ...result.recordset[0],
      variants: variantsResult.recordset,
    };

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

export default router;

