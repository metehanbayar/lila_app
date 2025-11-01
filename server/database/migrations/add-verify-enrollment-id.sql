-- Orders tablosuna 3D Secure eşleştirme için VerifyEnrollmentRequestId kolonu ekler
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'VerifyEnrollmentRequestId'
)
BEGIN
    ALTER TABLE Orders ADD VerifyEnrollmentRequestId NVARCHAR(100) NULL;
END;


