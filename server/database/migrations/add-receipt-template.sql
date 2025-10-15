-- Fiş template sistemi için veritabanı güncellemeleri

-- Restaurants tablosuna ReceiptTemplate kolonu ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'ReceiptTemplate')
BEGIN
    ALTER TABLE Restaurants ADD ReceiptTemplate NVARCHAR(MAX) NULL;
    PRINT '✅ Restaurants.ReceiptTemplate kolonu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️  Restaurants.ReceiptTemplate kolonu zaten mevcut';
END
GO

-- Varsayılan template'leri ayarla
UPDATE Restaurants
SET ReceiptTemplate = N'{
  "showLogo": false,
  "logoUrl": null,
  "fontSize": {
    "title": 12,
    "normal": 8,
    "bold": 9,
    "small": 7
  },
  "showQRCode": false,
  "qrCodeType": "orderNumber",
  "showBarcode": false,
  "barcodeType": "orderNumber",
  "headerText": [],
  "footerText": [
    "AFİYET OLSUN!",
    "www.lilagusto.com"
  ],
  "showCustomerAddress": true,
  "showCustomerPhone": true,
  "showNotes": true,
  "showItemPrices": true,
  "showDiscount": true,
  "paperWidth": 75,
  "lineSpacing": 12,
  "margins": {
    "left": 5,
    "right": 5,
    "top": 5,
    "bottom": 30
  },
  "contactInfo": {
    "phone": null,
    "website": "www.lilagusto.com",
    "instagram": null,
    "address": null
  }
}'
WHERE ReceiptTemplate IS NULL;

PRINT '✅ Varsayılan template''ler ayarlandı';
GO

SELECT 'Receipt Template Migration Completed!' as Status;
GO

