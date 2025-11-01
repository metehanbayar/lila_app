-- UpdatedAt kolonunu ekle

-- 1. UpdatedAt kolonunu ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'UpdatedAt')
BEGIN
    ALTER TABLE Customers
    ADD UpdatedAt DATETIME NULL
    
    -- Mevcut kayıtlar için CreatedAt'i UpdatedAt olarak ayarla
    UPDATE Customers SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL
    
    PRINT 'UpdatedAt eklendi'
END
ELSE
BEGIN
    PRINT 'UpdatedAt zaten var'
END
GO

PRINT '✅ UpdatedAt kolonu hazır!'
PRINT 'Artık trigger çalışacak ve UpdatedAt otomatik güncellenecek'
GO

