-- Migration: Shared Categories System - ADIM 2
-- Bu dosya RestaurantCategories tablosu zaten oluşturulmuşsa çalıştırılmalıdır

-- 1. Foreign key constraint'i bul ve sil
DECLARE @ConstraintName nvarchar(200)
SELECT @ConstraintName = OBJECT_NAME(OBJECT_ID) 
FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('Categories') 
AND referenced_object_id = OBJECT_ID('Restaurants')

IF @ConstraintName IS NOT NULL
BEGIN
    PRINT 'Foreign key constraint siliniyor: ' + @ConstraintName
    EXEC('ALTER TABLE Categories DROP CONSTRAINT ' + @ConstraintName)
END
ELSE
BEGIN
    PRINT 'Foreign key constraint bulunamadı (zaten silinmiş olabilir)'
END

-- 2. Index'i sil (eğer varsa)
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Categories_Restaurant' AND object_id = OBJECT_ID('Categories'))
BEGIN
    PRINT 'Index siliniyor: IX_Categories_Restaurant'
    DROP INDEX IX_Categories_Restaurant ON Categories
END
ELSE
BEGIN
    PRINT 'IX_Categories_Restaurant index bulunamadı (zaten silinmiş olabilir)'
END

-- 3. RestaurantId kolonunu sil
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Categories') AND name = 'RestaurantId')
BEGIN
    PRINT 'RestaurantId kolonu siliniyor...'
    ALTER TABLE Categories DROP COLUMN RestaurantId
    PRINT 'RestaurantId kolonu silindi'
END
ELSE
BEGIN
    PRINT 'RestaurantId kolonu bulunamadı (zaten silinmiş)'
END

-- 4. DisplayOrder kolonunu sil (önce default constraint'i sil)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Categories') AND name = 'DisplayOrder')
BEGIN
    -- Default constraint'i bul ve sil
    DECLARE @DisplayOrderConstraint nvarchar(200)
    SELECT @DisplayOrderConstraint = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = OBJECT_ID('Categories') AND c.name = 'DisplayOrder'
    
    IF @DisplayOrderConstraint IS NOT NULL
    BEGIN
        PRINT 'DisplayOrder default constraint siliniyor: ' + @DisplayOrderConstraint
        EXEC('ALTER TABLE Categories DROP CONSTRAINT ' + @DisplayOrderConstraint)
    END
    
    PRINT 'DisplayOrder kolonu siliniyor...'
    ALTER TABLE Categories DROP COLUMN DisplayOrder
    PRINT 'DisplayOrder kolonu silindi'
END
ELSE
BEGIN
    PRINT 'DisplayOrder kolonu bulunamadı (zaten silinmiş)'
END

-- 5. Yeni index'leri oluştur (eğer yoksa)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RestaurantCategories_Restaurant' AND object_id = OBJECT_ID('RestaurantCategories'))
BEGIN
    PRINT 'IX_RestaurantCategories_Restaurant index oluşturuluyor...'
    CREATE INDEX IX_RestaurantCategories_Restaurant ON RestaurantCategories(RestaurantId)
    PRINT 'IX_RestaurantCategories_Restaurant index oluşturuldu'
END
ELSE
BEGIN
    PRINT 'IX_RestaurantCategories_Restaurant index zaten mevcut'
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RestaurantCategories_Category' AND object_id = OBJECT_ID('RestaurantCategories'))
BEGIN
    PRINT 'IX_RestaurantCategories_Category index oluşturuluyor...'
    CREATE INDEX IX_RestaurantCategories_Category ON RestaurantCategories(CategoryId)
    PRINT 'IX_RestaurantCategories_Category index oluşturuldu'
END
ELSE
BEGIN
    PRINT 'IX_RestaurantCategories_Category index zaten mevcut'
END

PRINT ''
PRINT '✓ Migration başarıyla tamamlandı!'
PRINT ''
PRINT 'Kontrol sorgusu:'
PRINT 'SELECT * FROM Categories;'
PRINT 'SELECT * FROM RestaurantCategories;'

GO

