-- TotalSpent ve LastOrderDate kolonlarını ekle

-- 1. TotalSpent - Toplam harcama
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'TotalSpent')
BEGIN
    ALTER TABLE Customers
    ADD TotalSpent DECIMAL(18,2) NOT NULL DEFAULT 0
    
    PRINT 'TotalSpent eklendi'
END
ELSE
BEGIN
    PRINT 'TotalSpent zaten var'
END
GO

-- 2. LastOrderDate - Son sipariş tarihi
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'LastOrderDate')
BEGIN
    ALTER TABLE Customers
    ADD LastOrderDate DATETIME NULL
    
    PRINT 'LastOrderDate eklendi'
END
ELSE
BEGIN
    PRINT 'LastOrderDate zaten var'
END
GO

-- 3. TotalSpent'i hesapla (mevcut siparişlerden)
UPDATE c
SET c.TotalSpent = ISNULL((
    SELECT SUM(o.TotalAmount)
    FROM Orders o
    WHERE o.CustomerId = c.Id AND o.Status IN ('Completed', 'Delivered')
), 0)
FROM Customers c

PRINT 'TotalSpent hesaplandı'
GO

-- 4. LastOrderDate'i doldur (mevcut siparişlerden)
UPDATE c
SET c.LastOrderDate = (
    SELECT MAX(o.CreatedAt)
    FROM Orders o
    WHERE o.CustomerId = c.Id
)
FROM Customers c

PRINT 'LastOrderDate dolduruldu'
GO

-- 5. Index ekle
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Customers_LastOrderDate' AND object_id = OBJECT_ID('Customers'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Customers_LastOrderDate ON Customers(LastOrderDate)
    PRINT 'IX_Customers_LastOrderDate index eklendi'
END
GO

PRINT '✅ Toplam harcama ve son sipariş takibi eklendi!'
GO

