-- Customer (Müşteri) Kullanıcıları Tablosu
CREATE TABLE Customers (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20),
    Address NVARCHAR(1000),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME,
    EmailVerified BIT DEFAULT 0
);

-- Orders tablosuna CustomerId kolonu ekle (varsa önce kontrol et)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = 'CustomerId')
BEGIN
    ALTER TABLE Orders
    ADD CustomerId INT NULL,
    FOREIGN KEY (CustomerId) REFERENCES Customers(Id);
END
GO

-- Müşteri favorileri tablosu (isteğe bağlı)
CREATE TABLE CustomerFavorites (
    Id INT PRIMARY KEY IDENTITY(1,1),
    CustomerId INT NOT NULL,
    ProductId INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CustomerId) REFERENCES Customers(Id),
    FOREIGN KEY (ProductId) REFERENCES Products(Id),
    UNIQUE (CustomerId, ProductId)
);

-- İndeksler
CREATE INDEX IX_Orders_Customer ON Orders(CustomerId);
CREATE INDEX IX_Customers_Email ON Customers(Email);

GO

-- Örnek müşteri (Test için - Şifre: test123)
INSERT INTO Customers (Email, Password, FullName, Phone, EmailVerified) 
VALUES ('test@example.com', 'test123', 'Test Kullanıcı', '0555 555 5555', 1);

GO

