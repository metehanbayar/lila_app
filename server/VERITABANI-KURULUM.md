# 🗄️ Veritabanı Kurulum Rehberi

## 1️⃣ Veritabanını Oluşturduktan Sonra

### Azure SQL Database üzerinden örnek:

1. **Bağlantı bilgilerinizi alın:**
   - Server: `yourserver.database.windows.net`
   - Database: `LilaGroupMenu`
   - Username: `sqladmin`
   - Password: `YourPassword123!`

2. **`.env` dosyası oluşturun:**

```bash
cd server
cp .env.example .env
```

3. **`.env` dosyasını düzenleyin:**

```bash
# Windows
notepad .env

# Linux/Mac
nano .env

# VSCode
code .env
```

4. **Bilgilerinizi girin:**

```env
# Server Ayarları
PORT=3000
NODE_ENV=production

# MSSQL Veritabanı (Kendi bilgilerinizle değiştirin!)
DB_SERVER=yourserver.database.windows.net
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=sqladmin
DB_PASSWORD=YourPassword123!
DB_ENCRYPT=true

# Email (Gmail örneği)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@lilagroup.com
EMAIL_TO=orders@lilagroup.com

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 2️⃣ Şema ve Veri Yükleme

### Azure Data Studio veya SSMS ile:

1. **Veritabanınıza bağlanın**
2. **Şemayı yükleyin:**
   - `database/schema.sql` dosyasını açın
   - Tüm SQL'i seçin ve çalıştırın (F5)
   
3. **Örnek verileri yükleyin:**
   - `database/seed.sql` dosyasını açın
   - Tüm SQL'i seçin ve çalıştırın (F5)

### Komut satırından (sqlcmd):

```bash
# Şema yükleme
sqlcmd -S yourserver.database.windows.net -d LilaGroupMenu -U sqladmin -P 'YourPassword' -i database/schema.sql

# Seed data yükleme
sqlcmd -S yourserver.database.windows.net -d LilaGroupMenu -U sqladmin -P 'YourPassword' -i database/seed.sql
```

## 3️⃣ Bağlantıyı Test Etme

```bash
cd server

# Node.js ile test
node -e "require('./config/database.js').getConnection().then(() => console.log('✅ Bağlantı başarılı!')).catch(err => console.error('❌ Hata:', err))"
```

## 4️⃣ Firewall Ayarları (Önemli!)

### Azure SQL için:

1. Azure Portal → SQL Database → Firewall ayarları
2. **Plesk sunucu IP'sini ekleyin:**
   - Name: `Plesk-Server`
   - Start IP: `your-plesk-ip`
   - End IP: `your-plesk-ip`
   
3. Geliştirme yaparken kendi IP'nizi de ekleyin

### AWS RDS için:

1. RDS → Security Groups
2. Inbound rules'a ekleyin:
   - Type: MSSQL (1433)
   - Source: Plesk server IP

## 5️⃣ Gmail App Password Oluşturma

1. https://myaccount.google.com/ adresine gidin
2. **Security** → **2-Step Verification** aktif edin
3. **App passwords** oluşturun
4. "Mail" ve "Other" seçin, isim verin
5. Oluşan 16 haneli şifreyi `.env` dosyasındaki `EMAIL_PASSWORD`'e yazın

Örnek: `abcd efgh ijkl mnop`

## 6️⃣ Kontrol Listesi

- [ ] Veritabanı oluşturuldu
- [ ] `server/.env` dosyası oluşturuldu
- [ ] Veritabanı bağlantı bilgileri `.env`'ye yazıldı
- [ ] Email SMTP bilgileri `.env`'ye yazıldı
- [ ] `schema.sql` çalıştırıldı (tablolar oluştu)
- [ ] `seed.sql` çalıştırıldı (örnek veriler yüklendi)
- [ ] Firewall'da Plesk IP whitelist'e eklendi
- [ ] Bağlantı test edildi ✅

## 🆘 Sorun Giderme

### "Login failed for user" hatası:
- Kullanıcı adı ve şifre doğru mu?
- Firewall'da IP whitelist'e ekli mi?

### "Cannot open database" hatası:
- Database adı doğru mu? (`LilaGroupMenu`)
- Kullanıcının veritabanına erişim yetkisi var mı?

### "Connection timeout" hatası:
- Server adresi doğru mu?
- Port 1433 açık mı?
- Firewall engeli var mı?

### E-posta gönderilmiyor:
- Gmail App Password kullanıyor musunuz?
- SMTP bilgileri doğru mu?
- 2FA aktif mi?

## 📞 Yardım

Sorun yaşarsanız:
1. `server` klasöründeki `VERITABANI-KURULUM.md` dosyasını kontrol edin
2. `.env.ORNEG-AZURE` veya `.env.ORNEG-AWS` dosyalarına bakın
3. Backend loglarını kontrol edin: `pm2 logs lila-menu-api`

