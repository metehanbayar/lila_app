-- Add OldPrice column to Products table
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Products') AND name = 'OldPrice'
)
BEGIN
    ALTER TABLE Products ADD OldPrice DECIMAL(10, 2) NULL;
END
GO
