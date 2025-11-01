-- Ad soyadı (FullName) iki ayrı kolona (FirstName, LastName) ayır

-- 1. Yeni kolonları ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'FirstName')
BEGIN
    ALTER TABLE Customers
    ADD FirstName NVARCHAR(50) NULL
    
    ALTER TABLE Customers
    ADD LastName NVARCHAR(50) NULL
    
    PRINT 'FirstName ve LastName kolonları eklendi'
END
GO

-- 2. Mevcut FullName verilerini böl
UPDATE Customers
SET 
    FirstName = CASE 
        WHEN CHARINDEX(' ', FullName) > 0 
        THEN LEFT(FullName, CHARINDEX(' ', FullName) - 1)
        ELSE FullName
    END,
    LastName = CASE 
        WHEN CHARINDEX(' ', FullName) > 0 
        THEN LTRIM(RIGHT(FullName, LEN(FullName) - CHARINDEX(' ', FullName)))
        ELSE ''
    END
WHERE FirstName IS NULL OR LastName IS NULL
GO

-- 3. FirstName ve LastName'i NOT NULL yap
ALTER TABLE Customers
ALTER COLUMN FirstName NVARCHAR(50) NOT NULL

ALTER TABLE Customers
ALTER COLUMN LastName NVARCHAR(50) NOT NULL

PRINT 'FirstName ve LastName NOT NULL yapıldı'
GO

-- 4. FullName kolonunu kaldır (isteğe bağlı - yorumdan çıkarın)
/*
-- Önce FullName'e bağlı constraint'leri kaldır
ALTER TABLE Customers
DROP COLUMN FullName

PRINT 'FullName kolonu kaldırıldı'
*/
GO

-- 5. Backend tarafı için FullName'i computed column olarak ekleyebiliriz
-- Bu sayede eski kodlar çalışmaya devam eder
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'FullNameComputed')
BEGIN
    ALTER TABLE Customers
    ADD FullNameComputed AS (FirstName + ' ' + LastName) PERSISTED
    
    PRINT 'FullNameComputed computed column eklendi'
END
GO

PRINT 'Migration tamamlandı!'
PRINT 'Artık FirstName ve LastName ayrı kolonlar'
GO

