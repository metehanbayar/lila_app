# 🚀 CentOS Plesk Multi-Hosting VDS Kurulum Rehberi

Bu rehber, Lila Group Menu projesini **multi-hosting** CentOS Plesk VDS'nizde ayağa kaldırmak için gerekli adımları içerir.

> ⚠️ **ÖNEMLİ**: Bu VDS'de birden fazla domain barındırıldığı için, projenizi diğer siteleri etkilemeyecek şekilde yapılandıracağız.

## 📋 Sistem Gereksinimleri

- **OS**: CentOS 7/8/9
- **Plesk**: 18.x veya üzeri (Multi-hosting)
- **Node.js**: 18.x veya üzeri
- **Nginx**: 1.18+ (Plesk ile birlikte gelir)
- **PM2**: Process Manager (kurulacak)
- **MSSQL**: Harici veritabanı (mevcut)
- **Port**: 3000 (diğer uygulamalarla çakışmaması için)

## 🔧 1. Sistem Hazırlığı

### Node.js Kurulumu

```bash
# NodeSource repository ekle
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# Node.js kur
sudo yum install -y nodejs

# Versiyon kontrolü
node --version
npm --version
```

### PM2 Kurulumu

```bash
# PM2'yi global olarak kur
sudo npm install -g pm2

# PM2'yi sistem servisi olarak ayarla
sudo pm2 startup
```

## 📁 2. Proje Kurulumu

### Plesk'te Yeni Domain Oluştur

1. **Plesk Panel**'e giriş yapın
2. **Websites & Domains** > **Add Domain**
3. Domain adını girin (örn: `lilamenu.yourdomain.com` veya `menu.yourdomain.com`)
4. **Hosting Type**: Physical hosting seçin
5. **Document Root**: `/var/www/vhosts/lilamenu.yourdomain.com/httpdocs` olarak ayarlayın

### Proje Dosyalarını Yükle

```bash
# Yeni oluşturulan domain dizinine git
cd /var/www/vhosts/lilamenu.yourdomain.com/httpdocs

# Git ile klonla (eğer repo varsa)
git clone https://github.com/yourusername/globalmenu.git .

# Veya dosyaları manuel olarak yükle
# Dosya izinlerini ayarla
chown -R psacln:psacln /var/www/vhosts/lilamenu.yourdomain.com/httpdocs
chmod -R 755 /var/www/vhosts/lilamenu.yourdomain.com/httpdocs
```

### Bağımlılıkları Yükle

```bash
# Root dizinde
npm install

# Client bağımlılıkları
cd client
npm install

# Server bağımlılıkları
cd ../server
npm install

# Uploads dizini oluştur ve izinleri ayarla
mkdir -p /var/www/vhosts/lilamenu.yourdomain.com/httpdocs/server/uploads
chown -R psacln:psacln /var/www/vhosts/lilamenu.yourdomain.com/httpdocs/server/uploads
chmod -R 755 /var/www/vhosts/lilamenu.yourdomain.com/httpdocs/server/uploads
```

## 🗄️ 3. Veritabanı Konfigürasyonu

### Environment Dosyası Oluştur

```bash
# Server dizininde .env dosyası oluştur
cd /var/www/vhosts/lilamenu.yourdomain.com/httpdocs/server
cp .env.example .env
```

### .env Dosyasını Düzenle

```bash
nano .env
```

Aşağıdaki içeriği ekleyin (domain adınızı değiştirin):

```env
# Database Configuration
DB_SERVER=your-mssql-server.com
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=your-username
DB_PASSWORD=your-password
DB_ENCRYPT=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# SMS Configuration
SMS_API_KEY=your-sms-api-key

# Email Configuration
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password

# Environment
NODE_ENV=development
PORT=3000
CORS_ORIGIN=https://lilamenu.yourdomain.com

# File Upload Path (Multi-hosting için özel)
UPLOAD_PATH=/var/www/vhosts/lilamenu.yourdomain.com/httpdocs/server/uploads

# Security (Multi-hosting için önemli)
HELMET_ENABLED=true
TRUST_PROXY=true
```

## 🏗️ 4. Frontend Build

```bash
# Client dizininde build yap
cd /var/www/vhosts/lilamenu.yourdomain.com/httpdocs/client
npm run build

# Build dosyalarının izinlerini ayarla
chown -R psacln:psacln /var/www/vhosts/lilamenu.yourdomain.com/httpdocs/client/dist
chmod -R 755 /var/www/vhosts/lilamenu.yourdomain.com/httpdocs/client/dist
```

## 🌐 5. Nginx Konfigürasyonu

### Plesk'te Domain Ayarları

1. **Plesk Panel**'e giriş yapın
2. **Websites & Domains** > **lilamenu.yourdomain.com** > **Hosting Settings**
3. **Document Root**'u `/var/www/vhosts/lilamenu.yourdomain.com/httpdocs/client/dist` olarak ayarlayın
4. **Additional nginx directives** bölümüne aşağıdaki konfigürasyonu ekleyin:

> ⚠️ **ÖNEMLİ**: Bu konfigürasyon sadece bu domain için geçerlidir, diğer siteleri etkilemez.

```nginx
# API proxy
location /api/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# Socket.IO proxy
location /socket.io/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Static files caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

## ⚙️ 6. PM2 Konfigürasyonu

### PM2 Ecosystem Dosyası Oluştur

```bash
cd /var/www/vhosts/lilamenu.yourdomain.com/httpdocs
nano ecosystem.config.js
```

Aşağıdaki içeriği ekleyin:

```javascript
module.exports = {
  apps: [{
    name: 'lila-group-menu-server',
    script: './server/server.js',
    cwd: '/var/www/vhosts/lilamenu.yourdomain.com/httpdocs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/lila-group-menu-error.log',
    out_file: '/var/log/pm2/lila-group-menu-out.log',
    log_file: '/var/log/pm2/lila-group-menu-combined.log',
    time: true,
    
    // Multi-hosting için özel ayarlar
    exec_mode: 'fork',
    node_args: '--max-old-space-size=1024',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
```

### PM2 Log Dizini Oluştur

```bash
# PM2 log dizini oluştur
sudo mkdir -p /var/log/pm2
sudo chown -R root:root /var/log/pm2
sudo chmod 755 /var/log/pm2
```

### PM2 Servisini Başlat

```bash
# PM2 ile uygulamayı başlat
pm2 start ecosystem.config.js

# PM2'yi kaydet
pm2 save

# PM2 durumunu kontrol et
pm2 status
```

## 🔒 7. SSL Sertifikası (Opsiyonel)

Plesk'te SSL sertifikası kurulumu:

1. **Websites & Domains** > **lilamenu.yourdomain.com** > **SSL/TLS Certificates**
2. **Let's Encrypt** ile ücretsiz sertifika alın
3. **Force HTTPS** seçeneğini aktifleştirin

> ⚠️ **NOT**: SSL sertifikası sadece bu domain için geçerli olacak, diğer sitelerinizi etkilemez.

## 🚀 8. Servisleri Başlat

```bash
# PM2 servislerini başlat
pm2 start all

# Sistem yeniden başlatıldığında otomatik başlatma
pm2 startup
pm2 save

# Logları kontrol et
pm2 logs lila-group-menu-server
```

## 🔍 9. Test ve Kontrol

### Port Kontrolü

```bash
# 3000 portunun dinlendiğini kontrol et
netstat -tlnp | grep :3000

# Nginx durumunu kontrol et
systemctl status nginx
```

### Log Kontrolü

```bash
# PM2 logları
pm2 logs

# Nginx error logları
tail -f /var/log/nginx/error.log

# Plesk logları
tail -f /var/log/plesk/panel.log
```

## 🛠️ 10. Sorun Giderme

### Yaygın Sorunlar

1. **Port 3000 kullanımda**: `lsof -i :3000` ile kontrol edin
2. **Permission hatası**: Dosya izinlerini kontrol edin
3. **Database bağlantı hatası**: .env dosyasındaki veritabanı bilgilerini kontrol edin

### Log Dosyaları

```bash
# PM2 logları
pm2 logs lila-group-menu-server --lines 100

# Nginx logları
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 📊 11. Monitoring

### PM2 Monitoring

```bash
# PM2 monit arayüzü
pm2 monit

# Sistem kaynak kullanımı
pm2 show lila-group-menu-server
```

### Otomatik Restart

```bash
# Memory limit aşımında restart
pm2 start ecosystem.config.js --max-memory-restart 1G

# Crash durumunda otomatik restart
pm2 start ecosystem.config.js --autorestart
```

## 🔄 12. Güncelleme Süreci

```bash
# Proje dizinine git
cd /var/www/vhosts/lilamenu.yourdomain.com/httpdocs

# Yeni kod çek
git pull origin main

# Bağımlılıkları güncelle
npm run install-all

# Frontend'i yeniden build et
cd client && npm run build

# Dosya izinlerini ayarla
chown -R psacln:psacln /var/www/vhosts/lilamenu.yourdomain.com/httpdocs
chmod -R 755 /var/www/vhosts/lilamenu.yourdomain.com/httpdocs

# PM2'yi restart et
pm2 restart lila-group-menu-server
```

## 🛡️ 13. Multi-Hosting Güvenlik Önlemleri

### Port Kontrolü

```bash
# Kullanılan portları kontrol et
netstat -tlnp | grep :3000

# Diğer Node.js uygulamaları kontrol et
ps aux | grep node
```

### Firewall Ayarları

```bash
# Sadece localhost'tan erişime izin ver
iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP
```

### Resource Monitoring

```bash
# PM2 monitoring
pm2 monit

# Sistem kaynak kullanımı
pm2 show lila-group-menu-server

# Memory kullanımı
free -h
```

## 📝 Multi-Hosting Notlar

- ✅ **İzolasyon**: Her domain kendi dizininde çalışır
- ✅ **Port Güvenliği**: Sadece localhost'tan erişim
- ✅ **Dosya İzinleri**: Plesk kullanıcı izinleri korunur
- ✅ **SSL**: Her domain için ayrı sertifika
- ✅ **Loglar**: Ayrı log dosyaları
- ✅ **PM2**: Diğer uygulamalardan bağımsız çalışma

## 🚨 Önemli Uyarılar

1. **Port Çakışması**: 3000 portu kullanımda ise farklı port seçin
2. **Memory Limit**: VDS kaynaklarını kontrol edin
3. **Domain Ayarları**: Sadece kendi domain'inizi düzenleyin
4. **Backup**: Düzenli backup alın

Bu rehberi takip ederek projenizi **multi-hosting** CentOS Plesk VDS'nizde güvenle çalıştırabilirsiniz! 🎉
