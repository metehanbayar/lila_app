-- Kupon Sistemi Migration

-- Kuponlar Tablosu
CREATE TABLE Coupons (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    DiscountType NVARCHAR(20) NOT NULL, -- 'percentage' veya 'fixed'
    DiscountValue DECIMAL(10,2) NOT NULL,
    MinimumAmount DECIMAL(10,2) DEFAULT 0,
    MaxDiscount DECIMAL(10,2) NULL, -- Maksimum indirim tutarı (sadece percentage için)
    UsageLimit INT NULL, -- NULL ise sınırsız
    UsedCount INT DEFAULT 0,
    ValidFrom DATETIME DEFAULT GETDATE(),
    ValidUntil DATETIME NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Kupon kullanım geçmişi tablosu
CREATE TABLE CouponUsage (
    Id INT PRIMARY KEY IDENTITY(1,1),
    CouponId INT NOT NULL,
    CustomerId INT NULL,
    OrderId INT NOT NULL,
    DiscountAmount DECIMAL(10,2) NOT NULL,
    UsedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CouponId) REFERENCES Coupons(Id),
    FOREIGN KEY (CustomerId) REFERENCES Customers(Id),
    FOREIGN KEY (OrderId) REFERENCES Orders(Id)
);

-- Orders tablosuna kupon bilgilerini ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'CouponId')
BEGIN
    ALTER TABLE Orders
    ADD CouponId INT NULL,
        CouponCode NVARCHAR(50) NULL,
        DiscountAmount DECIMAL(10,2) DEFAULT 0,
        SubTotal DECIMAL(10,2) NULL,
        FOREIGN KEY (CouponId) REFERENCES Coupons(Id);
END
GO

-- İndeksler
CREATE INDEX IX_Coupons_Code ON Coupons(Code);
CREATE INDEX IX_Coupons_Active ON Coupons(IsActive);
CREATE INDEX IX_CouponUsage_Coupon ON CouponUsage(CouponId);
CREATE INDEX IX_CouponUsage_Customer ON CouponUsage(CustomerId);
GO

-- Örnek kuponlar
INSERT INTO Coupons (Code, Description, DiscountType, DiscountValue, MinimumAmount, MaxDiscount, UsageLimit, ValidUntil, IsActive)
VALUES 
('ILKSIPARIS', 'İlk sipariş indirimi - %20', 'percentage', 20.00, 100.00, 50.00, NULL, DATEADD(MONTH, 6, GETDATE()), 1),
('YENI30', 'Yeni müşterilere %30 indirim', 'percentage', 30.00, 200.00, 100.00, 100, DATEADD(MONTH, 3, GETDATE()), 1),
('FIRSATVAR', '50 TL indirim kuponu', 'fixed', 50.00, 150.00, NULL, 50, DATEADD(MONTH, 1, GETDATE()), 1),
('HAFTASONU15', 'Hafta sonu %15 indirim', 'percentage', 15.00, 75.00, 30.00, NULL, DATEADD(MONTH, 12, GETDATE()), 1);
GO

