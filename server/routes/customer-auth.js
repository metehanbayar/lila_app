import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

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
        SELECT Id, Email, FullName, Phone, Address, EmailVerified, PhoneVerified
        FROM Customers
        WHERE (Phone = @identifier OR Email = @identifier) AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz oturum',
      });
    }

    req.customer = result.recordset[0];
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
    const { phone, fullName, email, address, otp } = req.body;

    // Validasyon
    if (!phone || !fullName || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Telefon, ad soyad ve doğrulama kodu zorunludur',
      });
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const pool = await getConnection();

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

    // Yeni müşteri kaydı (şifresiz - OTP ile giriş yapılacak)
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email || null)
      .input('fullName', sql.NVarChar, fullName)
      .input('phone', sql.NVarChar, cleanPhone)
      .input('address', sql.NVarChar, address || null)
      .query(`
        INSERT INTO Customers (Email, FullName, Phone, Address, PhoneVerified, EmailVerified)
        OUTPUT INSERTED.Id, INSERTED.Email, INSERTED.FullName, INSERTED.Phone, INSERTED.Address
        VALUES (@email, @fullName, @phone, @address, 1, 0)
      `);

    const customer = result.recordset[0];

    // Token oluştur (telefon bazlı)
    const token = Buffer.from(`${cleanPhone}:otp`).toString('base64');

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı! Hoş geldiniz.',
      data: {
        customer: {
          id: customer.Id,
          email: customer.Email,
          fullName: customer.FullName,
          phone: customer.Phone,
          address: customer.Address,
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

    // Müşteri bilgilerini getir
    const result = await pool
      .request()
      .input('phone', sql.NVarChar, cleanPhone)
      .query(`
        SELECT Id, Email, FullName, Phone, Address, EmailVerified, PhoneVerified, IsActive
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
          fullName: customer.FullName,
          phone: customer.Phone,
          address: customer.Address,
          emailVerified: customer.EmailVerified,
          phoneVerified: customer.PhoneVerified,
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
    const { fullName, phone, address } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Ad soyad gerekli',
      });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, req.customer.Id)
      .input('fullName', sql.NVarChar, fullName)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .query(`
        UPDATE Customers
        SET 
          FullName = @fullName,
          Phone = @phone,
          Address = @address
        OUTPUT INSERTED.Id, INSERTED.Email, INSERTED.FullName, INSERTED.Phone, INSERTED.Address
        WHERE Id = @id
      `);

    res.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Profil güncellenirken bir hata oluştu',
    });
  }
});

// Şifre değiştir
router.put('/change-password', customerAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut ve yeni şifre gerekli',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 6 karakter olmalıdır',
      });
    }

    const pool = await getConnection();

    // Mevcut şifreyi kontrol et
    const checkPassword = await pool
      .request()
      .input('id', sql.Int, req.customer.Id)
      .input('password', sql.NVarChar, currentPassword)
      .query(`
        SELECT Id FROM Customers 
        WHERE Id = @id AND Password = @password
      `);

    if (checkPassword.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut şifre hatalı',
      });
    }

    // Yeni şifreyi güncelle
    await pool
      .request()
      .input('id', sql.Int, req.customer.Id)
      .input('newPassword', sql.NVarChar, newPassword)
      .query(`
        UPDATE Customers
        SET Password = @newPassword
        WHERE Id = @id
      `);

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi',
    });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Şifre değiştirilirken bir hata oluştu',
    });
  }
});

export default router;

