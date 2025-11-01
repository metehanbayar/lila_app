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
        p.RestaurantId, p.CategoryId, p.IsFeatured, p.IsActive,
        r.Name as RestaurantName, r.Color as RestaurantColor,
        c.Name as CategoryName
      FROM Products p
      INNER JOIN Restaurants r ON p.RestaurantId = r.Id
      LEFT JOIN Categories c ON p.CategoryId = c.Id
      WHERE r.IsActive = 1
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

    query += ' ORDER BY p.IsActive DESC, p.IsFeatured DESC, p.Name ASC';

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

    // Ürünleri getir
    const productsResult = await pool
      .request()
      .input('restaurantId', sql.Int, restaurantId)
      .query(`
        SELECT 
          p.Id, p.RestaurantId, p.CategoryId, p.Name, p.Description, 
          p.Price, p.ImageUrl, p.IsFeatured, p.DisplayOrder, p.IsActive,
          c.Name as CategoryName
        FROM Products p
        LEFT JOIN Categories c ON p.CategoryId = c.Id
        WHERE p.RestaurantId = @restaurantId AND c.IsActive = 1
        ORDER BY p.IsActive DESC, p.DisplayOrder, p.Name
      `);

    // Sadece bu restoranda ürünü olan kategorileri getir
    const categoriesResult = await pool
      .request()
      .input('restaurantId', sql.Int, restaurantId)
      .query(`
        SELECT DISTINCT c.Id, c.Name
        FROM Categories c
        INNER JOIN Products p ON c.Id = p.CategoryId
        WHERE p.RestaurantId = @restaurantId AND c.IsActive = 1
        ORDER BY c.Name
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

// Cross sell ürünlerini getir (sepet sayfası için önerilen ürünler) - ÖNCE tanımlanmalı
router.get('/cross-sell', async (req, res) => {
  try {
    const { restaurantIds, excludeProductIds, categoryIds } = req.query;
    
    
    const pool = await getConnection();
    
    let query = `
      SELECT TOP 12
        p.Id, p.Name, p.Description, p.Price, p.ImageUrl,
        p.RestaurantId, p.CategoryId, p.IsFeatured, p.IsActive,
        r.Name as RestaurantName, r.Color as RestaurantColor,
        c.Name as CategoryName
      FROM Products p
      INNER JOIN Restaurants r ON p.RestaurantId = r.Id
      LEFT JOIN Categories c ON p.CategoryId = c.Id
      WHERE p.IsActive = 1 AND r.IsActive = 1
    `;

    // Sepetteki ürünleri hariç tut
    if (excludeProductIds && excludeProductIds.trim() !== '') {
      const excludeIds = excludeProductIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
      if (excludeIds.length > 0) {
        query += ' AND p.Id NOT IN (' + excludeIds.join(',') + ')';
      }
    }

    // STRİCT: İlgili restoranlardan ÜRÜN OLDUĞUNDA sadece onların ürünlerini göster
    const restIds = restaurantIds && restaurantIds.trim() !== '' 
      ? restaurantIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0)
      : [];
    
    const catIds = categoryIds && categoryIds.trim() !== ''
      ? categoryIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0)
      : [];

    // 🎯 AKILLI CROSS-SELL: Sepetteki kategorilere göre tamamlayıcı kategorileri belirle
    let recommendedCategoryIds = [];
    const excludeIds = excludeProductIds && excludeProductIds.trim() !== '' 
      ? excludeProductIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0)
      : [];
    
    if (catIds.length > 0) {
      // Sepetteki kategorilerin isimlerini çek
      const categoryNames = await pool.request().query(`
        SELECT Id, Name FROM Categories WHERE Id IN (${catIds.join(',')})
      `);
      
      // Kategori isimlerini lowercase yap ve tamamlayıcı kategorileri belirle
      const cartCategories = categoryNames.recordset.map(c => c.Name.toLowerCase());
      
      // Tamamlayıcı kategori isimleri (hardcoded mapping)
      const recommendedCategoryNames = new Set();
      
      // 🍕 Ana Yemekler: Pizza, Pide, Burger, Döner, Et Yemekleri, Tavuk Yemekleri, vs.
      const hasMainDish = cartCategories.some(cat => 
        cat.includes('pizza') || cat.includes('lila') || cat.includes('burger') || 
        cat.includes('döner') || cat.includes('lahmacun') || cat.includes('pide') ||
        cat.includes('steak house') || cat.includes('et yemek') || cat.includes('tavuk yemek') ||
        cat.includes('makarna') || cat.includes('menü') || cat.includes('sandviç') ||
        cat.includes('tost') || cat.includes('wrap') || cat.includes('döküm')
      );
      
      // 🥤 İçecekler: Tüm içecek kategorileri
      const hasDrink = cartCategories.some(cat => 
        cat.includes('içecek') || cat.includes('meşrubat') || cat.includes('limonata') ||
        cat.includes('fresher') || cat.includes('bubble tea') || cat.includes('smoothie') ||
        cat.includes('milkshake') || cat.includes('kahve') || cat.includes('çay') ||
        cat.includes('kış') || cat.includes('frozen')
      );
      
      // 🍰 Tatlılar: Tüm tatlı kategorileri
      const hasDessert = cartCategories.some(cat => 
        cat.includes('tatlı') || cat.includes('baklava') || cat.includes('pasta') ||
        cat.includes('dondurma') || cat.includes('sütlü')
      );
      
      // 🥗 Salata ve Aperatifler
      const hasSalad = cartCategories.some(cat => 
        cat.includes('salata') || cat.includes('çorba') || cat.includes('aperatif') ||
        cat.includes('ortaya')
      );
      
      // ☕ Kahveler: Türk kahvesi, Filtre kahve, Dünya kahveleri, etc.
      const hasCoffee = cartCategories.some(cat => 
        cat.includes('türk kahve') || cat.includes('filtre kahve') || 
        cat.includes('dünya kahve') || cat.includes('klasik kahve') || cat.includes('soğuk kahve')
      );
      
      // 🎯 DAHA AKILLI STRATEJİ: Sepet durumuna göre farklı öneriler
      
      // Senaryo 1: Çok ürün varsa (>= 3 kategori veya çok farklı türler) → SADECE tatlı
      const hasMultipleCategories = catIds.length >= 3;
      const hasDiverseCart = (hasMainDish && hasDrink) || (hasMainDish && hasDessert) || (hasDrink && hasDessert);
      
      if (hasMultipleCategories || hasDiverseCart) {
        // Sepet dolu → sadece en önemli eksik parçayı öner
        if (!hasDessert) {
          recommendedCategoryNames.add('tatlı');
          recommendedCategoryNames.add('dondurma');
        }
        if (!hasDrink && !hasCoffee) {
          recommendedCategoryNames.add('içecek');
          recommendedCategoryNames.add('meşrubat');
        }
      }
      // Senaryo 2: Tek bir kategori → Tamamlayıcıları öner
      else if (catIds.length === 1) {
        if (hasMainDish) {
          // Tek ana yemek → İçecek ve tatlı öner
          recommendedCategoryNames.add('içecek');
          recommendedCategoryNames.add('meşrubat');
          recommendedCategoryNames.add('limonata');
          recommendedCategoryNames.add('tatlı');
          recommendedCategoryNames.add('dondurma');
          recommendedCategoryNames.add('bubble tea');
        } else if (hasDrink || hasCoffee) {
          // Tek içecek → Tatlı ve aperatif öner
          recommendedCategoryNames.add('tatlı');
          recommendedCategoryNames.add('baklava');
          recommendedCategoryNames.add('pasta');
          recommendedCategoryNames.add('aperatif');
          recommendedCategoryNames.add('ortaya');
        } else if (hasDessert) {
          // Tek tatlı → İçecek öner
          recommendedCategoryNames.add('içecek');
          recommendedCategoryNames.add('meşrubat');
          recommendedCategoryNames.add('kahve');
          recommendedCategoryNames.add('bubble tea');
        } else if (hasSalad) {
          // Tek salata → Ana yemek ve içecek öner
          recommendedCategoryNames.add('pizza');
          recommendedCategoryNames.add('burger');
          recommendedCategoryNames.add('döner');
          recommendedCategoryNames.add('menü');
          recommendedCategoryNames.add('içecek');
        }
      }
      // Senaryo 3: İki kategori → Eksik olanı tamamla
      else {
        // Ana yemek varsa ama içecek yoksa
        if (hasMainDish && !hasDrink && !hasCoffee) {
          recommendedCategoryNames.add('içecek');
          recommendedCategoryNames.add('meşrubat');
          recommendedCategoryNames.add('limonata');
        }
        
        // Ana yemek varsa ama tatlı yoksa
        if (hasMainDish && !hasDessert) {
          recommendedCategoryNames.add('tatlı');
          recommendedCategoryNames.add('dondurma');
          recommendedCategoryNames.add('baklava');
        }
        
        // İçecek varsa ama ana yemek yoksa
        if ((hasDrink || hasCoffee) && !hasMainDish) {
          recommendedCategoryNames.add('pizza');
          recommendedCategoryNames.add('burger');
          recommendedCategoryNames.add('döner');
          recommendedCategoryNames.add('sandviç');
        }
        
        // İçecek varsa ama tatlı yoksa
        if ((hasDrink || hasCoffee) && !hasDessert) {
          recommendedCategoryNames.add('tatlı');
          recommendedCategoryNames.add('baklava');
          recommendedCategoryNames.add('dondurma');
        }
        
        // Tatlı varsa ama içecek yoksa
        if (hasDessert && !hasDrink && !hasCoffee) {
          recommendedCategoryNames.add('içecek');
          recommendedCategoryNames.add('meşrubat');
          recommendedCategoryNames.add('bubble tea');
        }
      }
      
      // Eğer hiçbir kural eşleşmezse, tüm kategorileri öner (fallback)
      if (recommendedCategoryNames.size === 0) {
        recommendedCategoryNames.add('içecek');
        recommendedCategoryNames.add('tatlı');
        recommendedCategoryNames.add('bubble tea');
      }
      
      // Tamamlayıcı kategori ID'lerini bul
      const categoryNamesArray = Array.from(recommendedCategoryNames);
      
      if (categoryNamesArray.length > 0) {
        // MSSQL'de LIKE için OR conditions oluştur
        const likeConditions = categoryNamesArray
          .map(name => `LOWER(Name) LIKE '%${name}%'`)
          .join(' OR ');
        
        const recommendedCats = await pool.request().query(`
          SELECT Id FROM Categories WHERE ${likeConditions}
        `);
        
        if (recommendedCats.recordset.length > 0) {
          recommendedCategoryIds = recommendedCats.recordset.map(c => c.Id);
        }
      }
    }

    // Sepet boşsa: Popüler ürünler göster
    if (restIds.length === 0) {
      query += ' AND 1=1';
    }
    // Tek restoran varsa: O restorandan ürünler
    else if (restIds.length === 1) {
      query += ' AND p.RestaurantId = ' + restIds[0];
      
      // 🎯 AKILLI CROSS-SELL: Tamamlayıcı kategorilerden ürün göster
      if (recommendedCategoryIds.length > 0) {
        query += ' AND p.CategoryId IN (' + recommendedCategoryIds.join(',') + ')';
      } else if (catIds.length > 0) {
        // Fallback: Sepetteki kategorilerin dışında
        query += ' AND p.CategoryId NOT IN (' + catIds.join(',') + ')';
      }
    }
    // Çoklu restoran varsa
    else {
      query += ' AND p.RestaurantId IN (' + restIds.join(',') + ')';
      
      // 🎯 AKILLI CROSS-SELL: Tamamlayıcı kategorilerden ürün göster
      if (recommendedCategoryIds.length > 0) {
        query += ' AND p.CategoryId IN (' + recommendedCategoryIds.join(',') + ')';
      } else if (catIds.length > 0) {
        // Fallback: Sepetteki kategorilerin dışında
        query += ' AND p.CategoryId NOT IN (' + catIds.join(',') + ')';
      }
    }

    // 🎯 DAHA AKILLI SIRALAMA:
    // 1. Öne çıkarılan (featured) ürünler en üstte
    // 2. Sonra kategori tamamlayıcılığına göre (eşleşen kategoriler)
    // 3. Son olarak randomize
    query += ` ORDER BY 
      p.IsFeatured DESC, 
      CASE 
        WHEN p.CategoryId IN (${recommendedCategoryIds.length > 0 ? recommendedCategoryIds.join(',') : '0'}) THEN 1 
        ELSE 2 
      END,
      NEWID()`;

    const result = await pool.request().query(query);

    // Varyantları getir
    if (result.recordset.length > 0) {
      const productIds = result.recordset.map(p => p.Id).filter(id => id && !isNaN(id) && id > 0);
      if (productIds.length > 0) {
        try {
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
        } catch (variantError) {
          console.error('Varyant sorgusu hatası:', variantError);
          // Varyantlar olmadan devam et
          result.recordset.forEach(product => {
            product.variants = [];
          });
        }
      } else {
        // Geçerli productId yoksa, boş varyant dizisi ekle
        result.recordset.forEach(product => {
          product.variants = [];
        });
      }
    }

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Cross sell ürünleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Önerilen ürünler yüklenirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Tek bir ürünün detayını getir (EN SON tanımlanmalı - wildcard route)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ID validasyonu
    const productId = parseInt(id);
    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ürün ID',
      });
    }
    
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, productId)
      .query(`
        SELECT 
          p.Id, p.RestaurantId, p.CategoryId, p.Name, p.Description,
          p.Price, p.ImageUrl, p.IsFeatured, p.IsActive,
          r.Name as RestaurantName, r.Color as RestaurantColor,
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

    // Ürünün varyantlarını getir
    const variantsResult = await pool
      .request()
      .input('id', sql.Int, productId)
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

