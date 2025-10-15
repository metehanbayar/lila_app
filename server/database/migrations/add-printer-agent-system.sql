-- Printer Agent Sistemi için Veritabanı Güncellemeleri
-- Otomatik yazdırma için gerekli tablolar ve kolonlar

-- =============================================
-- 1. Restoranlar tablosuna yazıcı ayarları ekle
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'AgentToken')
BEGIN
    ALTER TABLE Restaurants ADD AgentToken NVARCHAR(100) NULL;
END
GO

-- AgentToken için unique constraint ekle (eğer yoksa)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Restaurants_AgentToken' AND object_id = OBJECT_ID('Restaurants'))
BEGIN
    CREATE UNIQUE INDEX UQ_Restaurants_AgentToken ON Restaurants(AgentToken) WHERE AgentToken IS NOT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'AgentStatus')
BEGIN
    ALTER TABLE Restaurants ADD AgentStatus NVARCHAR(20) DEFAULT 'disconnected';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'AgentLastSeen')
BEGIN
    ALTER TABLE Restaurants ADD AgentLastSeen DATETIME NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'AgentVersion')
BEGIN
    ALTER TABLE Restaurants ADD AgentVersion NVARCHAR(20) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'AgentComputerName')
BEGIN
    ALTER TABLE Restaurants ADD AgentComputerName NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'PrinterName')
BEGIN
    ALTER TABLE Restaurants ADD PrinterName NVARCHAR(255) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'AutoPrint')
BEGIN
    ALTER TABLE Restaurants ADD AutoPrint BIT DEFAULT 1;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Restaurants') AND name = 'PrinterSettings')
BEGIN
    ALTER TABLE Restaurants ADD PrinterSettings NVARCHAR(MAX) NULL;
END
GO

-- =============================================
-- 2. Agent Token yönetimi için tablo
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AgentTokens')
BEGIN
    CREATE TABLE AgentTokens (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Token NVARCHAR(100) NOT NULL UNIQUE,
        RestaurantId INT NOT NULL,
        Status NVARCHAR(20) DEFAULT 'pending',           -- pending, active, expired, revoked
        CreatedBy INT NULL,                               -- Admin ID
        CreatedAt DATETIME DEFAULT GETDATE(),
        ExpiresAt DATETIME NULL,                          -- Token son kullanma tarihi
        ActivatedAt DATETIME NULL,                        -- İlk bağlantı zamanı
        LastUsedAt DATETIME NULL,
        DownloadCount INT DEFAULT 0,                      -- Kaç kez indirildi
        FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id)
    );
    
    CREATE INDEX IX_AgentTokens_Token ON AgentTokens(Token);
    CREATE INDEX IX_AgentTokens_Restaurant ON AgentTokens(RestaurantId);
END
GO

-- =============================================
-- 3. Sipariş-Restoran ilişkisi tablosu
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderRestaurants')
BEGIN
    CREATE TABLE OrderRestaurants (
        Id INT PRIMARY KEY IDENTITY(1,1),
        OrderId INT NOT NULL,
        RestaurantId INT NOT NULL,
        Subtotal DECIMAL(10,2) NOT NULL,
        ItemCount INT DEFAULT 0,
        IsPrinted BIT DEFAULT 0,
        PrintedAt DATETIME NULL,
        PrintError NVARCHAR(500) NULL,
        PrintAttempts INT DEFAULT 0,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
        FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id),
        UNIQUE(OrderId, RestaurantId)
    );
    
    CREATE INDEX IX_OrderRestaurants_Order ON OrderRestaurants(OrderId);
    CREATE INDEX IX_OrderRestaurants_Restaurant ON OrderRestaurants(RestaurantId);
    CREATE INDEX IX_OrderRestaurants_Printed ON OrderRestaurants(IsPrinted, RestaurantId);
END
GO

-- =============================================
-- 4. Yazdırma geçmişi tablosu
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PrintHistory')
BEGIN
    CREATE TABLE PrintHistory (
        Id INT PRIMARY KEY IDENTITY(1,1),
        OrderId INT NOT NULL,
        RestaurantId INT NOT NULL,
        AgentToken NVARCHAR(100) NULL,
        PrinterName NVARCHAR(255) NULL,
        Status NVARCHAR(20) NOT NULL,                    -- success, failed, retry
        ErrorMessage NVARCHAR(500) NULL,
        PrintedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (OrderId) REFERENCES Orders(Id),
        FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id)
    );
    
    CREATE INDEX IX_PrintHistory_Order ON PrintHistory(OrderId);
    CREATE INDEX IX_PrintHistory_Restaurant ON PrintHistory(RestaurantId);
    CREATE INDEX IX_PrintHistory_Date ON PrintHistory(PrintedAt DESC);
END
GO

-- =============================================
-- 5. Agent log tablosu
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AgentLogs')
BEGIN
    CREATE TABLE AgentLogs (
        Id INT PRIMARY KEY IDENTITY(1,1),
        RestaurantId INT NOT NULL,
        AgentToken NVARCHAR(100) NULL,
        LogLevel NVARCHAR(20) NOT NULL,                  -- info, warning, error
        Message NVARCHAR(MAX) NOT NULL,
        Details NVARCHAR(MAX) NULL,                      -- JSON: ek detaylar
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id)
    );
    
    CREATE INDEX IX_AgentLogs_Restaurant ON AgentLogs(RestaurantId);
    CREATE INDEX IX_AgentLogs_Date ON AgentLogs(CreatedAt DESC);
    CREATE INDEX IX_AgentLogs_Level ON AgentLogs(LogLevel);
END
GO

-- =============================================
-- 6. Orders tablosuna ek kolonlar (eğer yoksa)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'SubTotal')
BEGIN
    ALTER TABLE Orders ADD SubTotal DECIMAL(10,2) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'DiscountAmount')
BEGIN
    ALTER TABLE Orders ADD DiscountAmount DECIMAL(10,2) DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'CustomerId')
BEGIN
    ALTER TABLE Orders ADD CustomerId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'CouponId')
BEGIN
    ALTER TABLE Orders ADD CouponId INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'CouponCode')
BEGIN
    ALTER TABLE Orders ADD CouponCode NVARCHAR(50) NULL;
END
GO

-- =============================================
-- 7. OrderItems tablosuna varyant desteği (eğer yoksa)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'OrderItems') AND name = 'VariantId')
BEGIN
    ALTER TABLE OrderItems ADD 
        VariantId INT NULL,
        VariantName NVARCHAR(100) NULL;
END
GO

-- =============================================
-- 8. Token oluşturma stored procedure
-- =============================================
IF OBJECT_ID('dbo.GenerateAgentToken', 'P') IS NOT NULL
    DROP PROCEDURE dbo.GenerateAgentToken;
GO

CREATE PROCEDURE dbo.GenerateAgentToken
    @restaurantId INT,
    @token NVARCHAR(100) OUTPUT
AS
BEGIN
    DECLARE @prefix NVARCHAR(10) = 'LG-';
    DECLARE @guid1 NVARCHAR(40) = CONVERT(NVARCHAR(40), NEWID());
    DECLARE @guid2 NVARCHAR(40) = CONVERT(NVARCHAR(40), NEWID());
    DECLARE @guid3 NVARCHAR(40) = CONVERT(NVARCHAR(40), NEWID());
    DECLARE @random NVARCHAR(90);
    
    -- Format: LG-XXXX-XXXX-XXXX (örnek: LG-K7M2-P9X4-H3N8)
    SET @random = 
        SUBSTRING(@guid1, 1, 4) + '-' +
        SUBSTRING(@guid2, 1, 4) + '-' +
        SUBSTRING(@guid3, 1, 4);
    
    SET @token = @prefix + UPPER(@random);
END
GO

-- =============================================
-- Migration tamamlandi!
-- =============================================
-- Olusturulan tablolar:
--   - AgentTokens (Token yonetimi)
--   - OrderRestaurants (Siparis-Restoran iliskisi)
--   - PrintHistory (Yazdirma gecmisi)
--   - AgentLogs (Agent loglari)
-- Guncellenen tablolar:
--   - Restaurants (Agent bilgileri)
--   - Orders (Ek kolonlar)
--   - OrderItems (Varyant destegi)

SELECT 'Printer Agent Migration Completed Successfully!' as Status;
GO

