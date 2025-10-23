# 🐳 Plesk Docker Kurulum Rehberi

Bu rehber, Lila Group Menu projesini **Plesk Panel'de Docker** kullanarak tek container'da çalıştırmak için gerekli adımları içerir.

> 🎯 **AVANTAJLAR**: Tek container, kolay yönetim, otomatik restart, resource kontrolü, izolasyon

## 📋 Sistem Gereksinimleri

- **OS**: CentOS 7/8/9
- **Plesk**: 18.x veya üzeri (Docker Extension ile)
- **Docker**: 20.x veya üzeri
- **Docker Compose**: 2.x veya üzeri
- **MSSQL**: Harici veritabanı (mevcut)

## 🔧 1. Plesk'te Docker Kurulumu

### Docker Extension Kurulumu

1. **Plesk Panel**'e giriş yapın
2. **Tools & Settings** > **Updates & Upgrades**
3. **Add/Remove Components** > **Docker** seçin
4. **Install** butonuna tıklayın

### Docker Servisini Başlat

```bash
# SSH ile sunucuya bağlanın
sudo systemctl start docker
sudo systemctl enable docker

# Docker versiyonunu kontrol edin
docker --version
docker-compose --version
```

## 📁 2. Proje Kurulumu

### Plesk'te Domain Ayarları

1. **Websites & Domains** > **menu.lilaglobal.com.tr**
2. **Hosting Settings** bölümüne gidin
3. **Document Root**: `/var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr` (zaten mevcut)
4. **Hosting Type**: Physical hosting olarak ayarlayın

### Proje Dosyalarını Kontrol Et

```bash
# Mevcut proje dizinine git
cd /var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr

# Mevcut dosyaları kontrol et
ls -la

# Eğer proje dosyaları yoksa Git ile klonla
# git clone https://github.com/metehanbayar/lila_app.git .

# Dosya izinlerini ayarla
chown -R psacln:psacln /var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr
chmod -R 755 /var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr
```

## 🗄️ 3. Environment Konfigürasyonu

### .env Dosyası Oluştur

```bash
cd /var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr/server
cp .env.example .env
nano .env
```

Aşağıdaki içeriği ekleyin:

```env
# Database Configuration
DB_SERVER=your-mssql-server.com
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=your-username
DB_PASSWORD=your-password
DB_ENCRYPT=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# SMS Configuration
SMS_API_KEY=your-sms-api-key

# Email Configuration
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password

# Environment
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://menu.lilaglobal.com.tr

# Docker için özel ayarlar
UPLOAD_PATH=/app/server/uploads
LOG_PATH=/app/logs
```

## 🐳 4. Docker Container Oluşturma

### Docker Image Build Et

```bash
cd /var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr

# Docker image'ı build et
docker build -t lila-group-menu:latest .

# Image'ı kontrol et
docker images | grep lila-group-menu
```

### Docker Compose ile Çalıştır

```bash
# Docker Compose ile başlat
docker-compose up -d

# Container durumunu kontrol et
docker-compose ps

# Logları görüntüle
docker-compose logs -f
```

### Manuel Container Çalıştırma (Alternatif)

```bash
# Container'ı manuel olarak çalıştır
docker run -d \
  --name lila-group-menu-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file ./server/.env \
  -v $(pwd)/server/uploads:/app/server/uploads \
  -v $(pwd)/logs:/app/logs \
  lila-group-menu:latest

# Container durumunu kontrol et
docker ps | grep lila-group-menu
```

## 🌐 5. Nginx Konfigürasyonu

### Plesk'te Nginx Ayarları

1. **Websites & Domains** > **menu.lilaglobal.com.tr** > **Hosting Settings**
2. **Document Root**'u `/var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr/client/dist` olarak ayarlayın
3. **Additional nginx directives** bölümüne `docker-nginx.conf` dosyasının içeriğini ekleyin

## 🔒 6. SSL Sertifikası

```bash
# Plesk Panel'de SSL kurulumu
# Websites & Domains > menu.lilaglobal.com.tr > SSL/TLS Certificates
# Let's Encrypt ile ücretsiz sertifika alın
```

## 🚀 7. Servis Yönetimi

### Docker Compose Komutları

```bash
# Servisi başlat
docker-compose up -d

# Servisi durdur
docker-compose down

# Servisi yeniden başlat
docker-compose restart

# Logları görüntüle
docker-compose logs -f lila-group-menu

# Container'a bağlan
docker-compose exec lila-group-menu sh
```

### Manuel Docker Komutları

```bash
# Container'ı başlat
docker start lila-group-menu-app

# Container'ı durdur
docker stop lila-group-menu-app

# Container'ı yeniden başlat
docker restart lila-group-menu-app

# Container'ı sil
docker rm -f lila-group-menu-app

# Logları görüntüle
docker logs -f lila-group-menu-app
```

## 🔍 8. Monitoring ve Kontrol

### Container Durumu

```bash
# Çalışan container'ları listele
docker ps

# Container detayları
docker inspect lila-group-menu-app

# Resource kullanımı
docker stats lila-group-menu-app

# Health check
curl http://localhost:3000/health
```

### Log Yönetimi

```bash
# Container logları
docker logs lila-group-menu-app

# Son 100 satır
docker logs --tail 100 lila-group-menu-app

# Gerçek zamanlı loglar
docker logs -f lila-group-menu-app

# Log dosyaları
tail -f /var/www/vhosts/lilamenu.yourdomain.com/httpdocs/logs/app.log
```

## 🔄 9. Güncelleme Süreci

### Kod Güncelleme

```bash
cd /var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr

# Yeni kod çek
git pull origin main

# Yeni image build et
docker build -t lila-group-menu:latest .

# Eski container'ı durdur
docker-compose down

# Yeni container'ı başlat
docker-compose up -d

# Eski image'ları temizle
docker image prune -f
```

### Otomatik Güncelleme Script

```bash
# Güncelleme script'i oluştur
nano update.sh
```

```bash
#!/bin/bash
echo "🔄 Lila Group Menu güncelleniyor..."

# Proje dizinine git
cd /var/www/vhosts/lilaglobal.com.tr/menu.lilaglobal.com.tr

# Yeni kod çek
echo "📥 Kod güncelleniyor..."
git pull origin main

# Yeni image build et
echo "🔨 Docker image build ediliyor..."
docker build -t lila-group-menu:latest .

# Eski container'ı durdur
echo "⏹️ Eski container durduruluyor..."
docker-compose down

# Yeni container'ı başlat
echo "🚀 Yeni container başlatılıyor..."
docker-compose up -d

# Eski image'ları temizle
echo "🧹 Eski image'lar temizleniyor..."
docker image prune -f

echo "✅ Güncelleme tamamlandı!"
```

```bash
# Script'i çalıştırılabilir yap
chmod +x update.sh

# Çalıştır
./update.sh
```

## 🛡️ 10. Güvenlik ve Optimizasyon

### Resource Limits

```bash
# Memory limit ayarla
docker update --memory=1g --memory-swap=1g lila-group-menu-app

# CPU limit ayarla
docker update --cpus="1.0" lila-group-menu-app
```

### Backup Script

```bash
# Backup script'i oluştur
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/lila-group-menu"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup dizini oluştur
mkdir -p $BACKUP_DIR

# Container'ı durdur
docker-compose down

# Uploads dizinini yedekle
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz server/uploads/

# Logs dizinini yedekle
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz logs/

# Container'ı tekrar başlat
docker-compose up -d

echo "✅ Backup tamamlandı: $BACKUP_DIR"
```

## 📊 11. Plesk Panel Entegrasyonu

### Scheduled Tasks

1. **Tools & Settings** > **Scheduled Tasks**
2. **Add Task** > **Custom Script**
3. Backup script'ini günlük çalıştır

### File Manager

- Plesk File Manager ile dosyalara erişim
- Upload dizinini yönetme
- Log dosyalarını görüntüleme

## 🚨 Sorun Giderme

### Yaygın Sorunlar

1. **Container başlamıyor**:
   ```bash
   docker logs lila-group-menu-app
   ```

2. **Port çakışması**:
   ```bash
   netstat -tlnp | grep :3000
   ```

3. **Memory yetersiz**:
   ```bash
   free -h
   docker stats
   ```

4. **Permission hatası**:
   ```bash
   chown -R psacln:psacln /var/www/vhosts/lilamenu.yourdomain.com/httpdocs
   ```

## 📝 Avantajlar

- ✅ **Tek Container**: Tüm uygulama tek yerde
- ✅ **Otomatik Restart**: Container crash olursa otomatik başlar
- ✅ **Resource Control**: Memory ve CPU limitleri
- ✅ **Kolay Yönetim**: Docker Compose ile basit komutlar
- ✅ **İzolasyon**: Diğer uygulamalardan bağımsız
- ✅ **Kolay Backup**: Volume'lar ile veri korunur
- ✅ **Plesk Entegrasyonu**: Panel üzerinden yönetim

Bu rehberi takip ederek projenizi Plesk'te Docker ile başarıyla çalıştırabilirsiniz! 🐳🎉
