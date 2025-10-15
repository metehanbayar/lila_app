-- Restaurants tablosuna ImageUrl kolonu ekleme
-- Bu migration dosyasını SQL Server'da çalıştırın

-- ImageUrl kolonu ekle
ALTER TABLE Restaurants
ADD ImageUrl NVARCHAR(500) NULL;

-- Mevcut kayıtlar için varsayılan görsel (isteğe bağlı)
-- UPDATE Restaurants SET ImageUrl = 'https://via.placeholder.com/400x250' WHERE ImageUrl IS NULL;

GO

