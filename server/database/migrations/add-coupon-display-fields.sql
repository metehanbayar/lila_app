-- Kupon görünüm alanları ekleme migration

-- Coupons tablosuna görünüm alanları ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Coupons') AND name = 'DisplayTitle')
BEGIN
    ALTER TABLE Coupons
    ADD DisplayTitle NVARCHAR(200) NULL,
        DisplaySubtitle NVARCHAR(200) NULL,
        BgColor NVARCHAR(50) NULL,
        IconType NVARCHAR(50) NULL;
END
GO

-- Mevcut kuponlara default değerler ata
UPDATE Coupons
SET 
    DisplayTitle = CASE 
        WHEN CHARINDEX('-', Description) > 0 
        THEN LEFT(Description, CHARINDEX('-', Description) - 1)
        ELSE 'Özel Kampanya'
    END,
    DisplaySubtitle = CASE 
        WHEN CHARINDEX('-', Description) > 0 
        THEN LTRIM(SUBSTRING(Description, CHARINDEX('-', Description) + 1, LEN(Description)))
        ELSE 'Kaçırmayın'
    END,
    BgColor = 'purple',
    IconType = 'gift'
WHERE DisplayTitle IS NULL;
GO

-- Şablon kuponları güncelle
UPDATE Coupons SET BgColor = 'purple', IconType = 'gift' WHERE Code = 'ILKSIPARIS';
UPDATE Coupons SET BgColor = 'blue', IconType = 'shopping-bag' WHERE Code = 'YENI30';
UPDATE Coupons SET BgColor = 'orange', IconType = 'percent' WHERE Code = 'FIRSATVAR';
UPDATE Coupons SET BgColor = 'green', IconType = 'award' WHERE Code = 'HAFTASONU15';
GO

