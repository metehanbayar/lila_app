import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { sendOrderEmail } from '../config/email.js';
import { emitNewOrder } from '../config/websocket.js';

const router = express.Router();

// Sipariş numarası oluştur
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `LG${year}${month}${day}${random}`;
}

// Yeni sipariş oluştur
router.post('/', async (req, res) => {
  let transaction;
  try {
    const { customerName, customerPhone, customerAddress, notes, items, customerId, couponCode } = req.body;

    // Validasyon
    if (!customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm zorunlu alanları doldurun ve en az bir ürün ekleyin',
      });
    }

    // Müşteri kimlik doğrulama kontrolü - Sipariş vermek için üye olma zorunluluğu
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Sipariş vermek için lütfen giriş yapın veya üye olun',
      });
    }

    const pool = await getConnection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const orderNumber = generateOrderNumber();

    // Toplam tutarı hesapla (subtotal)
    let subtotal = 0;
    const orderItems = [];

    // Her ürün için veritabanından güncel fiyatı al
    for (const item of items) {
      const productResult = await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .query(`
          SELECT Id, Name, Price
          FROM Products
          WHERE Id = @productId AND IsActive = 1
        `);

      if (productResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Ürün bulunamadı: ${item.productId}`,
        });
      }

      const product = productResult.recordset[0];
      let price = product.Price;
      let variantId = null;
      let variantName = null;

      // Varyant seçilmişse, varyantın fiyatını al
      if (item.variantId) {
        const variantResult = await new sql.Request(transaction)
          .input('variantId', sql.Int, item.variantId)
          .input('productId', sql.Int, item.productId)
          .query(`
            SELECT Id, Name, Price
            FROM ProductVariants
            WHERE Id = @variantId AND ProductId = @productId AND IsActive = 1
          `);

        if (variantResult.recordset.length > 0) {
          const variant = variantResult.recordset[0];
          price = variant.Price;
          variantId = variant.Id;
          variantName = variant.Name;
        }
      }

      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.Id,
        productName: product.Name,
        productPrice: price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        variantId,
        variantName,
      });
    }

    // Kupon kontrolü ve indirim hesaplama
    let couponId = null;
    let discountAmount = 0;
    let totalAmount = subtotal;

    if (couponCode) {
      const couponResult = await new sql.Request(transaction)
        .input('code', sql.NVarChar, couponCode.trim().toUpperCase())
        .query(`
          SELECT * FROM Coupons
          WHERE Code = @code AND IsActive = 1
        `);

      if (couponResult.recordset.length > 0) {
        const coupon = couponResult.recordset[0];
        const now = new Date();

        // Tarih ve limit kontrolleri
        const validFrom = coupon.ValidFrom ? new Date(coupon.ValidFrom) : null;
        const validUntil = coupon.ValidUntil ? new Date(coupon.ValidUntil) : null;
        const isDateValid = (!validFrom || validFrom <= now) && (!validUntil || validUntil >= now);
        const isLimitValid = coupon.UsageLimit === null || coupon.UsedCount < coupon.UsageLimit;
        const isMinimumMet = subtotal >= coupon.MinimumAmount;

        if (isDateValid && isLimitValid && isMinimumMet) {
          couponId = coupon.Id;

          // İndirim hesapla
          if (coupon.DiscountType === 'percentage') {
            discountAmount = (subtotal * coupon.DiscountValue) / 100;
            if (coupon.MaxDiscount !== null && discountAmount > coupon.MaxDiscount) {
              discountAmount = coupon.MaxDiscount;
            }
          } else {
            discountAmount = coupon.DiscountValue;
          }

          if (discountAmount > subtotal) {
            discountAmount = subtotal;
          }

          totalAmount = subtotal - discountAmount;

          // Kupon kullanım sayısını artır
          await new sql.Request(transaction)
            .input('couponId', sql.Int, couponId)
            .query(`
              UPDATE Coupons
              SET UsedCount = UsedCount + 1, UpdatedAt = GETDATE()
              WHERE Id = @couponId
            `);
        }
      }
    }

    // Siparişi kaydet
    const orderResult = await new sql.Request(transaction)
      .input('orderNumber', sql.NVarChar, orderNumber)
      .input('customerName', sql.NVarChar, customerName)
      .input('customerPhone', sql.NVarChar, customerPhone)
      .input('customerAddress', sql.NVarChar, customerAddress)
      .input('notes', sql.NVarChar, notes || null)
      .input('subtotal', sql.Decimal(10, 2), subtotal)
      .input('discountAmount', sql.Decimal(10, 2), discountAmount)
      .input('totalAmount', sql.Decimal(10, 2), totalAmount)
      .input('customerId', sql.Int, customerId || null)
      .input('couponId', sql.Int, couponId)
      .input('couponCode', sql.NVarChar, couponCode || null)
      .query(`
        INSERT INTO Orders (OrderNumber, CustomerName, CustomerPhone, CustomerAddress, Notes, SubTotal, DiscountAmount, TotalAmount, Status, CustomerId, CouponId, CouponCode)
        OUTPUT INSERTED.Id, INSERTED.CreatedAt
        VALUES (@orderNumber, @customerName, @customerPhone, @customerAddress, @notes, @subtotal, @discountAmount, @totalAmount, 'Pending', @customerId, @couponId, @couponCode)
      `);

    const orderId = orderResult.recordset[0].Id;
    const createdAt = orderResult.recordset[0].CreatedAt;

    // Sipariş detaylarını kaydet
    for (const item of orderItems) {
      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .input('productId', sql.Int, item.productId)
        .input('productName', sql.NVarChar, item.productName)
        .input('productPrice', sql.Decimal(10, 2), item.productPrice)
        .input('quantity', sql.Int, item.quantity)
        .input('subtotal', sql.Decimal(10, 2), item.subtotal)
        .input('variantId', sql.Int, item.variantId || null)
        .input('variantName', sql.NVarChar, item.variantName || null)
        .query(`
          INSERT INTO OrderItems (OrderId, ProductId, ProductName, ProductPrice, Quantity, Subtotal, VariantId, VariantName)
          VALUES (@orderId, @productId, @productName, @productPrice, @quantity, @subtotal, @variantId, @variantName)
        `);
    }

    // Kupon kullanım geçmişini kaydet
    if (couponId) {
      await new sql.Request(transaction)
        .input('couponId', sql.Int, couponId)
        .input('customerId', sql.Int, customerId || null)
        .input('orderId', sql.Int, orderId)
        .input('discountAmount', sql.Decimal(10, 2), discountAmount)
        .query(`
          INSERT INTO CouponUsage (CouponId, CustomerId, OrderId, DiscountAmount)
          VALUES (@couponId, @customerId, @orderId, @discountAmount)
        `);
    }

    await transaction.commit();

    // Restoran bilgilerini çek ve siparişi restoranlara göre grupla
    const restaurantMap = new Map();
    
    for (const item of orderItems) {
      const restaurantResult = await pool
        .request()
        .input('productId', sql.Int, item.productId)
        .query(`
          SELECT r.Id, r.Name, r.Slug, r.Color
          FROM Restaurants r
          INNER JOIN Products p ON p.RestaurantId = r.Id
          WHERE p.Id = @productId
        `);

      if (restaurantResult.recordset.length > 0) {
        const restaurant = restaurantResult.recordset[0];
        const restaurantId = restaurant.Id;

        if (!restaurantMap.has(restaurantId)) {
          restaurantMap.set(restaurantId, {
            restaurantId,
            restaurantName: restaurant.Name,
            restaurantSlug: restaurant.Slug,
            restaurantColor: restaurant.Color,
            items: [],
            subtotal: 0,
          });
        }

        const restaurantOrder = restaurantMap.get(restaurantId);
        restaurantOrder.items.push({
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          variantId: item.variantId,
          variantName: item.variantName,
        });
        restaurantOrder.subtotal += item.subtotal;
      }
    }

    const restaurantOrders = Array.from(restaurantMap.values());

    // E-posta gönder (arka planda, hata olsa bile sipariş kaydedilmiş olur)
    const order = {
      OrderNumber: orderNumber,
      CustomerName: customerName,
      CustomerPhone: customerPhone,
      CustomerAddress: customerAddress,
      Notes: notes,
      SubTotal: subtotal,
      DiscountAmount: discountAmount,
      TotalAmount: totalAmount,
      CouponCode: couponCode,
      CreatedAt: createdAt,
    };

    const orderItemsForEmail = orderItems.map((item) => ({
      ProductName: item.variantName ? `${item.productName} (${item.variantName})` : item.productName,
      ProductPrice: item.productPrice,
      Quantity: item.quantity,
      Subtotal: item.subtotal,
    }));

    sendOrderEmail(order, orderItemsForEmail).catch((err) =>
      console.error('E-posta gönderimi başarısız:', err)
    );

    // WebSocket üzerinden sipariş bildirimi gönder
    try {
      emitNewOrder({
        orderId,
        orderNumber,
        customerName,
        customerPhone,
        customerAddress,
        notes,
        subtotal,
        discountAmount,
        totalAmount,
        couponCode,
        createdAt,
        restaurantOrders, // Her restoran için ayrı bilgi
      });
    } catch (wsError) {
      console.error('WebSocket bildirimi başarısız:', wsError);
    }

    res.status(201).json({
      success: true,
      message: 'Siparişiniz başarıyla alındı!',
      data: {
        orderId,
        orderNumber,
        subtotal,
        discountAmount,
        totalAmount,
        createdAt,
      },
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Transaction rollback hatası:', rollbackError);
      }
    }
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken bir hata oluştu',
    });
  }
});

// Sipariş detaylarını getir (sipariş numarasıyla)
router.get('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const pool = await getConnection();

    const orderResult = await pool
      .request()
      .input('orderNumber', sql.NVarChar, orderNumber)
      .query(`
        SELECT *
        FROM Orders
        WHERE OrderNumber = @orderNumber
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

export default router;

