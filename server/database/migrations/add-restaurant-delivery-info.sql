-- Migration: Add DeliveryTime and MinOrder fields to Restaurants table
-- Date: 2025-01-26
-- Description: Add delivery time estimate and minimum order amount per restaurant

-- Add DeliveryTime column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Restaurants') AND name = 'DeliveryTime')
BEGIN
    ALTER TABLE Restaurants ADD DeliveryTime NVARCHAR(50) NULL;
    PRINT 'Added DeliveryTime column to Restaurants table';
END

-- Add MinOrder column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Restaurants') AND name = 'MinOrder')
BEGIN
    ALTER TABLE Restaurants ADD MinOrder DECIMAL(10,2) NULL;
    PRINT 'Added MinOrder column to Restaurants table';
END

-- Add DeliveryTimeMinutes for sorting/filtering (optional)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Restaurants') AND name = 'DeliveryTimeMinutes')
BEGIN
    ALTER TABLE Restaurants ADD DeliveryTimeMinutes INT NULL;
    PRINT 'Added DeliveryTimeMinutes column to Restaurants table';
END

-- Update default values for existing restaurants
UPDATE Restaurants 
SET DeliveryTime = '30-45 dk',
    DeliveryTimeMinutes = 37,
    MinOrder = 50.00
WHERE DeliveryTime IS NULL;

PRINT 'Migration completed: Restaurant delivery info fields added';

