import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Tüm kuponları listele
router.get('/', adminAuth, async (req, res) => {
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
        UsageLimit,
        UsedCount,
        ValidFrom,
        ValidUntil,
        IsActive,
        DisplayTitle,
        DisplaySubtitle,
        BgColor,
        IconType,
        CreatedAt,
        UpdatedAt
      FROM Coupons
      ORDER BY CreatedAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error('Kuponlar yüklenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kuponlar yüklenirken bir hata oluştu',
    });
  }
});

// Aktif kuponları listele (public endpoint)
router.get('/active', async (req, res) => {
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
    console.error('Aktif kuponlar yüklenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Aktif kuponlar yüklenirken bir hata oluştu',
    });
  }
});

// Tekil kupon getir
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM Coupons WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Kupon yüklenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kupon yüklenirken bir hata oluştu',
    });
  }
});

// Yeni kupon oluştur
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumAmount,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
      displayTitle,
      displaySubtitle,
      bgColor,
      iconType,
    } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({
        success: false,
        message: 'Kod, indirim tipi ve değeri zorunludur',
      });
    }

    const pool = await getConnection();

    // Kod tekrar kontrolü
    const existingCoupon = await pool
      .request()
      .input('code', sql.NVarChar, code.trim().toUpperCase())
      .query(`SELECT Id FROM Coupons WHERE Code = @code`);

    if (existingCoupon.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon kodu zaten kullanımda',
      });
    }

    const result = await pool
      .request()
      .input('code', sql.NVarChar, code.trim().toUpperCase())
      .input('description', sql.NVarChar, description || null)
      .input('discountType', sql.NVarChar, discountType)
      .input('discountValue', sql.Decimal(10, 2), discountValue)
      .input('minimumAmount', sql.Decimal(10, 2), minimumAmount || 0)
      .input('maxDiscount', sql.Decimal(10, 2), maxDiscount || null)
      .input('usageLimit', sql.Int, usageLimit || null)
      .input('validFrom', sql.DateTime, validFrom || null)
      .input('validUntil', sql.DateTime, validUntil || null)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
      .input('displayTitle', sql.NVarChar, displayTitle || null)
      .input('displaySubtitle', sql.NVarChar, displaySubtitle || null)
      .input('bgColor', sql.NVarChar, bgColor || 'purple')
      .input('iconType', sql.NVarChar, iconType || 'gift')
      .query(`
        INSERT INTO Coupons (
          Code, Description, DiscountType, DiscountValue,
          MinimumAmount, MaxDiscount, UsageLimit,
          ValidFrom, ValidUntil, IsActive,
          DisplayTitle, DisplaySubtitle, BgColor, IconType
        )
        OUTPUT INSERTED.*
        VALUES (
          @code, @description, @discountType, @discountValue,
          @minimumAmount, @maxDiscount, @usageLimit,
          @validFrom, @validUntil, @isActive,
          @displayTitle, @displaySubtitle, @bgColor, @iconType
        )
      `);

    res.status(201).json({
      success: true,
      data: result.recordset[0],
      message: 'Kupon başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Kupon oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kupon oluşturulurken bir hata oluştu',
    });
  }
});

// Kupon güncelle
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumAmount,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
      displayTitle,
      displaySubtitle,
      bgColor,
      iconType,
    } = req.body;

    const pool = await getConnection();

    // Kupon var mı kontrol et
    const existing = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT Id FROM Coupons WHERE Id = @id`);

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı',
      });
    }

    // Kod tekrarı kontrolü (kendi ID'si hariç)
    if (code) {
      const duplicateCheck = await pool
        .request()
        .input('code', sql.NVarChar, code.trim().toUpperCase())
        .input('id', sql.Int, id)
        .query(`SELECT Id FROM Coupons WHERE Code = @code AND Id != @id`);

      if (duplicateCheck.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu kupon kodu başka bir kupon tarafından kullanılıyor',
        });
      }
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('code', sql.NVarChar, code ? code.trim().toUpperCase() : null)
      .input('description', sql.NVarChar, description || null)
      .input('discountType', sql.NVarChar, discountType)
      .input('discountValue', sql.Decimal(10, 2), discountValue)
      .input('minimumAmount', sql.Decimal(10, 2), minimumAmount || 0)
      .input('maxDiscount', sql.Decimal(10, 2), maxDiscount || null)
      .input('usageLimit', sql.Int, usageLimit || null)
      .input('validFrom', sql.DateTime, validFrom || null)
      .input('validUntil', sql.DateTime, validUntil || null)
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
      .input('displayTitle', sql.NVarChar, displayTitle || null)
      .input('displaySubtitle', sql.NVarChar, displaySubtitle || null)
      .input('bgColor', sql.NVarChar, bgColor || null)
      .input('iconType', sql.NVarChar, iconType || null)
      .query(`
        UPDATE Coupons
        SET
          Code = ISNULL(@code, Code),
          Description = @description,
          DiscountType = @discountType,
          DiscountValue = @discountValue,
          MinimumAmount = @minimumAmount,
          MaxDiscount = @maxDiscount,
          UsageLimit = @usageLimit,
          ValidFrom = @validFrom,
          ValidUntil = @validUntil,
          IsActive = @isActive,
          DisplayTitle = ISNULL(@displayTitle, DisplayTitle),
          DisplaySubtitle = ISNULL(@displaySubtitle, DisplaySubtitle),
          BgColor = ISNULL(@bgColor, BgColor),
          IconType = ISNULL(@iconType, IconType),
          UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Kupon başarıyla güncellendi',
    });
  } catch (error) {
    console.error('Kupon güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kupon güncellenirken bir hata oluştu',
    });
  }
});

// Kupon sil
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Kupon kullanımda mı kontrol et
    const usageCheck = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT COUNT(*) as count FROM CouponUsage WHERE CouponId = @id`);

    if (usageCheck.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon daha önce kullanıldığı için silinemez. Pasif hale getirebilirsiniz.',
      });
    }

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM Coupons WHERE Id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Kupon başarıyla silindi',
    });
  } catch (error) {
    console.error('Kupon silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kupon silinirken bir hata oluştu',
    });
  }
});

// Kupon istatistikleri
router.get('/:id/stats', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          c.Id,
          c.Code,
          c.UsedCount,
          c.UsageLimit,
          COUNT(cu.Id) as TotalUsages,
          ISNULL(SUM(cu.DiscountAmount), 0) as TotalDiscount,
          COUNT(DISTINCT cu.CustomerId) as UniqueCustomers
        FROM Coupons c
        LEFT JOIN CouponUsage cu ON c.Id = cu.CouponId
        WHERE c.Id = @id
        GROUP BY c.Id, c.Code, c.UsedCount, c.UsageLimit
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Kupon istatistikleri yüklenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kupon istatistikleri yüklenirken bir hata oluştu',
    });
  }
});

export default router;

