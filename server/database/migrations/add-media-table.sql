-- Media (Görsel Kütüphanesi) Tablosu Ekleme
-- Bu migration dosyasını SQL Server'da çalıştırın

-- Media tablosu oluştur
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

-- Index ekle
CREATE INDEX IX_Media_CreatedAt ON Media(CreatedAt DESC);

GO

