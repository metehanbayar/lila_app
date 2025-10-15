-- Müşteri Adresleri Tablosu
CREATE TABLE CustomerAddresses (
    Id INT PRIMARY KEY IDENTITY(1,1),
    CustomerId INT NOT NULL,
    AddressName NVARCHAR(50) NOT NULL, -- Örn: 'Ev', 'İş', 'Annem'
    FullAddress NVARCHAR(1000) NOT NULL,
    IsDefault BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CustomerId) REFERENCES Customers(Id) ON DELETE CASCADE
);

-- İndeksler
CREATE INDEX IX_CustomerAddresses_Customer ON CustomerAddresses(CustomerId);

-- Her müşteri için sadece bir tane default adres olabilir
CREATE UNIQUE INDEX IX_CustomerAddresses_DefaultPerCustomer 
ON CustomerAddresses(CustomerId) 
WHERE IsDefault = 1;

GO

