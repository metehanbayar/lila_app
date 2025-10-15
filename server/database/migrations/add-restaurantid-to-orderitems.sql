-- OrderItems tablosuna RestaurantId kolonu ekle
-- Bu kolon, her sipariş kaleminin hangi restorana ait olduğunu gösterir

-- Kolon ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'OrderItems') AND name = 'RestaurantId')
BEGIN
    ALTER TABLE OrderItems 
    ADD RestaurantId INT NULL;
    
    PRINT '✅ OrderItems.RestaurantId kolonu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️  OrderItems.RestaurantId kolonu zaten mevcut';
END
GO

-- Mevcut verileri güncelle (NULL olanlar için)
-- Product tablosundan RestaurantId'yi al
UPDATE oi
SET oi.RestaurantId = p.RestaurantId
FROM OrderItems oi
INNER JOIN Products p ON oi.ProductId = p.Id
WHERE oi.RestaurantId IS NULL;

PRINT '✅ Mevcut OrderItems kayıtları güncellendi';
GO

-- Kolonu NOT NULL yap
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'OrderItems') AND name = 'RestaurantId' AND is_nullable = 1)
BEGIN
    ALTER TABLE OrderItems
    ALTER COLUMN RestaurantId INT NOT NULL;
    
    PRINT '✅ OrderItems.RestaurantId artık NOT NULL';
END
GO

-- Foreign key ekle
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_OrderItems_Restaurants')
BEGIN
    ALTER TABLE OrderItems
    ADD CONSTRAINT FK_OrderItems_Restaurants
    FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id);
    
    PRINT '✅ Foreign key eklendi: FK_OrderItems_Restaurants';
END
GO

-- Index ekle (performans için)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_OrderItems_RestaurantId')
BEGIN
    CREATE INDEX IX_OrderItems_RestaurantId ON OrderItems(RestaurantId);
    
    PRINT '✅ Index eklendi: IX_OrderItems_RestaurantId';
END
GO

PRINT '';
PRINT '═══════════════════════════════════════';
PRINT '✅ Migration tamamlandı!';
PRINT '   OrderItems.RestaurantId hazır';
PRINT '═══════════════════════════════════════';
GO

