-- Admin Users Tablosu
CREATE TABLE AdminUsers (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME
);

-- Varsayılan admin kullanıcısı (şifre: admin123)
-- Not: Gerçek uygulamada mutlaka şifreyi değiştirin!
INSERT INTO AdminUsers (Username, Password, FullName, Email) 
VALUES ('admin', 'admin123', 'Sistem Yöneticisi', 'admin@lilagroup.com');

GO

