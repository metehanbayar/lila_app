-- OTP (One-Time Password) doğrulama tablosu
CREATE TABLE OTPVerification (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Phone NVARCHAR(20) NOT NULL,
    OTPCode NVARCHAR(6) NOT NULL,
    Purpose NVARCHAR(50) NOT NULL, -- 'register' veya 'login'
    IsVerified BIT DEFAULT 0,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    VerifiedAt DATETIME NULL
);

-- Index'ler
CREATE INDEX IX_OTPVerification_Phone ON OTPVerification(Phone);
CREATE INDEX IX_OTPVerification_ExpiresAt ON OTPVerification(ExpiresAt);

-- Customers tablosuna telefon doğrulama alanı ekle (eğer yoksa)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'PhoneVerified')
BEGIN
    ALTER TABLE Customers ADD PhoneVerified BIT DEFAULT 0;
END
GO

