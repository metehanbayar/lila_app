import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// OTP sistemini devre dışı bırakma kontrolü
const isOTPEnabled = () => {
  return process.env.OTP_ENABLED !== 'false';
};

// Customer authentication middleware
export const customerAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Giriş yapmanız gerekiyor',
      });
    }

    // Token'dan telefon bilgisini çıkar
    const [identifier] = Buffer.from(token, 'base64').toString().split(':');
    
    const pool = await getConnection();
    
    // Telefon veya email ile kullanıcı bul
    const result = await pool
      .request()
      .input('identifier', sql.NVarChar, identifier)
      .query(`
        SELECT Id, Email, FirstName, LastName, Phone, DateOfBirth, Gender, ReferralCode
        FROM Customers
        WHERE (Phone = @identifier OR Email = @identifier) AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz oturum',
      });
    }

    // fullName'i oluştur
    const customer = result.recordset[0];
    customer.FullName = `${customer.FirstName || ''} ${customer.LastName || ''}`.trim();

    req.customer = customer;
    next();
  } catch (error) {
    console.error('Customer auth middleware hatası:', error);
    res.status(401).json({
      success: false,
      message: 'Yetkilendirme hatası',
    });
  }
};

// Müşteri kaydı (OTP ile)
router.post('/register', async (req, res) => {
  try {
    const { phone, fullName, email, dateOfBirth, gender, referralCode, otp } = req.body;

    // Validasyon
    if (!phone || !fullName || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Telefon, ad soyad ve doğrulama kodu zorunludur',
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const pool = await getConnection();

    // OTP devre dışıysa, doğrulama kontrolünü atla
    if (!isOTPEnabled()) {
      console.log('⚠️ OTP DEVRE DIŞI - Kayıt işlemi OTP olmadan devam ediyor');
    } else {
      // OTP doğrulaması
      const otpResult = await pool
        .request()
        .input('phone', sql.NVarChar, cleanPhone)
        .input('otpCode', sql.NVarChar, otp)
        .input('purpose', sql.NVarChar, 'register')
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

      if (!otpRecord.IsVerified) {
        return res.status(400).json({
          success: false,
          message: 'Doğrulama kodu henüz doğrulanmamış',
        });
      }

      if (new Date() > new Date(otpRecord.ExpiresAt)) {
        return res.status(400).json({
          success: false,
          message: 'Doğrulama kodunun süresi dolmuş',
        });
      }
    }

    // Telefon zaten kayıtlı mı?
    const checkPhone = await pool
      .request()
      .input('phone', sql.NVarChar, cleanPhone)
      .query(`
        SELECT Id FROM Customers WHERE Phone = @phone
      `);

    if (checkPhone.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu telefon numarası zaten kayıtlı',
      });
    }

    // E-posta varsa ve kayıtlı mı kontrol et
    if (email) {
      const checkEmail = await pool
        .request()
        .input('email', sql.NVarChar, email)
        .query(`
          SELECT Id FROM Customers WHERE Email = @email
        `);

      if (checkEmail.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu e-posta adresi zaten kayıtlı',
        });
      }
    }

    // fullName'i parçala
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Referral code kontrolü ve referrer'ı bul
    let referredBy = null;
    if (referralCode) {
      const referrerCheck = await pool
        .request()
        .input('refCode', sql.NVarChar, referralCode)
        .query(`
          SELECT Id FROM Customers WHERE ReferralCode = @refCode
        `);
      
      if (referrerCheck.recordset.length > 0) {
        referredBy = referrerCheck.recordset[0].Id;
      }
    }

    // Yeni müşteri kaydı (OTP ile)
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email || null)
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('phone', sql.NVarChar, cleanPhone)
      .input('dateOfBirth', sql.Date, dateOfBirth || null)
      .input('gender', sql.NVarChar, gender || null)
      .input('referredBy', sql.Int, referredBy || null)
      .query(`
        INSERT INTO Customers (Email, FirstName, LastName, Phone, DateOfBirth, Gender, ReferredBy)
        OUTPUT INSERTED.Id, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, INSERTED.Phone
        VALUES (@email, @firstName, @lastName, @phone, @dateOfBirth, @gender, @referredBy)
      `);

    // Yeni müşteri için referral code oluştur
    const newCustomerId = result.recordset[0].Id;
    const newReferralCode = 'REF' + String(newCustomerId).padStart(6, '0');
    
    await pool
      .request()
      .input('id', sql.Int, newCustomerId)
      .input('code', sql.NVarChar, newReferralCode)
      .query(`
        UPDATE Customers SET ReferralCode = @code WHERE Id = @id
      `);

    const customer = result.recordset[0];

    // Token oluştur (telefon bazlı)
    const token = Buffer.from(`${cleanPhone}:otp`).toString('base64');

    // fullName'i oluştur
    const customerFullName = `${customer.FirstName} ${customer.LastName}`.trim();

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı! Hoş geldiniz.',
      data: {
        customer: {
          id: customer.Id,
          email: customer.Email,
          fullName: customerFullName,
          phone: customer.Phone,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kayıt olurken bir hata oluştu',
    });
  }
});

// Müşteri girişi (OTP ile)
router.post('/login', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası ve doğrulama kodu gerekli',
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const pool = await getConnection();

    // OTP devre dışıysa, doğrulama kontrolünü atla
    if (!isOTPEnabled()) {
      // OTP devre dışı
    } else {
      // OTP doğrulaması
      const otpResult = await pool
        .request()
        .input('phone', sql.NVarChar, cleanPhone)
        .input('otpCode', sql.NVarChar, otp)
        .input('purpose', sql.NVarChar, 'login')
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

      if (!otpRecord.IsVerified) {
        return res.status(400).json({
          success: false,
          message: 'Doğrulama kodu henüz doğrulanmamış',
        });
      }

      if (new Date() > new Date(otpRecord.ExpiresAt)) {
        return res.status(400).json({
          success: false,
          message: 'Doğrulama kodunun süresi dolmuş',
        });
      }
    }

    // Müşteri bilgilerini getir
    const result = await pool
      .request()
      .input('phone', sql.NVarChar, cleanPhone)
      .query(`
        SELECT Id, Email, FirstName, LastName, Phone, DateOfBirth, Gender, IsActive, ReferralCode
        FROM Customers
        WHERE Phone = @phone
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Bu telefon numarası kayıtlı değil',
      });
    }

    const customer = result.recordset[0];

    if (!customer.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız pasif durumda',
      });
    }

    // fullName'i oluştur
    const customerFullName = `${customer.FirstName || ''} ${customer.LastName || ''}`.trim();

    // Last login güncelle
    await pool
      .request()
      .input('id', sql.Int, customer.Id)
      .query(`
        UPDATE Customers
        SET LastLogin = GETDATE()
        WHERE Id = @id
      `);

    // Token oluştur
    const token = Buffer.from(`${cleanPhone}:otp`).toString('base64');

    res.json({
      success: true,
      message: 'Giriş başarılı!',
      data: {
        customer: {
          id: customer.Id,
          email: customer.Email,
          fullName: customerFullName,
          phone: customer.Phone,
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

// Profil bilgisi getir
router.get('/profile', customerAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.customer,
    });
  } catch (error) {
    console.error('Profil hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil bilgisi alınırken bir hata oluştu',
    });
  }
});

// Profil güncelle
router.put('/profile', customerAuth, async (req, res) => {
  try {
    const { fullName, email, dateOfBirth, gender } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Ad soyad gerekli',
      });
    }

    // fullName'i parçala
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, req.customer.Id)
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('email', sql.NVarChar, email || null)
      .input('dateOfBirth', sql.Date, dateOfBirth || null)
      .input('gender', sql.NVarChar, gender || null)
      .query(`
        UPDATE Customers
        SET 
          FirstName = @firstName,
          LastName = @lastName,
          Email = @email,
          DateOfBirth = @dateOfBirth,
          Gender = @gender,
          UpdatedAt = GETDATE()
        OUTPUT INSERTED.Id, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, INSERTED.Phone
        WHERE Id = @id
      `);

    // Response için fullName'i oluştur
    const updatedCustomer = result.recordset[0];
    updatedCustomer.FullName = `${updatedCustomer.FirstName} ${updatedCustomer.LastName}`.trim();

    res.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: updatedCustomer,
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil güncellenirken bir hata oluştu',
    });
  }
});

export default router;

