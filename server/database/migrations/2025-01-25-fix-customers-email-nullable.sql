-- Migration: Fix Customers table - Make Email nullable for OTP system
-- Date: 2025-01-25
-- Description: Email column should be nullable for OTP-based registration

-- First, find and drop all constraints on Email column
DECLARE @sql NVARCHAR(MAX) = '';

-- Drop unique constraints
SELECT @sql = @sql + 'ALTER TABLE Customers DROP CONSTRAINT ' + name + ';' + CHAR(13)
FROM sys.key_constraints 
WHERE parent_object_id = OBJECT_ID('Customers') 
AND type = 'UQ' 
AND name LIKE '%Email%';

-- Drop check constraints
SELECT @sql = @sql + 'ALTER TABLE Customers DROP CONSTRAINT ' + name + ';' + CHAR(13)
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('Customers') 
AND name LIKE '%Email%';

-- Drop foreign key constraints that reference Email
SELECT @sql = @sql + 'ALTER TABLE ' + OBJECT_NAME(parent_object_id) + ' DROP CONSTRAINT ' + name + ';' + CHAR(13)
FROM sys.foreign_keys 
WHERE referenced_object_id = OBJECT_ID('Customers') 
AND name LIKE '%Email%';

-- Execute constraint drops
IF LEN(@sql) > 0
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Dropped constraints on Email column';
END

-- Drop indexes on Email column
SELECT @sql = 'DROP INDEX ' + name + ' ON Customers;' + CHAR(13)
FROM sys.indexes 
WHERE object_id = OBJECT_ID('Customers') 
AND name LIKE '%Email%';

IF LEN(@sql) > 0
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Dropped indexes on Email column';
END

-- Make Email column nullable
ALTER TABLE Customers ALTER COLUMN Email NVARCHAR(100) NULL;

-- Add unique constraint only for non-null emails
CREATE UNIQUE NONCLUSTERED INDEX IX_Customers_Email_Unique 
ON Customers(Email) 
WHERE Email IS NOT NULL;

-- Add PhoneVerified column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Customers') AND name = 'PhoneVerified')
BEGIN
    ALTER TABLE Customers ADD PhoneVerified BIT DEFAULT 0;
END

-- Update existing records to have PhoneVerified = 1 if they have a phone
UPDATE Customers 
SET PhoneVerified = 1 
WHERE Phone IS NOT NULL AND PhoneVerified IS NULL;

-- Make Password column nullable for OTP system
ALTER TABLE Customers ALTER COLUMN Password NVARCHAR(255) NULL;

-- Update existing records with OTP auth password if they don't have one
UPDATE Customers 
SET Password = 'otp_auth' 
WHERE Password IS NULL;

PRINT 'Migration completed: Customers table updated for OTP system';
