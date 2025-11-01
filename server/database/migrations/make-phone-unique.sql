-- Telefon numarasını unique yap
-- Telefon artık primary identifier olacak

-- 1. Email kolonuna bağlı index ve constraint'leri kaldır
-- Email index'ini kaldır (eğer varsa)
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email' AND object_id = OBJECT_ID('Customers'))
BEGIN
    DROP INDEX IX_Customers_Email ON Customers
    PRINT 'IX_Customers_Email index kaldırıldı'
END

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email_Unique' AND object_id = OBJECT_ID('Customers'))
BEGIN
    DROP INDEX IX_Customers_Email_Unique ON Customers
    PRINT 'IX_Customers_Email_Unique index kaldırıldı'
END

-- UNIQUE constraint'leri kaldır (Email ile ilgili)
DECLARE @constraint_name NVARCHAR(MAX)
DECLARE constraint_cursor CURSOR FOR
SELECT name FROM sys.key_constraints 
WHERE parent_object_id = OBJECT_ID('Customers')
AND type = 'UQ'

OPEN constraint_cursor
FETCH NEXT FROM constraint_cursor INTO @constraint_name

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @sql NVARCHAR(MAX) = 'ALTER TABLE Customers DROP CONSTRAINT [' + @constraint_name + ']'
    EXEC sp_executesql @sql
    PRINT 'Constraint kaldırıldı: ' + @constraint_name
    FETCH NEXT FROM constraint_cursor INTO @constraint_name
END

CLOSE constraint_cursor
DEALLOCATE constraint_cursor

-- Email kolonunu NULL olabilir yap
ALTER TABLE Customers
ALTER COLUMN Email NVARCHAR(100) NULL
PRINT 'Email kolonu NULL yapıldı'
GO

-- 2. Phone kolonunu NOT NULL yap
-- Önce NULL değerleri kontrol et
DECLARE @nullCount INT
SELECT @nullCount = COUNT(*) FROM Customers WHERE Phone IS NULL

IF @nullCount > 0
BEGIN
    PRINT 'UYARI: ' + CAST(@nullCount AS VARCHAR) + ' müşteri kaydında telefon numarası NULL. Bunları güncelleyin.'
    -- NULL telefonları otomatik doldur (test için)
    UPDATE Customers 
    SET Phone = '0000000000' + CAST(Id AS VARCHAR)
    WHERE Phone IS NULL
END

ALTER TABLE Customers
ALTER COLUMN Phone NVARCHAR(20) NOT NULL
GO

-- 3. Phone'a UNIQUE constraint ekle
-- Önce duplicate telefon kontrolü
DECLARE @duplicateCount INT
SELECT @duplicateCount = COUNT(*) 
FROM (
    SELECT Phone, COUNT(*) as cnt
    FROM Customers
    GROUP BY Phone
    HAVING COUNT(*) > 1
) AS duplicates

IF @duplicateCount > 0
BEGIN
    PRINT 'UYARI: ' + CAST(@duplicateCount AS VARCHAR) + ' duplicate telefon numarası bulundu. Lütfen düzeltin.'
    -- Duplicate telefonları düzelt
    UPDATE c1
    SET c1.Phone = c1.Phone + '_' + CAST(c1.Id AS VARCHAR)
    FROM Customers c1
    INNER JOIN (
        SELECT Phone, MIN(Id) as MinId
        FROM Customers
        GROUP BY Phone
        HAVING COUNT(*) > 1
    ) c2 ON c1.Phone = c2.Phone AND c1.Id != c2.MinId
END

-- UNIQUE constraint ekle
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Customers_Phone' AND object_id = OBJECT_ID('Customers'))
BEGIN
    ALTER TABLE Customers
    ADD CONSTRAINT UQ_Customers_Phone UNIQUE (Phone)
    PRINT 'Phone kolonu UNIQUE yapıldı'
END
GO

-- 4. PhoneVerified kolonunu ekle (eğer yoksa)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'PhoneVerified')
BEGIN
    ALTER TABLE Customers
    ADD PhoneVerified BIT DEFAULT 1
    PRINT 'PhoneVerified kolonu eklendi'
END
GO

-- 5. Mevcut kayıtlar için PhoneVerified = 1
UPDATE Customers 
SET PhoneVerified = 1 
WHERE PhoneVerified IS NULL
GO

-- 6. Index'leri güncelle
-- Email index'ini kaldır (eğer varsa)
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email' AND object_id = OBJECT_ID('Customers'))
BEGIN
    DROP INDEX IX_Customers_Email ON Customers
    PRINT 'Email index kaldırıldı'
END
GO

-- Phone index'ini oluştur (eğer yoksa)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Phone' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_Phone ON Customers(Phone)
    PRINT 'Phone index oluşturuldu'
END
GO

PRINT 'Migration tamamlandı!'
PRINT 'Telefon numarası artık UNIQUE ve primary identifier'
PRINT 'Email kolonu artık optional'
GO
