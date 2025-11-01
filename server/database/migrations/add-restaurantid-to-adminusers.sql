-- AdminUsers tablosuna RestaurantId kolonu ekle
-- Bu migration ile restoran bazlı kullanıcı yönetimi sağlanır

-- 1. RestaurantId kolonunu ekle (nullable - sistem admin'leri için NULL olabilir)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'AdminUsers') AND name = 'RestaurantId')
BEGIN
    ALTER TABLE AdminUsers ADD RestaurantId INT NULL;
    PRINT '✅ AdminUsers.RestaurantId kolonu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️  AdminUsers.RestaurantId kolonu zaten mevcut';
END

-- 2. Foreign key constraint ekle
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_AdminUsers_Restaurants')
BEGIN
    ALTER TABLE AdminUsers
    ADD CONSTRAINT FK_AdminUsers_Restaurants
    FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id);
    PRINT '✅ Foreign key eklendi: FK_AdminUsers_Restaurants';
END
ELSE
BEGIN
    PRINT 'ℹ️  Foreign key FK_AdminUsers_Restaurants zaten mevcut';
END

-- 3. Index ekle (performans için)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AdminUsers_RestaurantId' AND object_id = OBJECT_ID('AdminUsers'))
BEGIN
    CREATE INDEX IX_AdminUsers_RestaurantId ON AdminUsers(RestaurantId);
    PRINT '✅ Index eklendi: IX_AdminUsers_RestaurantId';
END
ELSE
BEGIN
    PRINT 'ℹ️  Index IX_AdminUsers_RestaurantId zaten mevcut';
END

GO

PRINT '🎉 Migration tamamlandı: AdminUsers.RestaurantId hazır';

