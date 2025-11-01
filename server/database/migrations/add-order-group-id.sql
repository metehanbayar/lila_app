-- Orders tablosuna GroupId kolonu ekler
-- Çoklu restoran siparişlerinde aynı gruptaki siparişleri birlikte yönetmek için
-- Bu migration'u SQL Server'da çalıştırın

-- GroupId sütunu (aynı ödemedeki sipariş grubu)
-- NULL ise tek sipariş, değilse grup siparişi
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'GroupId')
BEGIN
    ALTER TABLE Orders ADD GroupId NVARCHAR(100) NULL;
    PRINT 'GroupId sütunu eklendi.';
END
ELSE
    PRINT 'GroupId sütunu zaten var.';
GO

-- İndeks ekle (sorgu performansı için)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_GroupId' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE INDEX IX_Orders_GroupId ON Orders(GroupId);
    PRINT 'IX_Orders_GroupId indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_GroupId indeksi zaten var.';
GO

PRINT '✅ OrderGroupId migration tamamlandı!';

