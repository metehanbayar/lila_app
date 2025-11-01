-- Referral Code sistemi ekle
-- Müşteriler arkadaş davet edebilir

-- 1. ReferralCode kolonunu ekle (her müşterinin benzersiz kodu)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'ReferralCode')
BEGIN
    ALTER TABLE Customers
    ADD ReferralCode NVARCHAR(20) NULL
    
    PRINT 'ReferralCode eklendi'
END
GO

-- 2. ReferredBy kolonunu ekle (kim davet etti)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'ReferredBy')
BEGIN
    ALTER TABLE Customers
    ADD ReferredBy INT NULL
    
    -- Foreign key ekle
    ALTER TABLE Customers
    ADD CONSTRAINT FK_Customers_ReferredBy 
    FOREIGN KEY (ReferredBy) REFERENCES Customers(Id)
    
    PRINT 'ReferredBy eklendi'
END
GO

-- 3. Mevcut müşteriler için unique referral code oluştur
DECLARE @code NVARCHAR(20)

UPDATE c
SET ReferralCode = 'REF' + RIGHT('000000' + CAST(c.Id AS VARCHAR), 6)
FROM Customers c
WHERE ReferralCode IS NULL

PRINT 'Mevcut müşteriler için referral code oluşturuldu'
GO

-- 4. ReferralCode için UNIQUE constraint ekle
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Customers_ReferralCode' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE UNIQUE INDEX UQ_Customers_ReferralCode ON Customers(ReferralCode)
    WHERE ReferralCode IS NOT NULL
    
    PRINT 'ReferralCode UNIQUE constraint eklendi'
END
GO

-- 5. Index'ler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_ReferralCode' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_ReferralCode ON Customers(ReferralCode)
    PRINT 'IX_Customers_ReferralCode index eklendi'
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_ReferredBy' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_ReferredBy ON Customers(ReferredBy)
    PRINT 'IX_Customers_ReferredBy index eklendi'
END
GO

PRINT '✅ Referral sistemi eklendi!'
PRINT ''
PRINT 'Özellikler:'
PRINT '- Her müşterinin kendine özel REF000001 gibi bir kodu var'
PRINT '- Yeni kayıtta referral code girebilir'
PRINT '- Kim kaç kişi davet etti takip edilebilir'
GO

