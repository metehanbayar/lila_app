-- Gereksiz sütunları kaldır
-- 1. FullName - Artık FirstName ve LastName kullanılıyor
-- 2. Address - Artık CustomerAddresses tablosu kullanılıyor  
-- 3. Password - OTP sistemi kullanıldığı için gereksiz
-- 4. EmailVerified - Phone unique olduğu için gereksiz
-- 5. PhoneVerified - Her zaman 1, gereksiz

PRINT 'Gereksiz sütunlar temizleniyor...'
GO

-- 1. FullName sütununu kaldır
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'FullName')
BEGIN
    ALTER TABLE Customers
    DROP COLUMN FullName
    
    PRINT 'FullName sütunu kaldırıldı'
END
ELSE
BEGIN
    PRINT 'FullName sütunu zaten yok'
END
GO

-- 2. Address sütununu kaldır (CustomerAddresses tablosu kullanılıyor)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'Address')
BEGIN
    ALTER TABLE Customers
    DROP COLUMN Address
    
    PRINT 'Address sütunu kaldırıldı'
END
ELSE
BEGIN
    PRINT 'Address sütunu zaten yok'
END
GO

-- 3. Password sütununu kaldır (OTP sistemi kullanılıyor)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'Password')
BEGIN
    ALTER TABLE Customers
    DROP COLUMN Password
    
    PRINT 'Password sütunu kaldırıldı'
END
ELSE
BEGIN
    PRINT 'Password sütunu zaten yok'
END
GO

-- 4. EmailVerified sütununu kaldır (önce default constraint'i kaldır)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'EmailVerified')
BEGIN
    -- Default constraint'ini bul ve kaldır
    DECLARE @df_email_verified NVARCHAR(MAX)
    SELECT TOP 1 @df_email_verified = name
    FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID('Customers')
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'EmailVerified')
    
    IF @df_email_verified IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Customers DROP CONSTRAINT ' + @df_email_verified)
        PRINT 'EmailVerified default constraint kaldırıldı: ' + @df_email_verified
    END
    
    ALTER TABLE Customers DROP COLUMN EmailVerified
    PRINT 'EmailVerified sütunu kaldırıldı'
END
ELSE
BEGIN
    PRINT 'EmailVerified sütunu zaten yok'
END
GO

-- 5. PhoneVerified sütununu kaldır (önce default constraint'i kaldır)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'PhoneVerified')
BEGIN
    -- Default constraint'ini bul ve kaldır
    DECLARE @df_phone_verified NVARCHAR(MAX)
    SELECT TOP 1 @df_phone_verified = name
    FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID('Customers')
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'PhoneVerified')
    
    IF @df_phone_verified IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Customers DROP CONSTRAINT ' + @df_phone_verified)
        PRINT 'PhoneVerified default constraint kaldırıldı: ' + @df_phone_verified
    END
    
    ALTER TABLE Customers DROP COLUMN PhoneVerified
    PRINT 'PhoneVerified sütunu kaldırıldı'
END
ELSE
BEGIN
    PRINT 'PhoneVerified sütunu zaten yok'
END
GO

-- 6. FullNameComputed computed column'u kaldır
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'FullNameComputed')
BEGIN
    ALTER TABLE Customers
    DROP COLUMN FullNameComputed
    
    PRINT 'FullNameComputed computed column kaldırıldı'
END
ELSE
BEGIN
    PRINT 'FullNameComputed zaten yok'
END
GO

-- 7. Email index'ini kaldır (Email artık optional ve unique değil)
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_Email' AND object_id = OBJECT_ID('Customers'))
BEGIN
    DROP INDEX IX_Customers_Email ON Customers
    PRINT 'IX_Customers_Email index kaldırıldı'
END
GO

PRINT ''
PRINT '✅ Temizlik tamamlandı!'
PRINT ''
PRINT 'Customers tablosu artık şu şekilde:'
PRINT '  - Id (PK)'
PRINT '  - Email (Nullable)'
PRINT '  - FirstName'
PRINT '  - LastName'
PRINT '  - Phone (Unique, NOT NULL)'
PRINT '  - IsActive'
PRINT '  - CreatedAt'
PRINT '  - LastLogin'
GO

