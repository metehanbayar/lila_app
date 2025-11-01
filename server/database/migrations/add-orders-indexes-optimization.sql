-- Orders tablosu için performans optimizasyonu indeksleri
-- VerifyEnrollmentRequestId, GroupId, PaymentStatus ve CreatedAt DESC için indeksler

-- 1. VerifyEnrollmentRequestId için nonclustered index
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_VerifyEnrollmentRequestId' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Orders_VerifyEnrollmentRequestId 
    ON Orders(VerifyEnrollmentRequestId)
    WHERE VerifyEnrollmentRequestId IS NOT NULL;
    PRINT 'IX_Orders_VerifyEnrollmentRequestId indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_VerifyEnrollmentRequestId indeksi zaten var.';
GO

-- 2. GroupId için nonclustered index (varsa güncelle, yoksa oluştur)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_GroupId' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Orders_GroupId 
    ON Orders(GroupId)
    WHERE GroupId IS NOT NULL;
    PRINT 'IX_Orders_GroupId indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_GroupId indeksi zaten var.';
GO

-- 3. PaymentStatus için nonclustered index (varsa güncelle, yoksa oluştur)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_PaymentStatus' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Orders_PaymentStatus 
    ON Orders(PaymentStatus);
    PRINT 'IX_Orders_PaymentStatus indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_PaymentStatus indeksi zaten var.';
GO

-- 4. CreatedAt DESC için optimized index (INCLUDE ile sık kullanılan alanlar)
-- Bu index ORDER BY CreatedAt DESC sorguları için cover index görevi görür
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_CreatedAt_Desc' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Orders_CreatedAt_Desc 
    ON Orders(CreatedAt DESC)
    INCLUDE (OrderNumber, CustomerName, CustomerPhone, CustomerAddress, Notes, TotalAmount, Status, PaymentStatus, UpdatedAt);
    PRINT 'IX_Orders_CreatedAt_Desc indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_CreatedAt_Desc indeksi zaten var.';
GO

-- 5. VerifyEnrollmentRequestId + PaymentStatus composite index (callback sorguları için)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_VerifyEnrollment_PaymentStatus' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Orders_VerifyEnrollment_PaymentStatus 
    ON Orders(VerifyEnrollmentRequestId, PaymentStatus)
    INCLUDE (Id, TotalAmount, PaymentResponse, CreatedAt)
    WHERE VerifyEnrollmentRequestId IS NOT NULL;
    PRINT 'IX_Orders_VerifyEnrollment_PaymentStatus indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_VerifyEnrollment_PaymentStatus indeksi zaten var.';
GO

-- 6. PaymentStatus + CreatedAt DESC composite index (mutfak kuyruğu için)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_PaymentStatus_CreatedAt' AND object_id = OBJECT_ID(N'Orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Orders_PaymentStatus_CreatedAt 
    ON Orders(PaymentStatus, CreatedAt DESC)
    INCLUDE (Id, OrderNumber, CustomerName, CustomerPhone, CustomerAddress, Notes, TotalAmount, Status, UpdatedAt);
    PRINT 'IX_Orders_PaymentStatus_CreatedAt indeksi eklendi.';
END
ELSE
    PRINT 'IX_Orders_PaymentStatus_CreatedAt indeksi zaten var.';
GO

PRINT '✅ Orders tablosu indeks optimizasyonu tamamlandı!';

