# 🚀 Deployment Kılavuzu - Plesk CentOS

Bu döküman, Lila Group Menü uygulamasının Plesk CentOS sunucusuna deployment sürecini adım adım açıklar.

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri
- Plesk Panel (Obsidian veya üzeri)
- CentOS 7/8
- Node.js 18 veya üzeri
- PM2 (Process Manager)
- Nginx (Plesk ile birlikte gelir)
- SSL Sertifikası (Let's Encrypt)

### Harici Servisler
- MSSQL Server (dış kaynak)
- SMTP Sunucusu (Gmail, SendGrid, vb.)

## 🔧 Adım 1: Sunucu Hazırlığı

### Node.js Kurulumu

```bash
# Plesk SSH'ye bağlanın
ssh root@your-server-ip

# NodeSource repository ekle (Node.js 18)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -

# Node.js yükle
yum install -y nodejs

# Versiyonu kontrol et
node --version
npm --version
```

### PM2 Kurulumu

```bash
npm install -g pm2
```

## 📂 Adım 2: Proje Dosyalarını Yükleyin

### Seçenek 1: FTP ile Yükleme

1. FileZilla veya başka bir FTP client kullanın
2. Sunucuya bağlanın
3. Dosyaları şu dizine yükleyin:
   ```
   /var/www/vhosts/yourdomain.com/httpdocs/
   ```

### Seçenek 2: Git ile Yükleme

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/
git clone https://github.com/yourusername/globalmenu.git .
```

### Dosya İzinlerini Ayarlayın

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/
chown -R www-data:www-data .
chmod -R 755 .
```

## 🗄️ Adım 3: Veritabanı Kurulumu

### MSSQL Server'a Bağlanın

MSSQL Management Studio veya Azure Data Studio kullanarak dış MSSQL sunucunuza bağlanın.

### Veritabanını Oluşturun

```sql
CREATE DATABASE LilaGroupMenu;
GO

USE LilaGroupMenu;
GO
```

### Şema ve Tabloları Oluşturun

`server/database/schema.sql` dosyasındaki SQL komutlarını çalıştırın.

### Örnek Verileri Yükleyin (Opsiyonel)

`server/database/seed.sql` dosyasındaki SQL komutlarını çalıştırın.

### Veritabanı Kullanıcısı Oluşturun

```sql
CREATE LOGIN lila_user WITH PASSWORD = 'StrongPassword123!';
GO

USE LilaGroupMenu;
GO

CREATE USER lila_user FOR LOGIN lila_user;
GO

ALTER ROLE db_owner ADD MEMBER lila_user;
GO
```

## ⚙️ Adım 4: Backend Yapılandırması

### Bağımlılıkları Yükleyin

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/server
npm install --production
```

### Environment Variables (.env)

`server/.env` dosyasını oluşturun:

```bash
nano /var/www/vhosts/yourdomain.com/httpdocs/server/.env
```

İçeriği düzenleyin:

```env
# Server
PORT=3000
NODE_ENV=production

# MSSQL Database (External)
DB_SERVER=your-mssql-server.database.windows.net
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=lila_user
DB_PASSWORD=StrongPassword123!
DB_ENCRYPT=true

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=orders@lilagroup.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lilagroup.com
EMAIL_TO=orders@lilagroup.com

# CORS
CORS_ORIGIN=https://yourdomain.com
```

### PM2 ile Backend'i Başlatın

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/server

# PM2 ile başlat
pm2 start server.js --name "lila-menu-api" --node-args="--max-old-space-size=512"

# Otomatik başlatmayı kaydet
pm2 save

# Sistem başlangıcında otomatik başlat
pm2 startup systemd
# Çıkan komutu çalıştırın

# Durumu kontrol et
pm2 status
pm2 logs lila-menu-api
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Log görüntüleme
pm2 logs lila-menu-api --lines 100

# Restart
pm2 restart lila-menu-api

# Stop
pm2 stop lila-menu-api
```

## 🎨 Adım 5: Frontend Build ve Deploy

### Bağımlılıkları Yükleyin

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/client
npm install
```

### Environment Variables

`client/.env` dosyası oluşturun:

```bash
nano /var/www/vhosts/yourdomain.com/httpdocs/client/.env
```

İçerik:

```env
VITE_API_URL=https://yourdomain.com/api
```

### Production Build

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/client
npm run build
```

### Build Dosyalarını Web Root'a Taşıyın

```bash
# Eski dosyaları yedekle
mv /var/www/vhosts/yourdomain.com/public_html /var/www/vhosts/yourdomain.com/public_html.backup

# Yeni build'i kopyala
cp -r /var/www/vhosts/yourdomain.com/httpdocs/client/dist /var/www/vhosts/yourdomain.com/public_html

# İzinleri ayarla
chown -R www-data:www-data /var/www/vhosts/yourdomain.com/public_html
chmod -R 755 /var/www/vhosts/yourdomain.com/public_html
```

## 🔄 Adım 6: Nginx Yapılandırması

### Plesk Panel'den Nginx Ayarları

1. Plesk'e giriş yapın
2. İlgili domain'i seçin
3. **Apache & Nginx Settings** bölümüne gidin
4. **Additional nginx directives** alanına şunu ekleyin:

```nginx
# API Reverse Proxy
location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# SPA Routing (React Router)
location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache, must-revalidate";
}

# Static files caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

5. **OK** butonuna tıklayın

### Nginx'i Yeniden Başlatın

```bash
service nginx reload
```

## 🔒 Adım 7: SSL Sertifikası

### Let's Encrypt (Ücretsiz)

1. Plesk Panel'de domain'i seçin
2. **SSL/TLS Certificates** bölümüne gidin
3. **Let's Encrypt** sekmesini açın
4. E-posta adresinizi girin
5. Domain ve www.domain seçili olmalı
6. **Get it free** butonuna tıklayın
7. **Install** butonuyla sertifikayı yükleyin

### HTTPS Yönlendirmesi

1. **Hosting Settings** bölümüne gidin
2. **Permanent SEO-safe 301 redirect from HTTP to HTTPS** seçeneğini işaretleyin
3. **OK** ile kaydedin

## ✅ Adım 8: Test ve Doğrulama

### Backend API Testi

```bash
curl https://yourdomain.com/api/health
```

Beklenen yanıt:
```json
{
  "status": "OK",
  "message": "Lila Group Menu API çalışıyor",
  "timestamp": "2024-01-..."
}
```

### Frontend Testi

Tarayıcıda açın: `https://yourdomain.com`

### Veritabanı Bağlantı Testi

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/server
node -e "require('./config/database.js').getConnection().then(() => console.log('✅ DB OK')).catch(console.error)"
```

### E-posta Gönderim Testi

Bir test siparişi verin ve e-posta gönderimini kontrol edin.

## 🔄 Adım 9: Güncelleme ve Bakım

### Backend Güncellemesi

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/server
git pull  # veya yeni dosyaları yükleyin
npm install --production
pm2 restart lila-menu-api
```

### Frontend Güncellemesi

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs/client
git pull  # veya yeni dosyaları yükleyin
npm install
npm run build
cp -r dist/* /var/www/vhosts/yourdomain.com/public_html/
```

### Veritabanı Yedekleme

```sql
-- MSSQL Management Studio'da
BACKUP DATABASE LilaGroupMenu
TO DISK = '/path/to/backup/LilaGroupMenu.bak'
WITH FORMAT, COMPRESSION;
```

### PM2 Logları

```bash
# Son 100 satır
pm2 logs lila-menu-api --lines 100

# Real-time
pm2 logs lila-menu-api

# Hataları temizle
pm2 flush
```

## 🐛 Sorun Giderme

### Backend Başlamıyor

```bash
# Logları kontrol et
pm2 logs lila-menu-api --err

# Veritabanı bağlantısını test et
cd /var/www/vhosts/yourdomain.com/httpdocs/server
node server.js  # Manuel başlatma

# Port kullanımda mı?
netstat -tuln | grep 3000
```

### 502 Bad Gateway

```bash
# PM2 durumunu kontrol et
pm2 status

# Backend çalışıyor mu?
pm2 restart lila-menu-api

# Nginx loglarını kontrol et
tail -f /var/log/nginx/error.log
```

### Veritabanı Bağlantı Hatası

- `.env` dosyasındaki bilgileri kontrol edin
- MSSQL Server firewall ayarlarını kontrol edin
- IP whitelist'e sunucu IP'sini ekleyin

### E-posta Gönderilmiyor

- SMTP bilgilerini kontrol edin
- Gmail için App Password kullanın
- Firewall SMTP portunu engelliyor mu? (587, 465)

## 📊 Monitoring ve Analytics

### PM2 Dashboard (Web Interface)

```bash
pm2 install pm2-server-monit
```

### Uptime Monitoring

- UptimeRobot.com
- Pingdom
- StatusCake

### Error Tracking

- Sentry.io entegrasyonu önerilir

## 🔐 Güvenlik Önerileri

1. **Firewall**: Sadece gerekli portları açın (80, 443, SSH)
2. **SSH**: Key-based authentication kullanın
3. **Database**: IP whitelist kullanın
4. **Secrets**: `.env` dosyalarını asla commit etmeyin
5. **Updates**: Düzenli güvenlik güncellemeleri yapın
6. **Backups**: Günlük otomatik yedekleme ayarlayın

## 📝 Checklist

- [ ] Node.js ve PM2 kuruldu
- [ ] Proje dosyaları sunucuya yüklendi
- [ ] MSSQL veritabanı oluşturuldu ve şema yüklendi
- [ ] Backend `.env` yapılandırıldı
- [ ] PM2 ile backend başlatıldı
- [ ] Frontend build alındı
- [ ] Build dosyları web root'a kopyalandı
- [ ] Nginx yapılandırması eklendi
- [ ] SSL sertifikası kuruldu
- [ ] HTTPS yönlendirmesi aktif
- [ ] API ve frontend test edildi
- [ ] E-posta gönderimi test edildi
- [ ] PM2 autostart ayarlandı

## 🎉 Tamamlandı!

Uygulamanız artık canlıda!

- Frontend: `https://yourdomain.com`
- API: `https://yourdomain.com/api`

---

**Destek**: support@lilagroup.com

