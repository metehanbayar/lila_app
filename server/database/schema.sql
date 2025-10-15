-- Lila Group Menu - Database Schema
-- MSSQL Server

-- Restoranlar Tablosu
CREATE TABLE Restaurants (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Slug NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    Color NVARCHAR(20), -- Tema rengi (fusya, yeşil, siyah)
    ImageUrl NVARCHAR(500), -- Restoran görseli URL
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Kategoriler Tablosu (Global/Ortak)
CREATE TABLE Categories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Restoran-Kategori İlişki Tablosu (Junction Table)
CREATE TABLE RestaurantCategories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    RestaurantId INT NOT NULL,
    CategoryId INT NOT NULL,
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id),
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
    UNIQUE(RestaurantId, CategoryId)
);

-- Ürünler Tablosu
CREATE TABLE Products (
    Id INT PRIMARY KEY IDENTITY(1,1),
    RestaurantId INT NOT NULL,
    CategoryId INT,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    Price DECIMAL(10,2) NOT NULL,
    ImageUrl NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    IsFeatured BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id),
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
);

-- Siparişler Tablosu
CREATE TABLE Orders (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderNumber NVARCHAR(50) NOT NULL UNIQUE,
    CustomerName NVARCHAR(200) NOT NULL,
    CustomerPhone NVARCHAR(20) NOT NULL,
    CustomerAddress NVARCHAR(1000) NOT NULL,
    Notes NVARCHAR(1000),
    TotalAmount DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Confirmed, Preparing, Delivered, Cancelled
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Sipariş Detayları Tablosu
CREATE TABLE OrderItems (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    ProductPrice DECIMAL(10,2) NOT NULL,
    Quantity INT NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (OrderId) REFERENCES Orders(Id),
    FOREIGN KEY (ProductId) REFERENCES Products(Id)
);

-- Media Tablosu (Görsel Kütüphanesi)
CREATE TABLE Media (
    Id INT PRIMARY KEY IDENTITY(1,1),
    FileName NVARCHAR(255) NOT NULL,
    OriginalName NVARCHAR(255) NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    FileUrl NVARCHAR(500) NOT NULL,
    FileSize INT NOT NULL,
    MimeType NVARCHAR(100) NOT NULL,
    Width INT NULL,
    Height INT NULL,
    UploadedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- İndeksler (Performance için)
CREATE INDEX IX_Products_Restaurant ON Products(RestaurantId);
CREATE INDEX IX_Products_Category ON Products(CategoryId);
CREATE INDEX IX_RestaurantCategories_Restaurant ON RestaurantCategories(RestaurantId);
CREATE INDEX IX_RestaurantCategories_Category ON RestaurantCategories(CategoryId);
CREATE INDEX IX_Orders_Date ON Orders(CreatedAt DESC);
CREATE INDEX IX_OrderItems_Order ON OrderItems(OrderId);
CREATE INDEX IX_Media_CreatedAt ON Media(CreatedAt DESC);

GO

