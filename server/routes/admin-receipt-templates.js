import express from 'express';
import { getConnection, sql } from '../config/database.js';
import { adminAuth } from './admin.js';

const router = express.Router();

// Restoran için fiş template'ini getir
router.get('/restaurants/:id/receipt-template', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT Id, Name, ReceiptTemplate
        FROM Restaurants
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı',
      });
    }

    const restaurant = result.recordset[0];
    let template = null;

    if (restaurant.ReceiptTemplate) {
      try {
        template = JSON.parse(restaurant.ReceiptTemplate);
      } catch (error) {
        console.error('Template parse hatası:', error);
      }
    }

    res.json({
      success: true,
      data: {
        restaurantId: restaurant.Id,
        restaurantName: restaurant.Name,
        template: template || getDefaultTemplate(),
      },
    });
  } catch (error) {
    console.error('Template getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Template yüklenirken bir hata oluştu',
    });
  }
});

// Restoran için fiş template'ini güncelle
router.put('/restaurants/:id/receipt-template', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Template verisi gerekli',
      });
    }

    const pool = await getConnection();

    // Template'i JSON string'e çevir
    const templateJson = JSON.stringify(template);

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('template', sql.NVarChar, templateJson)
      .query(`
        UPDATE Restaurants
        SET ReceiptTemplate = @template, UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restoran bulunamadı',
      });
    }

    res.json({
      success: true,
      message: 'Fiş template güncellendi',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Template güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Template güncellenirken bir hata oluştu',
    });
  }
});

// Varsayılan template döndür
function getDefaultTemplate() {
  return {
    showLogo: false,
    logoUrl: null,
    fontSize: {
      title: 12,
      normal: 8,
      bold: 9,
      small: 7,
    },
    showQRCode: false,
    qrCodeType: 'orderNumber',
    showBarcode: false,
    barcodeType: 'orderNumber',
    headerText: [],
    footerText: ['AFİYET OLSUN!', 'www.lilagusto.com'],
    showCustomerAddress: true,
    showCustomerPhone: true,
    showNotes: true,
    showItemPrices: true,
    showDiscount: true,
    paperWidth: 75,
    lineSpacing: 12,
    margins: {
      left: 5,
      right: 5,
      top: 5,
      bottom: 30,
    },
    contactInfo: {
      phone: null,
      website: 'www.lilagusto.com',
      instagram: null,
      address: null,
    },
  };
}

export default router;

