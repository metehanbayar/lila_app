import express from 'express';
import crypto from 'crypto';
import { getConnection, sql } from '../config/database.js';
import {
  checkEnrollment,
  processNonSecurePayment,
  process3DSecurePayment,
} from '../services/payment-service.js';
import { getCallbackUrls } from '../config/payment.js';
import { sendOrderEmail } from '../config/email.js';
import { notifyNewOrder } from '../services/socket-service.js';
import { isPaymentDebugEnabled } from '../config/runtime.js';

const router = express.Router();
const paymentDebugLog = (...args) => {
  if (isPaymentDebugEnabled()) {
    console.log(...args);
  }
};

/**
 * Grup içindeki tüm siparişleri güncelle
 */
async function updateOrderGroupPaymentStatus(groupId, paymentStatus, paymentTransactionId, paymentResponse, paidAt, paymentError) {
  if (!groupId) return;
  
  try {
    const pool = await getConnection();
    const request = pool.request();
    request.input('groupId', sql.NVarChar, groupId);
    request.input('paymentStatus', sql.NVarChar, paymentStatus);
    if (paymentTransactionId) request.input('paymentTransactionId', sql.NVarChar, paymentTransactionId);
    if (paymentResponse) request.input('paymentResponse', sql.NVarChar(sql.MAX), JSON.stringify(paymentResponse));
    if (paidAt) request.input('paidAt', sql.DateTime, paidAt);
    if (paymentError) request.input('paymentError', sql.NVarChar(1024), paymentError?.slice(0, 1024) || '');
    
    let query = `
      UPDATE Orders
      SET PaymentStatus = @paymentStatus
    `;
    
    if (paymentTransactionId) query += `, PaymentTransactionId = @paymentTransactionId`;
    if (paymentResponse) query += `, PaymentResponse = @paymentResponse`;
    if (paidAt) query += `, PaidAt = @paidAt`;
    if (paymentError) query += `, PaymentError = @paymentError`;
    
    query += ` WHERE GroupId = @groupId AND PaymentStatus = 'Pending'`;
    
    const result = await request.query(query);
    paymentDebugLog(`Updated ${result.rowsAffected[0]} grouped orders for ${groupId}`);
    return result.rowsAffected[0];
  } catch (error) {
    console.error('❌ Grup güncelleme hatası:', error);
    return 0;
  }
}

/**
 * Ödeme başarılı olduğunda e-posta ve bildirim gönder
 */
async function sendPaymentSuccessNotifications(orderId) {
  try {
    const pool = await getConnection();
    
    // Sipariş detaylarını al
    const orderResult = await pool
      .request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT *
        FROM Orders
        WHERE Id = @orderId
      `);

    if (orderResult.recordset.length === 0) {
      console.error(`❌ Sipariş bulunamadı: ${orderId}`);
      return;
    }

    const order = orderResult.recordset[0];

    // Item'ları al
    const itemsResult = await pool
      .request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT oi.*, r.Name as RestaurantName
        FROM OrderItems oi
        LEFT JOIN Restaurants r ON r.Id = oi.RestaurantId
        WHERE oi.OrderId = @orderId
        ORDER BY oi.RestaurantId, oi.Id
      `);

    const items = itemsResult.recordset;
    
    // Restoran bazında grupla
    const restaurantGroups = new Map();
    for (const item of items) {
      const restaurantId = item.RestaurantId;
      if (!restaurantGroups.has(restaurantId)) {
        restaurantGroups.set(restaurantId, {
          restaurantId,
          restaurantName: item.RestaurantName || 'Bilinmeyen Restoran',
          items: [],
          subtotal: 0,
        });
      }
      const group = restaurantGroups.get(restaurantId);
      const productName = item.VariantName 
        ? `${item.ProductName} (${item.VariantName})` 
        : item.ProductName;
      group.items.push({
        productName,
        variantName: item.VariantName,
        quantity: item.Quantity,
        productPrice: parseFloat(item.ProductPrice),
        subtotal: parseFloat(item.Subtotal),
        restaurantName: item.RestaurantName,
      });
      group.subtotal += parseFloat(item.Subtotal);
    }

    // E-posta gönder (ilk restoran için, tüm item'ları içerir)
    const orderForEmail = {
      OrderNumber: order.OrderNumber,
      CustomerName: order.CustomerName,
      CustomerPhone: order.CustomerPhone,
      CustomerAddress: order.CustomerAddress,
      Notes: order.Notes,
      SubTotal: parseFloat(order.SubTotal),
      DiscountAmount: parseFloat(order.DiscountAmount || 0),
      TotalAmount: parseFloat(order.TotalAmount),
      CouponCode: order.CouponCode,
      CreatedAt: order.CreatedAt,
      OrderCount: restaurantGroups.size,
    };

    const orderItemsForEmail = items.map((item) => ({
      ProductName: item.VariantName 
        ? `${item.ProductName} (${item.VariantName})` 
        : item.ProductName,
      ProductPrice: parseFloat(item.ProductPrice),
      Quantity: item.Quantity,
      Subtotal: parseFloat(item.Subtotal),
      RestaurantName: item.RestaurantName,
    }));

    sendOrderEmail(orderForEmail, orderItemsForEmail).catch((err) =>
      console.error('❌ E-posta gönderimi başarısız:', err)
    );

    // Socket bildirimi gönder (her restoran için)
    const restaurantOrders = Array.from(restaurantGroups.values()).map(group => ({
      restaurantId: group.restaurantId,
      restaurantName: group.restaurantName,
      items: group.items,
      subtotal: group.subtotal,
    }));

    notifyNewOrder(orderId, restaurantOrders).catch((err) =>
      console.error('❌ Yazıcı bildirimi başarısız:', err)
    );

    paymentDebugLog(`Payment success notifications sent for ${order.OrderNumber}`);
  } catch (error) {
    console.error('❌ Ödeme başarılı bildirim hatası:', error);
  }
}

/**
 * Ödeme işlemini başlat
 * 3D Secure kontrolü yapar ve gerekirse ACS'e yönlendirir
 * POST /api/payment/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const {
      orderId,
      amount,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      clientIp,
      installmentCount = 0,
    } = req.body;

    // Validasyon
    if (!orderId || !amount || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'Eksik bilgi: orderId, amount, cardNumber, expiryMonth, expiryYear, cvv gerekli',
      });
    }

    // Client IP kontrolü (reverse proxy desteği: X-Forwarded-For)
    const ip =
      clientIp ||
      (req.headers['x-forwarded-for'] || '')
        .toString()
        .split(',')[0]
        .trim() ||
      req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      '0.0.0.0';

    // Expiry date formatları:
    // - Enrollment (MPI) için: YYMM
    // - VPOS (non-secure) için: YYYYMM
    const expiryDate = `${expiryYear.toString().slice(-2)}${String(expiryMonth).padStart(2, '0')}`; // YYMM (MPI)
    const vposExpiry = `${String(expiryYear)}${String(expiryMonth).padStart(2, '0')}`; // YYYYMM (VPOS)

    // Callback URL'lerini al ve tek kullanımlık callbackToken üret
    getCallbackUrls();
    const callbackToken = crypto.randomBytes(16).toString('hex');
    const baseCallbackUrl = `${req.protocol}://${req.get('host')}/api/payment/callback/3d-secure`;
    const successUrl = `${baseCallbackUrl}?cbt=${callbackToken}`;
    const failureUrl = `${baseCallbackUrl}?cbt=${callbackToken}`;

    // Benzersiz transaction ID oluştur
    const verifyEnrollmentRequestId = `ENR_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 3D Secure Enrollment kontrolü
    const enrollmentResult = await checkEnrollment({
      pan: cardNumber.replace(/\s/g, ''),
      expiryDate: expiryDate,
      purchaseAmount: amount,
      verifyEnrollmentRequestId: verifyEnrollmentRequestId,
      successUrl: successUrl,
      failureUrl: failureUrl,
      installmentCount: installmentCount,
    });

    if (!enrollmentResult.success) {
      // Detaylı hata mesajı
      const errorMessage = enrollmentResult.errorMessage 
        ? `${enrollmentResult.message} - ${enrollmentResult.errorMessage}`
        : enrollmentResult.message || 'Enrollment kontrolü başarısız';
      
      console.error('❌ Enrollment başarısız:', {
        errorCode: enrollmentResult.errorCode,
        errorMessage: enrollmentResult.errorMessage,
        message: enrollmentResult.message,
      });
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        errorCode: enrollmentResult.errorCode,
        errorDetails: {
          status: enrollmentResult.status,
          errorCode: enrollmentResult.errorCode,
          errorMessage: enrollmentResult.errorMessage,
        },
      });
    }

    // Veritabanında ödeme kaydı oluştur (Pending durumunda)
    const pool = await getConnection();
    
    // Önce order'ı al ve groupId'sini kontrol et
    const orderCheck = await pool
      .request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT Id, GroupId
        FROM Orders
        WHERE Id = @orderId
      `);
    
    if (orderCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı',
      });
    }
    
    const orderGroupId = orderCheck.recordset[0].GroupId;
    
    // Enrollment sonucunu kaydet (MD dahil, callback için gerekli)
    const enrollmentData = {
      verifyEnrollmentRequestId,
      enrolled: enrollmentResult.enrolled,
      callbackToken,
      groupId: orderGroupId, // callback'te kullanmak için kaydet
      ...(enrollmentResult.md && { md: enrollmentResult.md }),
      actualBrand: enrollmentResult.actualBrand ?? null
    };
    
    await pool
      .request()
      .input('orderId', sql.Int, orderId)
      .input('verifyEnrollmentRequestId', sql.NVarChar, verifyEnrollmentRequestId)
      .input('enrollmentData', sql.NVarChar(sql.MAX), JSON.stringify(enrollmentData))
      .input('paymentStatus', sql.NVarChar, 'Pending')
      .input('paymentMethod', sql.NVarChar, 'credit_card')
      .query(`
        UPDATE Orders
        SET PaymentStatus = @paymentStatus,
            PaymentMethod = @paymentMethod,
            PaymentResponse = @enrollmentData,
            VerifyEnrollmentRequestId = @verifyEnrollmentRequestId
        WHERE Id = @orderId
      `);

    if (enrollmentResult.enrolled) {
      // Kart 3D Secure programına dahil - ACS'e yönlendir
      paymentDebugLog('Enrollment succeeded:', {
        acsUrl: enrollmentResult.acsUrl,
        termUrl: enrollmentResult.termUrl,
        hasMd: !!enrollmentResult.md,
        hasPaReq: !!enrollmentResult.paReq,
        mdLength: enrollmentResult.md?.length || 0,
        paReqLength: enrollmentResult.paReq?.length || 0,
        actualBrand: enrollmentResult.actualBrand,
        warning: enrollmentResult.warning,
      });

      return res.json({
        success: true,
        enrolled: true,
        requires3DSecure: true,
        acsUrl: enrollmentResult.acsUrl,
        paReq: enrollmentResult.paReq || null, // PaReq yoksa null gönder
        termUrl: enrollmentResult.termUrl,
        md: enrollmentResult.md,
        actualBrand: enrollmentResult.actualBrand,
        verifyEnrollmentRequestId: verifyEnrollmentRequestId,
        warning: enrollmentResult.warning,
        message: 'Kart 3D Secure programına dahil. ACS doğrulaması gerekiyor.',
      });
    } else {
      // Kart 3D Secure programına dahil değil - Direkt ödeme yap (Half Secure)
      paymentDebugLog('Card is not enrolled in 3D Secure. Falling back to half secure flow.');

      // Transaction ID oluştur
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Non-Secure ödeme yap
      const paymentResult = await processNonSecurePayment({
        pan: cardNumber.replace(/\s/g, ''),
        expiryDate: vposExpiry,
        cvv: cvv,
        amount: amount,
        transactionId: transactionId,
        clientIp: ip,
        installmentCount: installmentCount,
      });

      // Veritabanını güncelle
      if (paymentResult.success) {
        await pool
          .request()
          .input('orderId', sql.Int, orderId)
          .input('paymentStatus', sql.NVarChar, 'Paid')
          .input('paymentTransactionId', sql.NVarChar, paymentResult.transactionId)
          .input('paymentResponse', sql.NVarChar(sql.MAX), JSON.stringify(paymentResult))
          .input('paidAt', sql.DateTime, new Date())
          .query(`
            UPDATE Orders
            SET PaymentStatus = @paymentStatus,
                PaymentTransactionId = @paymentTransactionId,
                PaymentResponse = @paymentResponse,
                PaidAt = @paidAt
            WHERE Id = @orderId
          `);

        // Grup içindeki diğer siparişleri de güncelle
        if (orderGroupId) {
          await updateOrderGroupPaymentStatus(
            orderGroupId,
            'Paid',
            paymentResult.transactionId,
            paymentResult,
            new Date(),
            null
          );
        }

        // Ödeme başarılı - e-posta ve bildirim gönder
        sendPaymentSuccessNotifications(orderId).catch(err =>
          console.error('❌ Bildirim gönderme hatası:', err)
        );

        return res.json({
          success: true,
          enrolled: false,
          requires3DSecure: false,
          paymentResult: {
            transactionId: paymentResult.transactionId,
            rrn: paymentResult.rrn,
            authCode: paymentResult.authCode,
          },
          message: 'Ödeme başarıyla tamamlandı',
        });
      } else {
        // Ödeme başarısız
        await pool
          .request()
          .input('orderId', sql.Int, orderId)
          .input('paymentStatus', sql.NVarChar, 'Failed')
          .input('paymentError', sql.NVarChar(1024), (paymentResult.errorMessage || 'Ödeme başarısız')?.slice(0, 1024))
          .input('paymentResponse', sql.NVarChar(sql.MAX), JSON.stringify(paymentResult))
          .query(`
            UPDATE Orders
            SET PaymentStatus = @paymentStatus,
                PaymentError = @paymentError,
                PaymentResponse = @paymentResponse
            WHERE Id = @orderId
          `);

        // Grup içindeki diğer siparişleri de güncelle
        if (orderGroupId) {
          await updateOrderGroupPaymentStatus(
            orderGroupId,
            'Failed',
            null,
            paymentResult,
            null,
            paymentResult.errorMessage || 'Ödeme başarısız'
          );
        }

        return res.status(400).json({
          success: false,
          enrolled: false,
          requires3DSecure: false,
          message: paymentResult.errorMessage || 'Ödeme başarısız',
          errorCode: paymentResult.resultCode,
        });
      }
    }
  } catch (error) {
    console.error('❌ Ödeme başlatma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Ödeme işlemi başlatılamadı',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * 3D Secure Callback
 * MPI'den dönen PARes'i alır ve provizyon yapar
 * POST /api/payment/callback/3d-secure
 */
// Vakıf Bankası callback hem GET hem POST olabilir
router.get('/callback/3d-secure', async (req, res) => {
  return handle3DSecureCallback(req, res);
});

router.post('/callback/3d-secure', async (req, res) => {
  return handle3DSecureCallback(req, res);
});

/**
 * 3D Secure Callback Handler (GET ve POST için ortak)
 */
async function handle3DSecureCallback(req, res) {
  try {
    // Vakıf Bankası callback parametreleri (TÜM ÖRNEK KODLAR: TempSuccessUrl.php, .jsp, .asp, .cs)
    // POST veya GET olarak gelebilir: Status, MerchantId, VerifyEnrollmentRequestId, PurchAmount, Xid,
    // InstallmentCount, SessionInfo, PurchCurrency, Pan, Expiry, Eci, Cavv
    // NOT: Callback'te MD parametresi YOK (sadece enrollment response'ta var)
    
    // Hem body hem query'den al (bazı durumlarda GET olarak gelebilir)
    const params = { ...req.query, ...req.body };
    
    // Vakıf Bankası callback parametreleri (TÜM ÖRNEK KODLAR: TempSuccessUrl.php, .jsp, .asp, .cs)
    // Callback'te MD YOK - sadece şu parametreler var:
    // Status, MerchantId, VerifyEnrollmentRequestId, PurchAmount, Xid, InstallmentCount,
    // SessionInfo, PurchCurrency, Pan, Expiry, Eci, Cavv
    const {
      Status, // Y, A, U, E, N - ZORUNLU
      Eci, // Electronic Commerce Indicator
      Cavv, // Cardholder Authentication Verification Value
      VerifyEnrollmentRequestId, // ZORUNLU - İşlemi eşleştirmek için
      MerchantId,
      PurchAmount,
      PurchCurrency,
      Pan,
      Expiry, // ExpiryDate callback'te (YYAA formatında gelir)
      Xid,
      InstallmentCount,
      SessionInfo,
      MdStatus, // İlave kontrol için (0, 1, 7) - opsiyonel
      cbt, // callbackToken (initialize sırasında URL query parametresi olarak eklendi)
    } = params;

    paymentDebugLog('3D Secure callback received');
    paymentDebugLog('Callback request summary:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {}),
      queryKeys: Object.keys(req.query || {}),
      Status,
      MdStatus,
      hasEci: !!Eci,
      hasCavv: !!Cavv,
      VerifyEnrollmentRequestId,
      MerchantId,
      PurchAmount,
      InstallmentCount,
    });

    // Vakıf Bankası dokümantasyonuna ve örnek kodlara göre (5.2.2.1):
    // - VerifyEnrollmentRequestId ZORUNLU (işlemi eşleştirmek için)
    // - Status ZORUNLU (Y, A, U, E, N)
    // - Eci ve Cavv, Status Y veya A ise var
    // - MD callback parametrelerinde YOK (sadece enrollment response'ta var, ACS'e gönderilir ama callback'te dönmez)

    if (!VerifyEnrollmentRequestId) {
      console.error('❌ VerifyEnrollmentRequestId parametresi bulunamadı');
      const callbacks = getCallbackUrls();
      return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('İşlem bilgisi bulunamadı')}`);
    }

    if (!Status) {
      console.error('❌ Status parametresi bulunamadı');
      const callbacks = getCallbackUrls();
      return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('Ödeme durumu bulunamadı')}`);
    }

    // MdStatus kontrolü (dokümantasyon 5.2.2.2'ye göre)
    if (MdStatus !== undefined && MdStatus !== null) {
      const mdStatusValue = parseInt(MdStatus);
      if (mdStatusValue === 0) {
        console.warn('⚠️ MdStatus = 0: 3D Secure kod geçersiz veya girilmedi');
      } else if (mdStatusValue === 7) {
        console.warn('⚠️ MdStatus = 7: Hatalı işlem');
      } else if (mdStatusValue === 1) {
        paymentDebugLog('MdStatus=1');
      }
    }

    // Vakıf Bankası dokümantasyonuna göre:
    // Status Y veya A: İşleme devam et
    // Status U, E, N: İşlemi sonlandır (5.2.2.2)
    if (Status !== 'Y' && Status !== 'y' && Status !== 'A' && Status !== 'a') {
      // Status Y veya A değilse işlem başarısız
      console.error('❌ 3D Secure Status başarısız:', Status);
      const pool = await getConnection();
      
      // VerifyEnrollmentRequestId ile order bul ve status güncelle
      const orderResult = await pool
        .request()
        .input('verifyEnrollmentRequestId', sql.NVarChar, VerifyEnrollmentRequestId)
        .query(`
          SELECT TOP 1 Id, TotalAmount, PaymentStatus, PaymentResponse
          FROM Orders
          WHERE VerifyEnrollmentRequestId = @verifyEnrollmentRequestId
          AND PaymentStatus = 'Pending'
          ORDER BY CreatedAt DESC
        `);

      if (orderResult.recordset.length > 0) {
        const order = orderResult.recordset[0];
        await pool
          .request()
          .input('orderId', sql.Int, order.Id)
          .input('paymentStatus', sql.NVarChar, 'Failed')
          .input('paymentError', sql.NVarChar(1024), `3D Secure doğrulaması başarısız (Status: ${Status})`.slice(0, 1024))
          .query(`
            UPDATE Orders
            SET PaymentStatus = @paymentStatus,
                PaymentError = @paymentError
            WHERE Id = @orderId
          `);
      }

      const callbacks = getCallbackUrls();
      return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('3D Secure doğrulaması başarısız')}`);
    }

    // Status Y veya A ise - işleme devam et
    paymentDebugLog('3D Secure status accepted:', {
      status: Status,
      hasEci: !!Eci,
      hasCavv: !!Cavv,
    });

    // VerifyEnrollmentRequestId ile order'ı bul (dokümantasyon 5.2.2.1'e göre zorunlu)
    const pool = await getConnection();
    const orderResult = await pool
      .request()
      .input('verifyEnrollmentRequestId', sql.NVarChar, VerifyEnrollmentRequestId)
      .query(`
        SELECT TOP 1 Id, TotalAmount, PaymentStatus, PaymentResponse, GroupId
        FROM Orders
        WHERE VerifyEnrollmentRequestId = @verifyEnrollmentRequestId
        AND PaymentStatus = 'Pending'
        ORDER BY CreatedAt DESC
      `);

    if (!orderResult || orderResult.recordset.length === 0) {
      console.error('❌ Sipariş bulunamadı - VerifyEnrollmentRequestId:', VerifyEnrollmentRequestId);
      const callbacks = getCallbackUrls();
      return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('Sipariş bulunamadı')}`);
    }

    const order = orderResult.recordset[0];
    const orderGroupId = order.GroupId; // Grup ID'yi sakla
    paymentDebugLog('Pending order resolved for callback:', {
      orderId: order.Id,
      groupId: orderGroupId || null,
    });

    // Callback token doğrulaması (replay ve sahte çağrıları engelle)
    try {
      const pr = JSON.parse(order.PaymentResponse || '{}');
      const expectedToken = pr.callbackToken;
      if (!expectedToken || !cbt || cbt !== expectedToken) {
        console.error('❌ Callback token doğrulaması başarısız');
        const callbacks = getCallbackUrls();
        return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('Geçersiz istek (token)')}`);
      }
    } catch (e) {
      console.error('❌ PaymentResponse parse edilemedi (token kontrolü başarısız)');
      const callbacks = getCallbackUrls();
      return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('Geçersiz istek')}`);
    }

    // Enrollment response'tan brand bilgisini al (ECI hesaplaması için)
    let actualBrand = null;
    try {
      const paymentResponse = JSON.parse(order.PaymentResponse || '{}');
      actualBrand = paymentResponse.actualBrand; // 100=Visa, 200=MasterCard, 300=Troy
    } catch (err) {
      console.warn('⚠️ PaymentResponse parse edilemedi:', err.message);
    }

    // Client IP al (reverse proxy desteği: X-Forwarded-For)
    const clientIp =
      (req.headers['x-forwarded-for'] || '')
        .toString()
        .split(',')[0]
        .trim() ||
      req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      '0.0.0.0';

    // Transaction ID oluştur
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // ECI hesaplama (dokümantasyon 5.2.2.2'ye göre marka bazında)
    // Eğer callback'ten ECI gelmemişse, marka ve Status'a göre hesapla
    let finalEci = Eci;
    if (!finalEci) {
      // Marka bilgisi varsa markaya göre hesapla
      if (actualBrand === 100 || actualBrand === '100') {
        // Visa
        if (Status === 'Y' || Status === 'y') {
          finalEci = '05';
        } else if (Status === 'A' || Status === 'a') {
          finalEci = '06';
        }
      } else if (actualBrand === 200 || actualBrand === '200' || actualBrand === 300 || actualBrand === '300') {
        // MasterCard veya Troy
        if (Status === 'Y' || Status === 'y') {
          finalEci = '02';
        } else if (Status === 'A' || Status === 'a') {
          finalEci = '01';
        }
      } else {
        // Marka bilgisi yok - varsayılan Visa
        if (Status === 'Y' || Status === 'y') {
          finalEci = '05';
        } else if (Status === 'A' || Status === 'a') {
          finalEci = '06';
        }
      }
      paymentDebugLog('ECI calculated:', {
        brand: actualBrand || 'unknown',
        status: Status,
        eci: finalEci,
      });
    }

    // ECI zorunlu kontrolü
    if (!finalEci) {
      console.error('❌ ECI hesaplanamadı');
      await pool
        .request()
        .input('orderId', sql.Int, order.Id)
        .input('paymentStatus', sql.NVarChar, 'Failed')
        .input('paymentError', sql.NVarChar(1024), 'ECI değeri bulunamadı')
        .query(`
          UPDATE Orders
          SET PaymentStatus = @paymentStatus,
              PaymentError = @paymentError
          WHERE Id = @orderId
        `);
      
      const callbacks = getCallbackUrls();
      return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('Ödeme bilgisi eksik (ECI)')}&orderId=${order.Id}`);
    }

    // CAVV kontrolü (Status Y veya A ise genelde var, ama yoksa da devam edebiliriz)
    if ((Status === 'Y' || Status === 'y' || Status === 'A' || Status === 'a') && !Cavv) {
      console.warn('⚠️ CAVV gelmedi ama Status başarılı - devam ediliyor (CAVV olmadan gönderilecek)');
    }

    // Tutar manipülasyonuna karşı doğrulama: Callback'ten gelen tutar ile sipariş tutarını eşleştir
    const orderTotal = parseFloat(order.TotalAmount) || 0;
    const cbAmount = parseFloat(PurchAmount) || 0;
    if (cbAmount && Math.abs(cbAmount - orderTotal) > 0.005) {
      // Tutar uyumsuzluğu - işlemi reddet
      console.error(`❌ Tutar uyumsuzluğu tespit edildi: Callback tutarı: ${cbAmount}, Sipariş tutarı: ${orderTotal}`);
      await pool
        .request()
        .input('orderId', sql.Int, order.Id)
        .input('paymentStatus', sql.NVarChar, 'Failed')
        .input('paymentError', sql.NVarChar(512), `Tutar uyumsuz (CB:${cbAmount} != ORD:${orderTotal})`)
        .query(`UPDATE Orders SET PaymentStatus=@paymentStatus, PaymentError=@paymentError WHERE Id=@orderId`);
      const callbacks = getCallbackUrls();
      return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('Tutar uyuşmazlığı')}&orderId=${order.Id}`);
    }

    // 3D Secure ödeme yap (Vakıf Bankası direkt ECI ve CAVV gönderiyor, PARes parse etmeye gerek yok)
    // CAVV yoksa null gönder (process3DSecurePayment içinde kontrol ediliyor)
    const paymentResult = await process3DSecurePayment({
      md: null, // MD callback'te gelmiyor (dokümantasyon 5.2.2.1)
      paRes: null, // Vakıf Bankası callback'te PARes göndermiyor
      amount: orderTotal, // bankaya gönderilen tutarı siparişten al
      transactionId: transactionId,
      clientIp: clientIp,
      eci: finalEci,
      cavv: Cavv || null, // CAVV yoksa null gönder (XML'e eklenmez)
      installmentCount: InstallmentCount ? parseInt(InstallmentCount) : 0,
      verifyEnrollmentRequestId: VerifyEnrollmentRequestId,
    });

      // Veritabanını güncelle
      if (paymentResult.success) {
        await pool
          .request()
          .input('orderId', sql.Int, order.Id)
          .input('paymentStatus', sql.NVarChar, 'Paid')
          .input('paymentTransactionId', sql.NVarChar, paymentResult.transactionId)
          .input('paymentResponse', sql.NVarChar(sql.MAX), JSON.stringify(paymentResult))
          .input('paidAt', sql.DateTime, new Date())
          .query(`
            UPDATE Orders
            SET PaymentStatus = @paymentStatus,
                PaymentTransactionId = @paymentTransactionId,
                PaymentResponse = @paymentResponse,
                PaidAt = @paidAt
            WHERE Id = @orderId
          `);

        // Grup içindeki diğer siparişleri de güncelle
        if (orderGroupId) {
          await updateOrderGroupPaymentStatus(
            orderGroupId,
            'Paid',
            paymentResult.transactionId,
            paymentResult,
            new Date(),
            null
          );
        }

        // Ödeme başarılı - e-posta ve bildirim gönder
        sendPaymentSuccessNotifications(order.Id).catch(err =>
          console.error('❌ Bildirim gönderme hatası:', err)
        );

        // Frontend'e yönlendir (success sayfasına)
        const callbacks = getCallbackUrls();
        return res.redirect(`${callbacks.successUrl}?transactionId=${paymentResult.transactionId}&orderId=${order.Id}`);
      } else {
        // Ödeme başarısız
        await pool
          .request()
          .input('orderId', sql.Int, order.Id)
          .input('paymentStatus', sql.NVarChar, 'Failed')
          .input('paymentError', sql.NVarChar(1024), (paymentResult.errorMessage || '3D Secure ödeme başarısız')?.slice(0, 1024))
          .input('paymentResponse', sql.NVarChar(sql.MAX), JSON.stringify(paymentResult))
          .query(`
            UPDATE Orders
            SET PaymentStatus = @paymentStatus,
                PaymentError = @paymentError,
                PaymentResponse = @paymentResponse
            WHERE Id = @orderId
          `);

        // Grup içindeki diğer siparişleri de güncelle
        if (orderGroupId) {
          await updateOrderGroupPaymentStatus(
            orderGroupId,
            'Failed',
            null,
            paymentResult,
            null,
            paymentResult.errorMessage || '3D Secure ödeme başarısız'
          );
        }

        // Frontend'e yönlendir (failure sayfasına)
        const callbacks = getCallbackUrls();
        return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent(paymentResult.errorMessage || 'Ödeme başarısız')}&orderId=${order.Id}`);
      }
  } catch (error) {
    console.error('❌ 3D Secure callback hatası:', error);
    const callbacks = getCallbackUrls();
    return res.redirect(`${callbacks.failureUrl}?error=${encodeURIComponent('Beklenmeyen bir hata oluştu')}`);
  }
}

/**
 * Ödeme durumu sorgulama
 * GET /api/payment/status/:transactionId
 */
router.get('/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('transactionId', sql.NVarChar, transactionId)
      .query(`
        SELECT Id, OrderNumber, PaymentStatus, PaymentTransactionId, PaidAt, PaymentError
        FROM Orders
        WHERE PaymentTransactionId = @transactionId
           OR PaymentResponse LIKE '%' + @transactionId + '%'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme kaydı bulunamadı',
      });
    }

    const order = result.recordset[0];

    return res.json({
      success: true,
      data: {
        orderId: order.Id,
        orderNumber: order.OrderNumber,
        paymentStatus: order.PaymentStatus,
        paymentTransactionId: order.PaymentTransactionId,
        paidAt: order.PaidAt,
        paymentError: order.PaymentError,
      },
    });
  } catch (error) {
    console.error('❌ Ödeme durumu sorgulama hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Ödeme durumu sorgulanamadı',
    });
  }
});

/**
 * Offline ödeme (kapıda ödeme / gel-al)
 * POST /api/payment/offline
 * Body: { orderId: number, method: 'cash_on_delivery' | 'card_on_delivery' | 'pickup' }
 */
router.post('/offline', async (req, res) => {
  try {
    const { orderId, method } = req.body;

    const allowedMethods = new Set(['cash_on_delivery', 'card_on_delivery', 'pickup']);
    if (!orderId || !method || !allowedMethods.has(method)) {
      return res.status(400).json({ success: false, message: 'Geçersiz istek' });
    }

    const pool = await getConnection();

    // Sipariş doğrula (hala işlem yapılabilir durumda mı?)
    const orderResult = await pool
      .request()
      .input('orderId', sql.Int, orderId)
      .query(`
        SELECT TOP 1 Id, PaymentStatus, GroupId FROM Orders WHERE Id = @orderId
      `);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
    }

    const order = orderResult.recordset[0];
    const orderGroupId = order.GroupId;
    if (order.PaymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Sipariş zaten ödenmiş' });
    }

    // Offline ödeme: kasada/kapıda tahsil edilecek → sistemde bekleyen durum
    const offlineStatus = 'AwaitingPayment';

    await pool
      .request()
      .input('orderId', sql.Int, orderId)
      .input('paymentMethod', sql.NVarChar, method)
      .input('paymentStatus', sql.NVarChar, offlineStatus)
      .query(`
        UPDATE Orders
        SET PaymentMethod = @paymentMethod,
            PaymentStatus = @paymentStatus
        WHERE Id = @orderId
      `);

    // Grup içindeki diğer siparişleri de güncelle
    if (orderGroupId) {
      await pool
        .request()
        .input('groupId', sql.NVarChar, orderGroupId)
        .input('paymentMethod', sql.NVarChar, method)
        .input('paymentStatus', sql.NVarChar, offlineStatus)
        .query(`
          UPDATE Orders
          SET PaymentMethod = @paymentMethod,
              PaymentStatus = @paymentStatus
          WHERE GroupId = @groupId AND PaymentStatus = 'Pending'
        `);
    }

    // Ödeme başarılı gibi mutfağa düşmesi gerekir → bildirim/e-posta gönder
    try {
      await sendPaymentSuccessNotifications(orderId);
    } catch (err) {
      console.error('⚠️ Offline bildirim hatası:', err);
    }

    return res.json({ success: true, message: 'Offline ödeme seçildi', orderId, paymentMethod: method, paymentStatus: offlineStatus });
  } catch (error) {
    console.error('❌ Offline ödeme ayarlama hatası:', error);
    return res.status(500).json({ success: false, message: 'İşlem gerçekleştirilemedi' });
  }
});

export default router;
