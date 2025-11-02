# 🐳 Docker Kurulum Rehberi - Plesk CentOS VDS

Bu rehber, Lila Group Menu projenizi **Plesk CentOS VDS** üzerinde **Docker** ile çalıştırmak için gerekli tüm adımları içerir.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Hazırlık](#hazırlık)
3. [Docker Kurulumu](#docker-kurulumu)
4. [Proje Kurulumu](#proje-kurulumu)
5. [Veritabanı Yapılandırması](#veritabanı-yapılandırması)
6. [Environment Variables](#environment-variables)
7. [Docker Container'ları Çalıştırma](#docker-containerları-çalıştırma)
8. [Plesk Nginx Yapılandırması](#plesk-nginx-yapılandırması)
9. [SSL Sertifikası](#ssl-sertifikası)
10. [Yönetim ve Bakım](#yönetim-ve-bakım)
11. [Sorun Giderme](#sorun-giderme)

---

## 🔧 Gereksinimler

### Sistem Gereksinimleri

- **CentOS 7/8** veya **AlmaLinux/Rocky Linux 8+**
- **Plesk Obsidian** veya **Plesk Onyx**
- **Root** veya **sudo** yetkisi
- En az **2 CPU core**
- En az **2GB RAM** (4GB önerilir)
- En az **10GB** disk alanı
- **MSSQL Server** (Azure SQL, AWS RDS, vb. - dış kaynak)

### Yazılım Gereksinimleri

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git** (projeyi klonlamak için)

---

## 🚀 Hazırlık

### 1. Plesk SSH Erişimi

Plesk Panel'den SSH erişimini etkinleştirin:

1. **Plesk Panel** → **Tools & Settings** → **SSH Access**
2. **SSH access enabled** işaretleyin
3. **Root shell** yetkisini verin

### 2. SSH ile Bağlanma

```bash
ssh root@your-server-ip
# veya
ssh your-username@your-server-ip
```

---

## 🐳 Docker Kurulumu

### CentOS/AlmaLinux/Rocky Linux için Docker Kurulumu

```bash
# Sistem paketlerini güncelle
sudo yum update -y

# Eski Docker versiyonlarını kaldır (varsa)
sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# Docker repository ekle
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Docker CE ve Docker Compose yükle
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker servisini başlat ve otomatik başlatmayı etkinleştir
sudo systemctl start docker
sudo systemctl enable docker

# Docker Compose'u kontrol et
docker compose version

# Docker'ın çalıştığını test et
sudo docker run hello-world
```

### Docker Compose V2 Kurulumu (Gerekirse)

```bash
# Eğer docker compose komutu çalışmazsa:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Alternatif olarak pip ile:
sudo yum install -y python3-pip
sudo pip3 install docker-compose
```

### Firewall Ayarları

```bash
# Docker network için firewall ayarları
sudo firewall-cmd --permanent --zone=public --add-masquerade
sudo firewall-cmd --reload

# Gerekli portları aç (80, 443, 3000 opsiyonel)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

---

## 📦 Proje Kurulumu

### 1. Projeyi Sunucuya Yükleme

#### Seçenek A: Git ile Klonlama

```bash
# Proje dizinine git
cd /var/www/vhosts/yourdomain.com/httpdocs

# Git repository'yi klonla
git clone https://github.com/yourusername/globalmenu.git .

# veya mevcut projeyi çek
git pull origin main
```

#### Seçenek B: FTP/SFTP ile Yükleme

```bash
# Proje dosyalarını /var/www/vhosts/yourdomain.com/httpdocs/ dizinine yükleyin
```

### 2. Proje Dizinine Geçme

```bash
cd /var/www/vhosts/yourdomain.com/httpdocs
# veya projenizin bulunduğu dizin
cd /path/to/globalmenu
```

### 3. Dosya İzinlerini Ayarlama

```bash
# Plesk kullanıcı izinleri
chown -R psacln:psacln .
chmod -R 755 .

# Uploads dizini için özel izinler
mkdir -p server/uploads server/temp
chmod -R 777 server/uploads server/temp
```

---

## 🗄️ Veritabanı Yapılandırması

### 1. MSSQL Veritabanı Hazırlama

Veritabanınızı hazırlayın:

1. **Azure SQL Database**, **AWS RDS**, veya başka bir **MSSQL Server** kullanın
2. Veritabanı oluşturun: `LilaGroupMenu`
3. Kullanıcı ve şifre oluşturun
4. **Firewall** ayarlarında **Plesk sunucu IP'sini** whitelist'e ekleyin

### 2. Veritabanı Şemasını Yükleme

**Azure Data Studio** veya **SSMS** ile bağlanıp:

1. `server/database/schema.sql` dosyasını çalıştırın
2. `server/database/seed.sql` dosyasını çalıştırın (opsiyonel - örnek veriler için)

```bash
# veya komut satırından (sqlcmd gerekli):
sqlcmd -S yourserver.database.windows.net -d LilaGroupMenu -U sqladmin -P 'YourPassword' -i server/database/schema.sql
```

---

## ⚙️ Environment Variables

### 1. .env Dosyası Oluşturma

```bash
# Proje kök dizininde
cp .env.example .env
nano .env
```

### 2. .env Dosyasını Düzenleme

Aşağıdaki değerleri kendi bilgilerinizle değiştirin:

```env
# Server Ayarları
NODE_ENV=production
PORT=3000

# MSSQL Veritabanı
DB_SERVER=yourserver.database.windows.net
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=sqladmin
DB_PASSWORD=YourPassword123!
DB_ENCRYPT=true

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lilagroup.com
EMAIL_TO=orders@lilagroup.com

# CORS - Domain'inizi yazın
CORS_ORIGIN=https://yourdomain.com

# Frontend API URL (Docker içinde relative path)
VITE_API_URL=/api

# Payment (Vakıf Bankası)
PAYMENT_ENVIRONMENT=production
VAKIF_MERCHANT_ID=your_merchant_id
VAKIF_MERCHANT_PASSWORD=your_merchant_password
VAKIF_TERMINAL_NO=your_terminal_no
PAYMENT_SUCCESS_URL=https://yourdomain.com/payment/success
PAYMENT_FAILURE_URL=https://yourdomain.com/payment/failure
```

**⚠️ ÖNEMLİ:** `.env` dosyasını Git'e commit etmeyin! Zaten `.gitignore`'da olmalı.

---

## 🚀 Docker Container'ları Çalıştırma

### 1. Docker Image'ları Build Etme

```bash
# Proje kök dizininde
docker compose build

# Veya sadece backend için:
docker compose build backend

# Veya sadece frontend için:
docker compose build frontend
```

### 2. Container'ları Başlatma

```bash
# Tüm servisleri başlat (detached mode - arka planda)
docker compose up -d

# Logları izle
docker compose logs -f

# Sadece backend logları
docker compose logs -f backend

# Sadece frontend logları
docker compose logs -f frontend
```

### 3. Container Durumunu Kontrol Etme

```bash
# Çalışan container'ları listele
docker compose ps

# Detaylı bilgi
docker ps

# Container logları
docker compose logs backend
docker compose logs frontend
```

### 4. Container'ları Durdurma

```bash
# Tüm container'ları durdur
docker compose down

# Container'ları durdur ve volume'leri de sil (dikkatli!)
docker compose down -v
```

### 5. Container'ları Yeniden Başlatma

```bash
# Yeniden build etmeden yeniden başlat
docker compose restart

# Tüm servisleri yeniden build et ve başlat
docker compose up -d --build
```

---

## 🔧 Plesk Nginx Yapılandırması

### 1. Plesk Panel'den Nginx Ayarları

1. **Plesk Panel** → **Websites & Domains** → Domain'inizi seçin
2. **Apache & nginx Settings** → **nginx Settings**
3. **Additional nginx directives** bölümüne aşağıdakini ekleyin:

```nginx
# Docker backend'e proxy (localhost:3000 yerine docker network kullanılacak)
# ÖNEMLİ: Docker compose kullanıyorsanız, backend servis adı 'backend' olacak
# Plesk dışından erişim için localhost:3000 kullanın

# API proxy
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeout ayarları
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
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
    proxy_buffering off;
    proxy_cache off;
}

# Upload dosyaları için proxy
location /uploads/ {
    proxy_pass http://127.0.0.1:3000/uploads/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

### 2. Alternatif: Plesk'in Kendi Web Root'unu Kullanma

Eğer Docker'daki frontend yerine Plesk'in kendi web root'unu kullanmak istiyorsanız:

```bash
# Frontend build dosyalarını Plesk web root'una kopyala
docker compose exec frontend cat /usr/share/nginx/html/index.html
# veya build dosyalarını container'dan çıkar:
docker compose cp frontend:/usr/share/nginx/html /var/www/vhosts/yourdomain.com/public_html
```

---

## 🔒 SSL Sertifikası

### 1. Let's Encrypt SSL Kurulumu (Plesk)

1. **Plesk Panel** → **Websites & Domains** → Domain'inizi seçin
2. **SSL/TLS Settings**
3. **Let's Encrypt** → **Install** → **Get it free**
4. Domain doğrulamasını tamamlayın
5. **Secure the site with SSL/TLS** işaretleyin

### 2. HTTP'den HTTPS'e Yönlendirme

Plesk'in **Hosting Settings** bölümünden **Permanent SEO-safe 301 redirect from HTTP to HTTPS** seçeneğini işaretleyin.

---

## 🔄 Yönetim ve Bakım

### 1. Logları İzleme

```bash
# Tüm servislerin logları
docker compose logs -f

# Son 100 satır
docker compose logs --tail=100

# Belirli bir servis
docker compose logs -f backend
docker compose logs -f frontend
```

### 2. Container'ları Yeniden Başlatma

```bash
# Sadece backend
docker compose restart backend

# Sadece frontend
docker compose restart frontend

# Tüm servisler
docker compose restart
```

### 3. Kod Güncellemesi

```bash
# Git'ten çek
git pull origin main

# Container'ları yeniden build et ve başlat
docker compose up -d --build

# Veya sadece backend'i yeniden build et
docker compose up -d --build backend
```

### 4. Veritabanı Yedekleme

```bash
# MSSQL için Azure Portal veya AWS RDS Console'dan yedekleme yapın
# veya sqlcmd ile:
sqlcmd -S yourserver.database.windows.net -d LilaGroupMenu -U sqladmin -P 'YourPassword' -Q "BACKUP DATABASE LilaGroupMenu TO DISK='/backup/lila-$(date +%Y%m%d).bak'"
```

### 5. Upload Dosyalarını Yedekleme

```bash
# Uploads dizinini yedekle
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz server/uploads/

# Yedekten geri yükle
tar -xzf uploads-backup-20240101.tar.gz
```

### 6. Disk Temizliği

```bash
# Kullanılmayan Docker image'ları temizle
docker system prune -a

# Sadece durdurulmuş container'ları temizle
docker container prune

# Kullanılmayan volume'leri temizle
docker volume prune
```

---

## 🐛 Sorun Giderme

### 1. Container'lar Başlamıyor

```bash
# Logları kontrol et
docker compose logs

# Container durumunu kontrol et
docker compose ps

# Port çakışması var mı kontrol et
sudo netstat -tulpn | grep -E ':(80|3000)'

# Docker daemon çalışıyor mu?
sudo systemctl status docker
```

### 2. Backend Bağlanmıyor

```bash
# Backend container'ına gir
docker compose exec backend sh

# İçeride test et
node -e "require('./config/database.js').getConnection().then(() => console.log('OK')).catch(err => console.error(err))"

# Port dinleniyor mu?
docker compose exec backend netstat -tulpn | grep 3000
```

### 3. Frontend Build Hatası

```bash
# Frontend container'ını yeniden build et
docker compose build --no-cache frontend

# Build loglarını kontrol et
docker compose logs frontend
```

### 4. Veritabanı Bağlantı Hatası

```bash
# .env dosyasını kontrol et
cat .env | grep DB_

# Firewall ayarlarını kontrol et
# Azure SQL için: Azure Portal → SQL Database → Firewall → Plesk IP ekli mi?

# Bağlantıyı test et
docker compose exec backend node -e "require('./config/database.js').getConnection().then(() => console.log('✅ Bağlantı başarılı!')).catch(err => console.error('❌ Hata:', err.message))"
```

### 5. Nginx 502 Bad Gateway

```bash
# Backend container'ı çalışıyor mu?
docker compose ps backend

# Backend loglarını kontrol et
docker compose logs backend

# Port 3000'e doğrudan erişim var mı?
curl http://localhost:3000/api/health
```

### 6. Upload Dosyaları Kaydedilmiyor

```bash
# Uploads dizini izinlerini kontrol et
ls -la server/uploads/

# İzinleri düzelt
chmod -R 777 server/uploads server/temp
chown -R psacln:psacln server/uploads server/temp
```

### 7. Memory/CPU Kullanımı Yüksek

```bash
# Container kaynak kullanımını izle
docker stats

# Memory limit ekle (docker-compose.yml'de)
# backend:
#   mem_limit: 1g
#   memswap_limit: 1g
```

---

## 📝 Önemli Notlar

1. **Güvenlik:**
   - `.env` dosyasını asla Git'e commit etmeyin
   - Production'da `CORS_ORIGIN` mutlaka domain'inizi yazın
   - SSL sertifikası kullanın
   - Firewall kurallarını sıkılaştırın

2. **Performans:**
   - Production'da `NODE_ENV=production` kullanın
   - Frontend build dosyalarını CDN'e alabilirsiniz
   - Database connection pool ayarlarını optimize edin

3. **Yedekleme:**
   - Veritabanını düzenli yedekleyin
   - Upload dosyalarını yedekleyin
   - `.env` dosyasını güvenli bir yerde saklayın

4. **Monitoring:**
   - Docker loglarını düzenli kontrol edin
   - Health check endpoint'lerini izleyin
   - Disk alanını kontrol edin

---

## 🎯 Hızlı Başlangıç Komutları

```bash
# İlk kurulum
docker compose build
docker compose up -d
docker compose logs -f

# Güncelleme
git pull
docker compose up -d --build

# Yeniden başlatma
docker compose restart

# Durdurma
docker compose down

# Loglar
docker compose logs -f backend

# Container'a gir
docker compose exec backend sh
```

---

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `docker compose logs`
2. Bu rehberi tekrar gözden geçirin
3. Veritabanı bağlantısını test edin
4. Firewall ayarlarını kontrol edin

---

**Başarılar! 🚀**
