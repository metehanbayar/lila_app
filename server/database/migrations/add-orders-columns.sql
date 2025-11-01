-- Orders tablosuna eksik sütunları ekle
-- Bu migration'u SQL Server'da çalıştırın

-- SubTotal sütunu (ara toplam)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'SubTotal')
BEGIN
    ALTER TABLE Orders ADD SubTotal DECIMAL(10,2) NULL;
    PRINT 'SubTotal sütunu eklendi.';
END
ELSE
    PRINT 'SubTotal sütunu zaten var.';
GO

-- DiscountAmount sütunu (indirim tutarı)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'DiscountAmount')
BEGIN
    ALTER TABLE Orders ADD DiscountAmount DECIMAL(10,2) DEFAULT 0;
    PRINT 'DiscountAmount sütunu eklendi.';
END
ELSE
    PRINT 'DiscountAmount sütunu zaten var.';
GO

-- CustomerId sütunu (müşteri ID)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'CustomerId')
BEGIN
    ALTER TABLE Orders ADD CustomerId INT NULL;
    PRINT 'CustomerId sütunu eklendi.';
END
ELSE
    PRINT 'CustomerId sütunu zaten var.';
GO

-- CouponId sütunu (kupon ID)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'CouponId')
BEGIN
    ALTER TABLE Orders ADD CouponId INT NULL;
    PRINT 'CouponId sütunu eklendi.';
END
ELSE
    PRINT 'CouponId sütunu zaten var.';
GO

-- CouponCode sütunu (kupon kodu)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'CouponCode')
BEGIN
    ALTER TABLE Orders ADD CouponCode NVARCHAR(50) NULL;
    PRINT 'CouponCode sütunu eklendi.';
END
ELSE
    PRINT 'CouponCode sütunu zaten var.';
GO

-- OrderItems tablosuna varyant desteği
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'OrderItems') AND name = 'VariantId')
BEGIN
    ALTER TABLE OrderItems ADD 
        VariantId INT NULL,
        VariantName NVARCHAR(100) NULL;
    PRINT 'OrderItems tablosuna VariantId ve VariantName sütunları eklendi.';
END
ELSE
    PRINT 'OrderItems tablosunda VariantId ve VariantName sütunları zaten var.';
GO

-- OrderItems tablosuna RestaurantId ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'OrderItems') AND name = 'RestaurantId')
BEGIN
    ALTER TABLE OrderItems ADD RestaurantId INT NULL;
    PRINT 'OrderItems tablosuna RestaurantId sütunu eklendi.';
END
ELSE
    PRINT 'OrderItems tablosunda RestaurantId sütunu zaten var.';
GO

PRINT 'Migration tamamlandı!';
GO

