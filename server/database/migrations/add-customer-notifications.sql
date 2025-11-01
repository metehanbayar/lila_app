-- NotificationEnabled ve SmsEnabled kolonlarını ekle
-- (Eğer önceki migration'da eklenmediyse)

-- 1. NotificationEnabled - Bildirim onayı
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'NotificationEnabled')
BEGIN
    ALTER TABLE Customers
    ADD NotificationEnabled BIT NOT NULL DEFAULT 1
    
    PRINT 'NotificationEnabled eklendi (varsayılan: 1)'
END
ELSE
BEGIN
    PRINT 'NotificationEnabled zaten var'
END
GO

-- 2. SmsEnabled - SMS onayı
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'SmsEnabled')
BEGIN
    ALTER TABLE Customers
    ADD SmsEnabled BIT NOT NULL DEFAULT 1
    
    PRINT 'SmsEnabled eklendi (varsayılan: 1)'
END
ELSE
BEGIN
    PRINT 'SmsEnabled zaten var'
END
GO

-- 3. TotalSpent'i güncelle (eğer NULL veya 0 ise)
UPDATE c
SET c.TotalSpent = (
    SELECT ISNULL(SUM(o.TotalAmount), 0)
    FROM Orders o
    WHERE o.CustomerId = c.Id AND o.Status IN ('Completed', 'Delivered')
)
FROM Customers c
WHERE c.TotalSpent IS NULL OR c.TotalSpent = 0

PRINT 'TotalSpent güncellendi'
GO

-- 4. LastOrderDate'i güncelle (eğer NULL ise)
UPDATE c
SET c.LastOrderDate = (
    SELECT MAX(o.CreatedAt)
    FROM Orders o
    WHERE o.CustomerId = c.Id
)
FROM Customers c
WHERE c.LastOrderDate IS NULL

PRINT 'LastOrderDate güncellendi'
GO

PRINT '✅ Bildirim kolonları kontrol edildi!'
GO

