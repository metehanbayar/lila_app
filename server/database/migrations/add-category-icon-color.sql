-- Kategorilere Icon ve Color alanları ekleme
-- Bu migration kategorilere ikon ve renk özelleştirme imkanı sağlar

-- Icon alanı: Lucide-react ikon adını tutar (örn: 'Pizza', 'Coffee', 'Utensils')
-- Color alanı: Tailwind renk sınıfını tutar (örn: 'bg-orange-500', 'bg-purple-500')

ALTER TABLE Categories
ADD Icon NVARCHAR(50) NULL,
    Color NVARCHAR(50) NULL;

-- Mevcut kategoriler için varsayılan değerler
UPDATE Categories SET Icon = 'Utensils', Color = 'bg-gray-500' WHERE Icon IS NULL;

-- Şimdi NULL olamaz yap
ALTER TABLE Categories
ALTER COLUMN Icon NVARCHAR(50) NOT NULL;

ALTER TABLE Categories
ALTER COLUMN Color NVARCHAR(50) NOT NULL;

-- Varsayılan değerler ekle
ALTER TABLE Categories
ADD CONSTRAINT DF_Categories_Icon DEFAULT 'Utensils' FOR Icon;

ALTER TABLE Categories
ADD CONSTRAINT DF_Categories_Color DEFAULT 'bg-gray-500' FOR Color;

GO

