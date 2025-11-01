-- UpdatedAt kolonunu ekle ve doldur

-- 1. UpdatedAt kolonunu ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'UpdatedAt')
BEGIN
    ALTER TABLE Customers
    ADD UpdatedAt DATETIME NULL
    
    PRINT 'UpdatedAt kolonu eklendi'
END
GO

-- 2. Mevcut kayıtlar için UpdatedAt'i doldur
UPDATE Customers 
SET UpdatedAt = CreatedAt 
WHERE UpdatedAt IS NULL
GO

PRINT '✅ UpdatedAt kolonu eklendi ve dolduruldu!'
PRINT ''
PRINT 'Artık:'
PRINT '- Profil güncellemesinde UpdatedAt otomatik güncellenecek'
PRINT '- Sipariş durumu değiştiğinde UpdatedAt otomatik güncellenecek'
GO

