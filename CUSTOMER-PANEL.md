# Müşteri Paneli

Bu doküman müşteri tarafındaki güncel akışı özetler.

## Giriş ve Kayıt

Müşteri auth akışı şifre ile değil telefon + OTP ile çalışır.

Kayıt:

1. kullanıcı ad soyad ve telefon girer
2. OTP gönderilir
3. OTP doğrulanır
4. kayıt tamamlanır
5. imzalı Bearer token alınır

Giriş:

1. kullanıcı telefon girer
2. OTP gönderilir
3. OTP doğrulanır
4. imzalı Bearer token alınır

Notlar:

- `email` kayıt sırasında opsiyoneldir
- `password` alanı yoktur
- `change-password` endpoint'i yoktur

## Mevcut Sayfalar

- `/login`
- `/register`
- `/profile`
- `/my-orders`
- `/my-orders/:orderNumber`
- `/favorites`

## Profil

Profil tarafında güncellenebilen alanlar:

- `fullName`
- `email`
- `dateOfBirth`
- `gender`

Telefon numarası oturum kimliği olarak kullanıldığı için burada ana giriş alanıdır.

## Siparişler ve Favoriler

Desteklenen müşteri endpoint'leri:

```text
POST   /api/customer/register
POST   /api/customer/login
GET    /api/customer/profile
PUT    /api/customer/profile

GET    /api/customer/my-orders
GET    /api/customer/my-orders/:orderNumber
GET    /api/customer/statistics

GET    /api/customer/favorites
POST   /api/customer/favorites/:productId
DELETE /api/customer/favorites/:productId
```

## Güvenlik

- oturum için sunucu tarafında imzalı token kullanılır
- OTP aktifse register ve login akışında doğrulama zorunludur
- OTP kapalıysa demo/development akışı devreye girer

## İlgili Dosyalar

- `client/src/pages/customer/Login.jsx`
- `client/src/pages/customer/Register.jsx`
- `client/src/pages/customer/Profile.jsx`
- `client/src/pages/customer/OrderHistory.jsx`
- `client/src/pages/customer/OrderDetail.jsx`
- `client/src/pages/customer/Favorites.jsx`
- `server/routes/customer-auth.js`
- `server/routes/customer-orders.js`
