-- Orders tablosuna ödeme (Payment) kolonlarını ekle
-- Bu migration'u SQL Server'da çalıştırın

-- PaymentStatus sütunu (ödeme durumu)
-- Değerler: 'Pending', 'Paid', 'Failed', 'Cancelled', 'Refunded'
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'PaymentStatus')
BEGIN
    ALTER TABLE Orders ADD PaymentStatus NVARCHAR(50) DEFAULT 'Pending';
    PRINT 'PaymentStatus sütunu eklendi.';
END
ELSE
    PRINT 'PaymentStatus sütunu zaten var.';
GO

-- PaymentMethod sütunu (ödeme yöntemi: 'credit_card', 'bank_transfer', vb.)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'PaymentMethod')
BEGIN
    ALTER TABLE Orders ADD PaymentMethod NVARCHAR(50) NULL;
    PRINT 'PaymentMethod sütunu eklendi.';
END
ELSE
    PRINT 'PaymentMethod sütunu zaten var.';
GO

-- PaymentTransactionId sütunu (banka tarafından dönen işlem numarası)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'PaymentTransactionId')
BEGIN
    ALTER TABLE Orders ADD PaymentTransactionId NVARCHAR(100) NULL;
    PRINT 'PaymentTransactionId sütunu eklendi.';
END
ELSE
    PRINT 'PaymentTransactionId sütunu zaten var.';
GO

-- PaymentResponse sütunu (bankadan dönen tam response - JSON formatında saklamak için)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'PaymentResponse')
BEGIN
    ALTER TABLE Orders ADD PaymentResponse NVARCHAR(MAX) NULL;
    PRINT 'PaymentResponse sütunu eklendi.';
END
ELSE
    PRINT 'PaymentResponse sütunu zaten var.';
GO

-- PaidAt sütunu (ödeme yapıldığı zaman)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'PaidAt')
BEGIN
    ALTER TABLE Orders ADD PaidAt DATETIME NULL;
    PRINT 'PaidAt sütunu eklendi.';
END
ELSE
    PRINT 'PaidAt sütunu zaten var.';
GO

-- PaymentError sütunu (ödeme hatası mesajı)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'PaymentError')
BEGIN
    ALTER TABLE Orders ADD PaymentError NVARCHAR(500) NULL;
    PRINT 'PaymentError sütunu eklendi.';
END
ELSE
    PRINT 'PaymentError sütunu zaten var.';
GO

-- İndeks ekle (sorgu performansı için)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_PaymentStatus' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE INDEX IX_Orders_PaymentStatus ON Orders(PaymentStatus);
    PRINT 'IX_Orders_PaymentStatus indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_PaymentStatus indeksi zaten var.';
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_PaymentTransactionId' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE INDEX IX_Orders_PaymentTransactionId ON Orders(PaymentTransactionId);
    PRINT 'IX_Orders_PaymentTransactionId indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_PaymentTransactionId indeksi zaten var.';
GO

PRINT 'Ödeme kolonları migration tamamlandı!';
GO

