import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { sendSMS, generateOTP, createOTPMessage } from '../config/sms.js';

const router = express.Router();

// OTP sistemini devre dışı bırakma kontrolü
const isOTPEnabled = () => {
  return process.env.OTP_ENABLED !== 'false';
};

// OTP gönder
router.post('/send', async (req, res) => {
  try {
    const { phone, purpose } = req.body; // purpose: 'register' veya 'login'
    let { name } = req.body; // name: isim soyisim (let olarak tanımla)

    // OTP devre dışıysa, demo mod
    if (!isOTPEnabled()) {
      console.log('⚠️ OTP DEVRE DIŞI - Demo mod aktif');
      return res.json({
        success: true,
        message: 'OTP devre dışı - Demo mod',
        otp: '123456', // Demo OTP kodu
      });
    }

    // Validasyon
    if (!phone || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası ve amaç gereklidir',
      });
    }

    // Telefon numarası formatı kontrolü (Türkiye)
    const phoneRegex = /^(05|5)[0-9]{9}$/;
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir telefon numarası girin (05xxxxxxxxx)',
      });
    }

    const pool = await getConnection();

    // Eğer kayıt için OTP gönderiliyorsa, telefon zaten kayıtlı mı kontrol et
    if (purpose === 'register') {
      const existingCustomer = await pool
        .request()
        .input('phone', sql.NVarChar, cleanPhone)
        .query(`
          SELECT Id FROM Customers WHERE Phone = @phone
        `);

      if (existingCustomer.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu telefon numarası zaten kayıtlı',
        });
      }
    }

    // Eğer giriş için OTP gönderiliyorsa, telefon kayıtlı mı kontrol et
    if (purpose === 'login') {
      const existingCustomer = await pool
        .request()
        .input('phone', sql.NVarChar, cleanPhone)
        .query(`
          SELECT Id, IsActive, FirstName, LastName FROM Customers WHERE Phone = @phone
        `);

      if (existingCustomer.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bu telefon numarası kayıtlı değil',
        });
      }

      if (!existingCustomer.recordset[0].IsActive) {
        return res.status(403).json({
          success: false,
          message: 'Hesabınız pasif durumda',
        });
      }

      // Login için müşteri adını al
      if (!name && existingCustomer.recordset[0].FirstName) {
        const firstName = existingCustomer.recordset[0].FirstName || '';
        const lastName = existingCustomer.recordset[0].LastName || '';
        name = `${firstName} ${lastName}`.trim();
      }
    }

    // Son 5 dakika içinde aynı telefon için gönderilmiş OTP var mı?
    const recentOTP = await pool
      .request()
      .input('phone', sql.NVarChar, cleanPhone)
      .input('fiveMinutesAgo', sql.DateTime, new Date(Date.now() - 5 * 60 * 1000))
      .input('purpose', sql.NVarChar, purpose)
      .query(`
        SELECT TOP 1 Id, CreatedAt 
        FROM OTPVerification 
        WHERE Phone = @phone 
          AND CreatedAt > @fiveMinutesAgo
          AND Purpose = @purpose
        ORDER BY CreatedAt DESC
      `);

    if (recentOTP.recordset.length > 0) {
      const lastSentAt = new Date(recentOTP.recordset[0].CreatedAt);
      const waitTime = Math.ceil((5 * 60 * 1000 - (Date.now() - lastSentAt.getTime())) / 1000);
      
      return res.status(429).json({
        success: false,
        message: `Lütfen ${waitTime} saniye sonra tekrar deneyin`,
        waitTime,
      });
    }

    // OTP kodu oluştur
    const otpCode = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerli

    // OTP'yi veritabanına kaydet
    await pool
      .request()
      .input('phone', sql.NVarChar, cleanPhone)
      .input('otpCode', sql.NVarChar, otpCode)
      .input('purpose', sql.NVarChar, purpose)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO OTPVerification (Phone, OTPCode, Purpose, ExpiresAt)
        VALUES (@phone, @otpCode, @purpose, @expiresAt)
      `);

    // SMS gönder
    const message = createOTPMessage(otpCode, purpose, name);
    const smsSent = await sendSMS(cleanPhone, message);

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'SMS gönderilemedi. Lütfen tekrar deneyin.',
      });
    }

    res.json({
      success: true,
      message: 'Doğrulama kodu telefonunuza gönderildi',
      // Geliştirme ortamında OTP'yi döndür (production'da kaldırılmalı)
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
    });
  } catch (error) {
    console.error('OTP gönderme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Doğrulama kodu gönderilirken bir hata oluştu',
    });
  }
});

// OTP doğrula
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp, purpose } = req.body;

    // OTP devre dışıysa, her kodu kabul et
    if (!isOTPEnabled()) {
      console.log('⚠️ OTP DEVRE DIŞI - Demo mod aktif - Her kod geçerli');
      return res.json({
        success: true,
        message: 'Doğrulama başarılı (Demo mod)',
      });
    }

    // Validasyon
    if (!phone || !otp || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası, OTP kodu ve amaç gereklidir',
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const pool = await getConnection();

    // OTP'yi kontrol et
    const otpResult = await pool
      .request()
      .input('phone', sql.NVarChar, cleanPhone)
      .input('otpCode', sql.NVarChar, otp)
      .input('purpose', sql.NVarChar, purpose)
      .query(`
        SELECT TOP 1 Id, ExpiresAt, IsVerified
        FROM OTPVerification
        WHERE Phone = @phone 
          AND OTPCode = @otpCode 
          AND Purpose = @purpose
        ORDER BY CreatedAt DESC
      `);

    if (otpResult.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz doğrulama kodu',
      });
    }

    const otpRecord = otpResult.recordset[0];

    // Zaten doğrulanmış mı?
    if (otpRecord.IsVerified) {
      return res.status(400).json({
        success: false,
        message: 'Bu kod zaten kullanılmış',
      });
    }

    // Süresi dolmuş mu?
    if (new Date() > new Date(otpRecord.ExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Doğrulama kodunun süresi dolmuş. Yeni kod isteyin.',
      });
    }

    // OTP'yi doğrulanmış olarak işaretle
    await pool
      .request()
      .input('id', sql.Int, otpRecord.Id)
      .query(`
        UPDATE OTPVerification
        SET IsVerified = 1, VerifiedAt = GETDATE()
        WHERE Id = @id
      `);

    res.json({
      success: true,
      message: 'Doğrulama başarılı',
    });
  } catch (error) {
    console.error('OTP doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Doğrulama yapılırken bir hata oluştu',
    });
  }
});

// Eski/süresi dolmuş OTP'leri temizle (Opsiyonel - cron job ile çalıştırılabilir)
router.delete('/cleanup', async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('now', sql.DateTime, new Date())
      .query(`
        DELETE FROM OTPVerification
        WHERE ExpiresAt < @now OR (IsVerified = 1 AND VerifiedAt < DATEADD(day, -7, @now))
      `);

    res.json({
      success: true,
      message: `${result.rowsAffected[0]} kayıt temizlendi`,
    });
  } catch (error) {
    console.error('OTP temizleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Temizleme sırasında bir hata oluştu',
    });
  }
});

export default router;

