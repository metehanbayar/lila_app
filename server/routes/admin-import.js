import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';
import multer from 'multer';
import { XMLParser } from 'fast-xml-parser';
import { unserialize as phpUnserialize } from 'php-unserialize';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Axios defaults - görsel indirme için
axios.defaults.timeout = 30000;
axios.defaults.maxRedirects = 5;

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// XML parser yapılandırması
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  trimValues: true,
});

// Görsel indirme fonksiyonu (retry mekanizmasıyla)
async function downloadImage(url, filename, retries = 2) {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // uploads klasörü yoksa oluştur
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    
    // Görsel zaten varsa atla
    if (fs.existsSync(filePath)) {
      return `/uploads/${filename}`;
    }
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      maxContentLength: 10 * 1024 * 1024, // 10MB limit
      maxBodyLength: 10 * 1024 * 1024,
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        resolve(`/uploads/${filename}`);
      });
      writer.on('error', (err) => {
        // Dosyayı sil
        fs.unlink(filePath, () => {});
        reject(err);
      });
      
      // Timeout ekle
      const timeout = setTimeout(() => {
        writer.destroy();
        fs.unlink(filePath, () => {});
        reject(new Error('Timeout'));
      }, 35000);
      
      writer.on('finish', () => clearTimeout(timeout));
      writer.on('error', () => clearTimeout(timeout));
    });
  } catch (error) {
    // Retry mekanizması
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
      return downloadImage(url, filename, retries - 1);
    }
    
    return null;
  }
}

// PHP serialize formatını parse et
function unserialize(serialized) {
  try {
    if (!serialized || typeof serialized !== 'string') {
      return null;
    }

    // PHP unserialize kütüphanesini kullan
    let data;
    try {
      data = phpUnserialize(serialized);
    } catch (phpError) {
      return null;
    }
    
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Varyantları düzenle
    if (data.product_variations) {
      // PHP unserialize obje olarak dönebilir, array'e çevir
      let variants = data.product_variations;
      
      // Eğer obje ise, Object.values ile array'e çevir
      if (!Array.isArray(variants) && typeof variants === 'object') {
        variants = Object.values(variants);
      }
      
      // Array ise map et
      if (Array.isArray(variants)) {
        data.product_variations = variants.map(variant => {
          if (typeof variant === 'object' && variant !== null) {
            return {
              price: parseFloat(variant.price) || 0,
              name: variant.variation_name_1 || '',
            };
          }
          return null;
        }).filter(v => v !== null && v.price > 0);
      } else {
        data.product_variations = [];
      }
    } else {
      data.product_variations = [];
    }

    return data;
  } catch (error) {
    return null;
  }
}

// WordPress XML'i parse et
router.post('/parse-xml', adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi',
      });
    }

    const xmlContent = req.file.buffer.toString('utf-8');
    const result = xmlParser.parse(xmlContent);

    // Items'ı çıkar
    const items = result.rss?.channel?.item || [];
    const products = [];
    const categories = new Set();
    
    // Önce attachments (görselleri) topla
    const attachments = {};
    for (const item of items) {
      if (item['wp:post_type'] === 'attachment') {
        const postId = item['wp:post_id'];
        const attachmentUrl = item['wp:attachment_url'];
        if (postId && attachmentUrl) {
          attachments[postId] = attachmentUrl;
        }
      }
    }

    for (const item of items) {
      // Sadece appetit_item post type'ını al
      if (item['wp:post_type'] !== 'appetit_item') continue;
      if (item['wp:status'] !== 'publish') continue;

      // Meta verisini parse et
      const metaArray = Array.isArray(item['wp:postmeta']) 
        ? item['wp:postmeta'] 
        : [item['wp:postmeta']];

      const appetitMeta = metaArray.find(
        (meta) => meta?.['wp:meta_key'] === 'appetit_item_meta'
      );

      if (!appetitMeta) continue;

      const metaValue = appetitMeta['wp:meta_value'];
      const parsed = unserialize(metaValue);

      if (!parsed || !parsed.item_name_1) continue;

      // Kategori
      const categoryTag = Array.isArray(item.category) 
        ? item.category[0] 
        : item.category;
      
      const categoryName = typeof categoryTag === 'string' 
        ? categoryTag 
        : categoryTag?.['#text'] || 'Diğer';

      categories.add(categoryName);

      // Görsel URL'ini al
      const imageId = parsed.square_photo || parsed.landscape_photo;
      const imageUrl = imageId ? attachments[imageId] : null;

      // Ürün bilgilerini oluştur
      const variants = Array.isArray(parsed.product_variations) 
        ? parsed.product_variations 
        : [];
        
      const product = {
        name: parsed.item_name_1,
        description: parsed.item_description_1 || '',
        category: categoryName,
        menuOrder: item['wp:menu_order'] || 0,
        variants: variants,
        imageUrl: imageUrl,
      };

      // Eğer varyant yoksa varsayılan ekle
      if (product.variants.length === 0) {
        product.variants.push({
          name: '',
          price: 0,
        });
      }

      products.push(product);
    }

    res.json({
      success: true,
      data: {
        products,
        categories: Array.from(categories),
        totalCount: products.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'XML dosyası işlenirken bir hata oluştu',
      error: error.message,
    });
  }
});

// Ürünleri import et
router.post('/import-products', adminAuth, async (req, res) => {
  // Timeout süresini artır
  req.setTimeout(300000); // 5 dakika
  
  try {
    const { restaurantId, products, categoryMapping } = req.body;

    if (!restaurantId || !products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri formatı',
      });
    }

    // Güvenlik: Çok fazla ürün varsa uyarı ver
    const MAX_PRODUCTS = 1000;
    if (products.length > MAX_PRODUCTS) {
      return res.status(400).json({
        success: false,
        message: `Tek seferde en fazla ${MAX_PRODUCTS} ürün import edilebilir. Lütfen dosyayı bölün.`,
      });
    }

    const pool = await getConnection();
    
    // Transaction başlat
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      let importedCount = 0;
      let skippedCount = 0;
      let downloadedImages = 0;
      const errors = [];

      // Batch işleme - Her seferinde 10 ürün işle
      const BATCH_SIZE = 10;
      const totalProducts = products.length;
      
      console.log(`\n⚙️  Toplam ${totalProducts} ürün, ${Math.ceil(totalProducts / BATCH_SIZE)} batch halinde işlenecek...`);
      
      for (let i = 0; i < totalProducts; i += BATCH_SIZE) {
        const batch = products.slice(i, Math.min(i + BATCH_SIZE, totalProducts));
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalProducts / BATCH_SIZE);
        
        console.log(`\n📦 Batch ${batchNum}/${totalBatches} işleniyor (${batch.length} ürün)...`);
        
        // Batch başlangıç zamanı
        const batchStartTime = Date.now();
        
        for (const product of batch) {
          try {
            // Kategori ID'sini al
            const categoryId = categoryMapping[product.category];
            
            if (!categoryId) {
              skippedCount++;
              errors.push(`${product.name}: Kategori eşleşmesi bulunamadı`);
              continue;
            }

            // Eğer varyant varsa
            if (product.variants && product.variants.length > 0) {
              // İlk varyantın fiyatını ana fiyat olarak kullan
              const basePrice = product.variants[0].price;

              // Görseli indir (network hatalarını tolere et)
              let productImageUrl = null;
              if (product.imageUrl) {
                try {
                  const urlParts = product.imageUrl.split('/');
                  const filename = urlParts[urlParts.length - 1];
                  const timestamp = Date.now();
                  const randomNum = Math.floor(Math.random() * 1000000);
                  const uniqueFilename = `${timestamp}-${randomNum}-${filename}`;
                  
                  productImageUrl = await downloadImage(product.imageUrl, uniqueFilename);
                  if (productImageUrl) {
                    downloadedImages++;
                  }
                } catch (imageError) {
                  console.warn(`   ⚠️  Görsel indirilemedi, ürün yine de eklenecek`);
                  // Görsel hatası ürün import'unu engellemez
                }
              }

            // Debug log
            if (importedCount < 3) {
              console.log(`\n✅ Import ediliyor: ${product.name}`);
              console.log(`   Kategori ID: ${categoryId}`);
              console.log(`   Ana Fiyat: ${basePrice}₺`);
              console.log(`   Görsel: ${productImageUrl || 'Yok'}`);
              console.log(`   Varyantlar (${product.variants?.length || 0}):`);
              if (Array.isArray(product.variants)) {
                product.variants.forEach((v, i) => {
                  console.log(`   ${i + 1}. ${v.name || '(varsayılan)'}: ${v.price}₺`);
                });
              }
            }

            // Ürünü ekle
            const productResult = await transaction.request()
              .input('restaurantId', sql.Int, restaurantId)
              .input('categoryId', sql.Int, categoryId)
              .input('name', sql.NVarChar, product.name)
              .input('description', sql.NVarChar, product.description || '')
              .input('price', sql.Decimal(10, 2), basePrice)
              .input('imageUrl', sql.NVarChar, productImageUrl)
              .input('displayOrder', sql.Int, product.menuOrder || 0)
              .query(`
                INSERT INTO Products (
                  RestaurantId, CategoryId, Name, Description, 
                  Price, ImageUrl, DisplayOrder, IsActive, IsFeatured
                )
                OUTPUT INSERTED.Id
                VALUES (
                  @restaurantId, @categoryId, @name, @description,
                  @price, @imageUrl, @displayOrder, 1, 0
                )
              `);

            const productId = productResult.recordset[0].Id;

            // Varyantları ekle (eğer birden fazla varsa veya isimli ise)
            if (product.variants.length > 1 || product.variants[0].name) {
              let variantOrder = 0;
              for (const variant of product.variants) {
                await transaction.request()
                  .input('productId', sql.Int, productId)
                  .input('name', sql.NVarChar, variant.name || 'Normal')
                  .input('price', sql.Decimal(10, 2), variant.price)
                  .input('displayOrder', sql.Int, variantOrder++)
                  .query(`
                    INSERT INTO ProductVariants (
                      ProductId, Name, Price, DisplayOrder, IsActive
                    )
                    VALUES (
                      @productId, @name, @price, @displayOrder, 1
                    )
                  `);
              }
            }

            importedCount++;
          } else {
            skippedCount++;
            errors.push(`${product.name}: Fiyat bilgisi bulunamadı`);
          }
        } catch (productError) {
          errors.push(`${product.name}: ${productError.message}`);
          skippedCount++;
        }
      }
      
      // Batch tamamlandı
      const batchDuration = ((Date.now() - batchStartTime) / 1000).toFixed(1);
      console.log(`   ✅ Batch ${batchNum} tamamlandı (${batchDuration}s): ${importedCount}/${i + batch.length} ürün import edildi`);
      
      // Kısa bir bekleme - Veritabanı ve network'ün dinlenmesi için
      if (batchNum < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

      // Transaction'ı commit et
      await transaction.commit();

      console.log(`\n✅ Import tamamlandı!`);
      console.log(`   📦 ${importedCount} ürün eklendi`);
      console.log(`   🖼️  ${downloadedImages} görsel indirildi`);
      console.log(`   ⏭️  ${skippedCount} ürün atlandı`);

      res.json({
        success: true,
        data: {
          imported: importedCount,
          skipped: skippedCount,
          downloadedImages: downloadedImages,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error) {
    console.error('\n❌ Import hatası:', error);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Ürünler import edilirken bir hata oluştu',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;

