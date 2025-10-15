-- Örnek Veri Ekleme (Seed Data)

-- Restoranlar
INSERT INTO Restaurants (Name, Slug, Description, Color) VALUES
('Lila Steakhouse', 'lila-steakhouse', 'Premium et ve steakhouse deneyimi', '#EC4899'),
('Lila Bistro', 'lila-bistro', 'Modern bistro mutfağı ve taze lezzetler', '#22C55E'),
('Lila Lounge', 'lila-lounge', 'Özel içecekler ve aperatifler', '#1F2937');

-- Kategoriler - Lila Steakhouse
INSERT INTO Categories (RestaurantId, Name, DisplayOrder) VALUES
(1, 'Steakler', 1),
(1, 'Başlangıçlar', 2),
(1, 'Yan Ürünler', 3),
(1, 'İçecekler', 4);

-- Kategoriler - Lila Bistro
INSERT INTO Categories (RestaurantId, Name, DisplayOrder) VALUES
(2, 'Ana Yemekler', 1),
(2, 'Salatalar', 2),
(2, 'Tatlılar', 3),
(2, 'İçecekler', 4);

-- Kategoriler - Lila Lounge
INSERT INTO Categories (RestaurantId, Name, DisplayOrder) VALUES
(3, 'Kokteyller', 1),
(3, 'Aperatifler', 2),
(3, 'Özel Kahveler', 3);

-- Ürünler - Lila Steakhouse
INSERT INTO Products (RestaurantId, CategoryId, Name, Description, Price, ImageUrl, IsFeatured, DisplayOrder) VALUES
(1, 1, 'Wagyu Ribeye', 'Premium Japon Wagyu sığırı, 300gr, özel soslarla', 850.00, '/images/wagyu-ribeye.jpg', 1, 1),
(1, 1, 'T-Bone Steak', 'USDA Prime, 500gr, sebzeler eşliğinde', 650.00, '/images/t-bone.jpg', 1, 2),
(1, 1, 'Tenderloin', 'Bonfile, 250gr, truffle sos', 580.00, '/images/tenderloin.jpg', 0, 3),
(1, 2, 'Sezar Salata', 'Klasik Sezar salatası, parmesan ve kruton', 120.00, '/images/caesar.jpg', 0, 1),
(1, 2, 'Çorba', 'Günün çorbası', 85.00, '/images/soup.jpg', 0, 2),
(1, 3, 'Patates Kızartması', 'Çıtır patates, özel soslar', 95.00, '/images/fries.jpg', 0, 1),
(1, 3, 'Izgara Sebzeler', 'Mevsim sebzeleri, zeytinyağlı', 110.00, '/images/grilled-veg.jpg', 0, 2),
(1, 4, 'Kola', '330ml', 45.00, NULL, 0, 1),
(1, 4, 'Ayran', 'Ev yapımı', 35.00, NULL, 0, 2);

-- Ürünler - Lila Bistro
INSERT INTO Products (RestaurantId, CategoryId, Name, Description, Price, ImageUrl, IsFeatured, DisplayOrder) VALUES
(2, 5, 'Izgara Somon', 'Taze somon, limon soslu, sebzeler', 380.00, '/images/salmon.jpg', 1, 1),
(2, 5, 'Risotto', 'Mantarlı risotto, parmesan', 260.00, '/images/risotto.jpg', 0, 2),
(2, 5, 'Kuzu Pirzola', 'Fırın kuzu, patates püresi', 420.00, '/images/lamb.jpg', 1, 3),
(2, 6, 'Akdeniz Salatası', 'Taze sebzeler, zeytinyağı', 140.00, '/images/mediterranean.jpg', 0, 1),
(2, 6, 'Kinoa Salata', 'Kinoa, avokado, çeri domates', 160.00, '/images/quinoa.jpg', 0, 2),
(2, 7, 'Tiramisu', 'İtalyan tiramisu, espresso', 140.00, '/images/tiramisu.jpg', 1, 1),
(2, 7, 'Sufle', 'Çikolatalı sufle, vanilyalı dondurma', 150.00, '/images/souffle.jpg', 0, 2),
(2, 8, 'Limonata', 'Ev yapımı, taze nane', 55.00, NULL, 0, 1);

-- Ürünler - Lila Lounge
INSERT INTO Products (RestaurantId, CategoryId, Name, Description, Price, ImageUrl, IsFeatured, DisplayOrder) VALUES
(3, 9, 'Mojito', 'Rom, nane, limon, soda', 180.00, '/images/mojito.jpg', 1, 1),
(3, 9, 'Margarita', 'Tekila, triple sec, limon', 190.00, '/images/margarita.jpg', 1, 2),
(3, 9, 'Cosmopolitan', 'Votka, cranberry, limon', 195.00, '/images/cosmopolitan.jpg', 0, 3),
(3, 10, 'Bruschetta', 'Domates, fesleğen, zeytinyağı', 120.00, '/images/bruschetta.jpg', 0, 1),
(3, 10, 'Peynir Tabağı', 'Seçme peynirler, reçel', 180.00, '/images/cheese.jpg', 0, 2),
(3, 11, 'Espresso Martini', 'Votka, kahve likörü, espresso', 210.00, '/images/espresso-martini.jpg', 1, 1),
(3, 11, 'Irish Coffee', 'Viski, kahve, krema', 175.00, '/images/irish-coffee.jpg', 0, 2);

GO

