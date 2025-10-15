-- ProductVariants Tablosu
-- Ürünlerin farklı porsiyon/varyant seçenekleri için (tam, yarım, büyük, küçük vb.)

CREATE TABLE ProductVariants (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL, -- Örn: "Tam Porsiyon", "Yarım Porsiyon", "Büyük Boy", "Orta Boy"
    Price DECIMAL(10,2) NOT NULL,
    IsDefault BIT DEFAULT 0, -- Varsayılan seçenek mi?
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

-- Index oluştur
CREATE INDEX IX_ProductVariants_Product ON ProductVariants(ProductId);
CREATE INDEX IX_ProductVariants_Active ON ProductVariants(IsActive);

-- OrderItems tablosuna varyant bilgisi ekle
ALTER TABLE OrderItems 
ADD VariantId INT NULL,
    VariantName NVARCHAR(100) NULL;

-- Mevcut ürünler için varsayılan varyant oluştur
-- (Varolan ürünlere "Standart" adında bir varyant ekler)
INSERT INTO ProductVariants (ProductId, Name, Price, IsDefault, DisplayOrder)
SELECT 
    Id, 
    'Standart' as Name, 
    Price, 
    1 as IsDefault, 
    0 as DisplayOrder
FROM Products
WHERE IsActive = 1;

GO

