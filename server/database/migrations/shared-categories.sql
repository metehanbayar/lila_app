-- Migration: Shared Categories System
-- Kategorileri tüm restoranlar için ortak hale getirir

-- 1. Önce RestaurantCategories junction tablosunu oluştur
CREATE TABLE RestaurantCategories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    RestaurantId INT NOT NULL,
    CategoryId INT NOT NULL,
    DisplayOrder INT DEFAULT 0,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (RestaurantId) REFERENCES Restaurants(Id),
    FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
    UNIQUE(RestaurantId, CategoryId) -- Bir kategori bir restoranda sadece bir kez olabilir
);

-- 2. Mevcut kategori verilerini yeni tabloya aktar
INSERT INTO RestaurantCategories (RestaurantId, CategoryId, DisplayOrder, IsActive, CreatedAt)
SELECT 
    RestaurantId, 
    Id as CategoryId,
    DisplayOrder,
    IsActive,
    CreatedAt
FROM Categories
WHERE RestaurantId IS NOT NULL;

-- 3. Categories tablosundaki RestaurantId kolonunu kaldır ve DisplayOrder'ı kaldır
-- Önce bağımlılıkları (foreign key ve index) kaldırmalıyız

-- Foreign key constraint'i bul ve sil
DECLARE @ConstraintName nvarchar(200)
SELECT @ConstraintName = OBJECT_NAME(OBJECT_ID) 
FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('Categories') 
AND referenced_object_id = OBJECT_ID('Restaurants')

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Categories DROP CONSTRAINT ' + @ConstraintName)
END

-- Index'i sil (eğer varsa)
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Categories_Restaurant' AND object_id = OBJECT_ID('Categories'))
BEGIN
    DROP INDEX IX_Categories_Restaurant ON Categories
END

-- Şimdi kolonları silebiliriz
ALTER TABLE Categories
DROP COLUMN RestaurantId;

ALTER TABLE Categories
DROP COLUMN DisplayOrder;

-- 4. Index oluştur (performance için)
CREATE INDEX IX_RestaurantCategories_Restaurant ON RestaurantCategories(RestaurantId);
CREATE INDEX IX_RestaurantCategories_Category ON RestaurantCategories(CategoryId);

GO

-- NOT: Bu migration'ı çalıştırdıktan sonra artık:
-- - Categories tablosu sadece kategori isimlerini tutar (global)
-- - RestaurantCategories tablosu hangi kategorinin hangi restoranda kullanıldığını tutar
-- - Her restoran istediği kategorileri seçebilir
-- - Kategoriler tüm restoranlar tarafından paylaşılır

