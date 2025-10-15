import express from 'express';
import { getConnection, sql } from '../config/database.js';

const router = express.Router();

// Aktif kampanyaları listele (anasayfa için)
router.get('/promotions', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        Id,
        Code,
        Description,
        DiscountType,
        DiscountValue,
        MinimumAmount,
        MaxDiscount,
        ValidFrom,
        ValidUntil,
        DisplayTitle,
        DisplaySubtitle,
        BgColor,
        IconType
      FROM Coupons
      WHERE IsActive = 1
        AND (ValidFrom IS NULL OR ValidFrom <= GETDATE())
        AND (ValidUntil IS NULL OR ValidUntil >= GETDATE())
        AND (UsageLimit IS NULL OR UsedCount < UsageLimit)
      ORDER BY CreatedAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Kampanyalar yüklenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kampanyalar yüklenirken bir hata oluştu',
    });
  }
});

// Kupon doğrulama ve uygulama
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || !subtotal) {
      return res.status(400).json({
        success: false,
        message: 'Kupon kodu ve toplam tutar gereklidir',
      });
    }

    const pool = await getConnection();
    
    // Kuponu getir
    const couponResult = await pool
      .request()
      .input('code', sql.NVarChar, code.trim().toUpperCase())
      .query(`
        SELECT * FROM Coupons
        WHERE Code = @code AND IsActive = 1
      `);

    if (couponResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Geçersiz kupon kodu',
      });
    }

    const coupon = couponResult.recordset[0];

    // Tarih kontrolü
    const now = new Date();
    if (coupon.ValidFrom && new Date(coupon.ValidFrom) > now) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon henüz kullanıma açılmamış',
      });
    }

    if (coupon.ValidUntil && new Date(coupon.ValidUntil) < now) {
      return res.status(400).json({
        success: false,
        message: 'Bu kuponun süresi dolmuş',
      });
    }

    // Kullanım limiti kontrolü
    if (coupon.UsageLimit !== null && coupon.UsedCount >= coupon.UsageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon kullanım limitine ulaşmış',
      });
    }

    // Minimum tutar kontrolü
    if (subtotal < coupon.MinimumAmount) {
      return res.status(400).json({
        success: false,
        message: `Bu kupon için minimum sipariş tutarı ${coupon.MinimumAmount.toFixed(2)} ₺`,
      });
    }

    // İndirim hesaplama
    let discountAmount = 0;
    if (coupon.DiscountType === 'percentage') {
      discountAmount = (subtotal * coupon.DiscountValue) / 100;
      
      // Maksimum indirim kontrolü
      if (coupon.MaxDiscount !== null && discountAmount > coupon.MaxDiscount) {
        discountAmount = coupon.MaxDiscount;
      }
    } else {
      // Fixed indirim
      discountAmount = coupon.DiscountValue;
    }

    // İndirim tutarı ara toplamdan büyük olamaz
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    const finalAmount = subtotal - discountAmount;

    res.json({
      success: true,
      data: {
        couponId: coupon.Id,
        code: coupon.Code,
        description: coupon.Description,
        discountType: coupon.DiscountType,
        discountValue: coupon.DiscountValue,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
      },
      message: 'Kupon başarıyla uygulandı',
    });
  } catch (error) {
    console.error('Kupon doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kupon doğrulanırken bir hata oluştu',
    });
  }
});

export default router;

