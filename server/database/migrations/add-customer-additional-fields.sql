-- Customers tablosuna yeni kolonlar ekle
-- 1. DateOfBirth - Doğum tarihi (kampanya/yaş aralığı)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'DateOfBirth')
BEGIN
    ALTER TABLE Customers
    ADD DateOfBirth DATE NULL
    
    PRINT 'DateOfBirth eklendi'
END
GO

-- 2. Gender - Cinsiyet (analiz için)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'Gender')
BEGIN
    ALTER TABLE Customers
    ADD Gender NVARCHAR(10) NULL -- 'Male', 'Female', 'Other'
    
    PRINT 'Gender eklendi'
END
GO

-- 3. DeviceToken - Push bildirim token
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'DeviceToken')
BEGIN
    ALTER TABLE Customers
    ADD DeviceToken NVARCHAR(500) NULL
    
    PRINT 'DeviceToken eklendi'
END
GO

-- 4. NotificationEnabled - Bildirim onayı
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'NotificationEnabled')
BEGIN
    ALTER TABLE Customers
    ADD NotificationEnabled BIT NOT NULL DEFAULT 1
    
    PRINT 'NotificationEnabled eklendi (varsayılan: 1)'
END
GO

-- 5. SmsEnabled - SMS onayı
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'SmsEnabled')
BEGIN
    ALTER TABLE Customers
    ADD SmsEnabled BIT NOT NULL DEFAULT 1
    
    PRINT 'SmsEnabled eklendi (varsayılan: 1)'
END
GO

-- 6. TotalSpent - Toplam harcama
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'TotalSpent')
BEGIN
    ALTER TABLE Customers
    ADD TotalSpent DECIMAL(18,2) NOT NULL DEFAULT 0
    
    -- Mevcut siparişlerden toplam harcamayı hesapla
    UPDATE c
    SET c.TotalSpent = (
        SELECT ISNULL(SUM(o.TotalAmount), 0)
        FROM Orders o
        WHERE o.CustomerId = c.Id AND o.Status IN ('Completed', 'Delivered')
    )
    FROM Customers c
    
    PRINT 'TotalSpent eklendi ve hesaplandı'
END
GO

-- 7. LastOrderDate - Son sipariş tarihi
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'LastOrderDate')
BEGIN
    ALTER TABLE Customers
    ADD LastOrderDate DATETIME NULL
    
    PRINT 'LastOrderDate eklendi'
END
GO

-- 8. UpdatedAt - En son güncelleme zamanı
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'UpdatedAt')
BEGIN
    ALTER TABLE Customers
    ADD UpdatedAt DATETIME NULL
    
    -- Mevcut kayıtlar için CreatedAt'i UpdatedAt olarak ayarla
    UPDATE Customers SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL
    
    PRINT 'UpdatedAt eklendi'
END
GO

-- Mevcut siparişlerden son sipariş tarihini doldur
UPDATE c
SET c.LastOrderDate = (
    SELECT MAX(o.CreatedAt)
    FROM Orders o
    WHERE o.CustomerId = c.Id
)
FROM Customers c

PRINT 'Mevcut son sipariş tarihleri dolduruldu'
GO

-- İndeksler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_DateOfBirth' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_DateOfBirth ON Customers(DateOfBirth)
    PRINT 'IX_Customers_DateOfBirth index eklendi'
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_LastOrderDate' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_LastOrderDate ON Customers(LastOrderDate)
    PRINT 'IX_Customers_LastOrderDate index eklendi'
END
GO

PRINT '✅ Tüm yeni kolonlar eklendi!'
PRINT ''
PRINT 'Customers tablosu artık şunları içeriyor:'
PRINT '  - Id, Email, FirstName, LastName, Phone'
PRINT '  - IsActive, CreatedAt, LastLogin'
PRINT '  - DateOfBirth, Gender'
PRINT '  - DeviceToken'
PRINT '  - NotificationEnabled, SmsEnabled'
PRINT '  - TotalSpent'
PRINT '  - LastOrderDate'
GO

