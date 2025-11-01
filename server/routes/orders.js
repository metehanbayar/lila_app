import express from 'express';
import { getConnection, sql } from '../config/database.js';

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

    // Minimum sipariş kontrolü için önce restoran bilgilerini al
    const poolForCheck = await getConnection();
    const restaurantCheckResult = await poolForCheck.request().query(`
      SELECT Id, Name, MinOrder FROM Restaurants WHERE IsActive = 1
    `);
    const restaurantMinOrders = new Map();
    restaurantCheckResult.recordset.forEach(r => {
      restaurantMinOrders.set(r.Id, { name: r.Name, minOrder: r.MinOrder });
    });

    // Müşteri kimlik doğrulama kontrolü
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Sipariş vermek için lütfen giriş yapın veya üye olun',
      });
    }

    const pool = await getConnection();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Restoranlar bazında grupla
    const restaurantGroups = new Map(); // restaurantId -> { restaurantName, items: [], subtotal: 0 }
    let totalSubtotal = 0;

    // Her ürün için veritabanından güncel fiyatı al
    for (const item of items) {
      const productResult = await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .query(`
          SELECT p.Id, p.Name, p.Price, p.RestaurantId, r.Name as RestaurantName
          FROM Products p
          INNER JOIN Restaurants r ON p.RestaurantId = r.Id
          WHERE p.Id = @productId AND p.IsActive = 1
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
      totalSubtotal += itemSubtotal;

      const orderItem = {
        productId: product.Id,
        productName: product.Name,
        productPrice: price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        variantId,
        variantName,
        restaurantId: product.RestaurantId,
        restaurantName: product.RestaurantName,
      };

      // Restoran bazında grupla
      if (!restaurantGroups.has(product.RestaurantId)) {
        restaurantGroups.set(product.RestaurantId, {
          restaurantId: product.RestaurantId,
          restaurantName: product.RestaurantName,
          items: [],
          subtotal: 0,
        });
      }

      const restaurantGroup = restaurantGroups.get(product.RestaurantId);
      restaurantGroup.items.push(orderItem);
      restaurantGroup.subtotal += itemSubtotal;
    }

    // Minimum sipariş kontrolü - Her restoran için
    const minOrderViolations = [];
    for (const [restaurantId, restaurantData] of restaurantGroups) {
      const restaurantInfo = restaurantMinOrders.get(restaurantId);
      if (restaurantInfo && restaurantInfo.minOrder && restaurantInfo.minOrder > 0) {
        if (restaurantData.subtotal < restaurantInfo.minOrder) {
          minOrderViolations.push({
            restaurantName: restaurantInfo.name,
            required: restaurantInfo.minOrder,
            current: restaurantData.subtotal,
          });
        }
      }
    }

    if (minOrderViolations.length > 0) {
      await transaction.rollback();
      const violationsText = minOrderViolations.map(v => `${v.restaurantName}: ${v.required.toFixed(2)} ₺`).join(', ');
      return res.status(400).json({
        success: false,
        message: `Minimum sipariş tutarına ulaşılmadı: ${violationsText}`,
      });
    }

    // Kupon kontrolü ve toplam indirim hesaplama
    let couponId = null;
    let totalDiscountAmount = 0;

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
        const isMinimumMet = totalSubtotal >= coupon.MinimumAmount;

        if (isDateValid && isLimitValid && isMinimumMet) {
          couponId = coupon.Id;

          // Toplam indirimi hesapla
          if (coupon.DiscountType === 'percentage') {
            totalDiscountAmount = (totalSubtotal * coupon.DiscountValue) / 100;
            if (coupon.MaxDiscount !== null && totalDiscountAmount > coupon.MaxDiscount) {
              totalDiscountAmount = coupon.MaxDiscount;
            }
          } else {
            totalDiscountAmount = coupon.DiscountValue;
          }

          if (totalDiscountAmount > totalSubtotal) {
            totalDiscountAmount = totalSubtotal;
          }

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

    // Çoklu restoran durumunda grup ID oluştur
    const hasMultipleRestaurants = restaurantGroups.size > 1;
    const groupId = hasMultipleRestaurants 
      ? `GRP_${Date.now()}_${Math.random().toString(36).substring(7)}` 
      : null;

    // Her restoran için AYRI SIPARIŞ oluştur
    const createdOrders = [];
    
    for (const [restaurantId, restaurantData] of restaurantGroups) {
      // Restoran bazlı indirim hesabı (toplam indirimi subtotal'e göre dağıt)
      const restaurantDiscountRatio = restaurantData.subtotal / totalSubtotal;
      const restaurantDiscountAmount = totalDiscountAmount * restaurantDiscountRatio;
      
      const restaurantSubtotal = restaurantData.subtotal;
      // Negatif toplam olmaması için clamp: Math.max(0, total)
      const restaurantTotalAmount = Math.max(0, Number(restaurantSubtotal) - Number(restaurantDiscountAmount || 0));
      
      // Her restoran için ayrı sipariş numarası
      const restaurantOrderNumber = generateOrderNumber();
      
      // Siparişi kaydet (GroupId ile)
      const orderResult = await new sql.Request(transaction)
        .input('orderNumber', sql.NVarChar, restaurantOrderNumber)
        .input('customerName', sql.NVarChar, customerName)
        .input('customerPhone', sql.NVarChar, customerPhone)
        .input('customerAddress', sql.NVarChar, customerAddress)
        .input('notes', sql.NVarChar, notes || null)
        .input('subtotal', sql.Decimal(10, 2), restaurantSubtotal)
        .input('discountAmount', sql.Decimal(10, 2), restaurantDiscountAmount)
        .input('totalAmount', sql.Decimal(10, 2), restaurantTotalAmount)
        .input('customerId', sql.Int, customerId || null)
        .input('couponId', sql.Int, couponId)
        .input('couponCode', sql.NVarChar, couponCode || null)
        .input('groupId', sql.NVarChar, groupId)
        .query(`
          INSERT INTO Orders (OrderNumber, CustomerName, CustomerPhone, CustomerAddress, Notes, SubTotal, DiscountAmount, TotalAmount, Status, CustomerId, CouponId, CouponCode, PaymentStatus, PaymentMethod, GroupId)
          OUTPUT INSERTED.Id, INSERTED.CreatedAt
          VALUES (@orderNumber, @customerName, @customerPhone, @customerAddress, @notes, @subtotal, @discountAmount, @totalAmount, 'Pending', @customerId, @couponId, @couponCode, 'Pending', 'credit_card', @groupId)
        `);

      const orderId = orderResult.recordset[0].Id;
      const createdAt = orderResult.recordset[0].CreatedAt;

      // Bu restorana ait sipariş detaylarını kaydet
      for (const item of restaurantData.items) {
        await new sql.Request(transaction)
          .input('orderId', sql.Int, orderId)
          .input('productId', sql.Int, item.productId)
          .input('productName', sql.NVarChar, item.productName)
          .input('productPrice', sql.Decimal(10, 2), item.productPrice)
          .input('quantity', sql.Int, item.quantity)
          .input('subtotal', sql.Decimal(10, 2), item.subtotal)
          .input('variantId', sql.Int, item.variantId || null)
          .input('variantName', sql.NVarChar, item.variantName || null)
          .input('restaurantId', sql.Int, item.restaurantId)
          .query(`
            INSERT INTO OrderItems (OrderId, ProductId, ProductName, ProductPrice, Quantity, Subtotal, VariantId, VariantName, RestaurantId)
            VALUES (@orderId, @productId, @productName, @productPrice, @quantity, @subtotal, @variantId, @variantName, @restaurantId)
          `);
      }

      // Kupon kullanım geçmişini kaydet (sadece ilk restoran için)
      if (couponId && createdOrders.length === 0) {
        await new sql.Request(transaction)
          .input('couponId', sql.Int, couponId)
          .input('customerId', sql.Int, customerId || null)
          .input('orderId', sql.Int, orderId)
          .input('discountAmount', sql.Decimal(10, 2), totalDiscountAmount)
          .query(`
            INSERT INTO CouponUsage (CouponId, CustomerId, OrderId, DiscountAmount)
            VALUES (@couponId, @customerId, @orderId, @discountAmount)
          `);
      }

      createdOrders.push({
        orderId,
        orderNumber: restaurantOrderNumber,
        restaurantId,
        restaurantName: restaurantData.restaurantName,
        subtotal: restaurantSubtotal,
        discountAmount: restaurantDiscountAmount,
        totalAmount: restaurantTotalAmount,
        itemCount: restaurantData.items.length,
        createdAt,
      });
    }

    await transaction.commit();

    // NOT: E-posta ve bildirim gönderimi artık ödeme başarılı olduğunda yapılıyor
    // Bu sayede sadece ödenmiş siparişler için e-posta ve bildirim gönderilecek

    res.status(201).json({
      success: true,
      message: createdOrders.length > 1 
        ? `${createdOrders.length} sipariş başarıyla oluşturuldu!` 
        : 'Siparişiniz başarıyla alındı!',
      data: {
        orderCount: createdOrders.length,
        groupId: groupId, // Çoklu sipariş için grup ID (null ise tek sipariş)
        orders: createdOrders.map(o => ({
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          restaurantId: o.restaurantId,
          restaurantName: o.restaurantName,
          subtotal: o.subtotal,
          discountAmount: o.discountAmount,
          totalAmount: o.totalAmount,
          itemCount: o.itemCount,
          createdAt: o.createdAt,
        })),
        totalSubtotal: totalSubtotal,
        totalDiscountAmount: totalDiscountAmount,
        grandTotal: totalSubtotal - totalDiscountAmount,
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

