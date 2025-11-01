-- TotalSpent ve LastOrderDate'in otomatik güncellenmesi için trigger'lar

-- 1. TotalSpent ve LastOrderDate güncelleme trigger'ı
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TRG_UpdateCustomerStats')
BEGIN
    DROP TRIGGER TRG_UpdateCustomerStats
END
GO

CREATE TRIGGER TRG_UpdateCustomerStats
ON Orders
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON
    
    -- Her güncellenen sipariş için müşteri istatistiklerini güncelle
    UPDATE c
    SET 
        c.TotalSpent = (
            SELECT ISNULL(SUM(o.TotalAmount), 0)
            FROM Orders o
            WHERE o.CustomerId = c.Id 
            AND o.Status IN ('Completed', 'Delivered')
        ),
        c.LastOrderDate = (
            SELECT MAX(o.CreatedAt)
            FROM Orders o
            WHERE o.CustomerId = c.Id
        )
    FROM Customers c
    INNER JOIN (
        SELECT DISTINCT CustomerId FROM inserted
    ) i ON c.Id = i.CustomerId
    
    -- UpdatedAt varsa güncelle
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'UpdatedAt')
    BEGIN
        UPDATE c
        SET c.UpdatedAt = GETDATE()
        FROM Customers c
        INNER JOIN (
            SELECT DISTINCT CustomerId FROM inserted
        ) i ON c.Id = i.CustomerId
    END
END
GO

-- 2. Deleted için de (sipariş silinirse)
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TRG_UpdateCustomerStatsOnDelete')
BEGIN
    DROP TRIGGER TRG_UpdateCustomerStatsOnDelete
END
GO

CREATE TRIGGER TRG_UpdateCustomerStatsOnDelete
ON Orders
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON
    
    -- Silinen siparişin müşterisi için istatistikleri güncelle
    UPDATE c
    SET 
        c.TotalSpent = (
            SELECT ISNULL(SUM(o.TotalAmount), 0)
            FROM Orders o
            WHERE o.CustomerId = c.Id 
            AND o.Status IN ('Completed', 'Delivered')
        ),
        c.LastOrderDate = (
            SELECT MAX(o.CreatedAt)
            FROM Orders o
            WHERE o.CustomerId = c.Id
        )
    FROM Customers c
    INNER JOIN (
        SELECT DISTINCT CustomerId FROM deleted
    ) d ON c.Id = d.CustomerId
    
    -- UpdatedAt varsa güncelle
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Customers') AND name = 'UpdatedAt')
    BEGIN
        UPDATE c
        SET c.UpdatedAt = GETDATE()
        FROM Customers c
        INNER JOIN (
            SELECT DISTINCT CustomerId FROM deleted
        ) d ON c.Id = d.CustomerId
    END
END
GO

-- 3. Mevcut verileri doldur (ilk çalıştırmada)
UPDATE c
SET 
    c.TotalSpent = ISNULL((
        SELECT SUM(o.TotalAmount)
        FROM Orders o
        WHERE o.CustomerId = c.Id AND o.Status IN ('Completed', 'Delivered')
    ), 0),
    c.LastOrderDate = (
        SELECT MAX(o.CreatedAt)
        FROM Orders o
        WHERE o.CustomerId = c.Id
    )
FROM Customers c

PRINT '✅ Trigger'lar oluşturuldu ve veriler dolduruldu!'
PRINT ''
PRINT 'Artık:'
PRINT '- Yeni sipariş geldiğinde TotalSpent otomatik güncellenecek'
PRINT '- Sipariş tamamlandığında TotalSpent artacak'
PRINT '- Son sipariş tarihi LastOrderDate otomatik güncellenecek'
GO

