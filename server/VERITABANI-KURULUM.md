# Veritabanı Kurulum Rehberi

Bu rehber `server` tarafının MSSQL bağlantısını güncel repo yapısına göre hazırlar.

## 1. Env Dosyasını Oluştur

`server` klasöründe örnek env dosyasını kopyalayın:

```bash
copy .env.example .env
```

PowerShell yerine Bash kullanıyorsanız:

```bash
cp .env.example .env
```

## 2. Veritabanı Alanlarını Doldur

`server/.env` içinde en az şu alanları düzenleyin:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

DB_SERVER=your-mssql-server
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_ENCRYPT=true
DB_INSTANCE=
DB_CONNECTION_STRING=
```

Notlar:

- `DB_INSTANCE` sadece instance bazlı bağlantı gerekiyorsa doldurulmalıdır.
- `DB_CONNECTION_STRING` özel bağlantı cümlesi kullanacaksanız eklenebilir.
- Tek kaynak dosya `server/.env.example` dosyasıdır. Repo içinde artık ayrı `ORNEK-AZURE` veya `ORNEK-AWS` env dosyaları tutulmaz.

## 3. Şemayı Yükle

SSMS veya Azure Data Studio ile şu dosyaları sırayla çalıştırın:

```text
server/database/schema.sql
server/database/seed.sql
```

Admin kullanıcı gerekiyorsa ayrıca:

```text
server/database/admin-schema.sql
```

OTP kullanacaksanız:

```text
server/database/migrations/add-otp-verification.sql
```

## 4. Bağlantıyı Doğrula

Sunucu tarafında artık ESM kullanıldığı için eski `require(...)` test komutu geçerli değildir.

Bunun yerine:

```bash
npm run check:smoke
```

veya tüm temel kontroller için:

```bash
npm run check
```

Bu komutlar:

- env okunabiliyor mu
- syntax geçerli mi
- veritabanı bağlantısı kurulabiliyor mu

kontrol eder.

## 5. Firewall ve Ağ

Azure SQL veya RDS kullanıyorsanız:

- uygulamanın çalıştığı sunucu IP adresini whitelist'e ekleyin
- 1433 erişimi açık olmalı
- veritabanı kullanıcısının ilgili database üzerinde yetkisi olmalı

## 6. E-posta Ayarları

Sipariş e-postaları kullanılıyorsa şu alanları da doldurun:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=no-reply@example.com
EMAIL_TO=orders@example.com
```

## Kontrol Listesi

- [ ] `server/.env` oluşturuldu
- [ ] `DB_*` alanları dolduruldu
- [ ] `schema.sql` çalıştırıldı
- [ ] `seed.sql` çalıştırıldı
- [ ] gerekliyse `admin-schema.sql` çalıştırıldı
- [ ] gerekliyse OTP migration çalıştırıldı
- [ ] `npm run check:smoke` başarılı geçti

## Sorun Giderme

### Login failed for user

- kullanıcı adı veya şifre yanlış olabilir
- SQL Server authentication kapalı olabilir
- kullanıcının veritabanı yetkisi eksik olabilir

### Cannot open database

- `DB_DATABASE` yanlış olabilir
- veritabanı henüz oluşturulmamış olabilir

### Connection timeout

- `DB_SERVER` veya `DB_PORT` yanlış olabilir
- firewall 1433 trafiğini engelliyor olabilir
- SQL Server dış erişime kapalı olabilir

## İlgili Dosyalar

- `server/.env.example`
- `server/config/database.js`
- `server/scripts/smoke-check.js`
