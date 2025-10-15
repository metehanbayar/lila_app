# 🖥️ Backend Deployment - Kendi Sunucunuzda

Backend'i kendi Windows/Linux sunucunuzda çalıştırmak için basit kurulum.

---

## 🪟 Windows Sunucu (En Kolay)

### Adım 1: Node.js Kurulumu
1. [nodejs.org](https://nodejs.org) adresinden **Node.js 18 LTS** indirin
2. Kurulumu tamamlayın

### Adım 2: Proje Dosyaları
Sunucunuza proje klasörünü kopyalayın (örn: `C:\inetpub\globalmenu`)

### Adım 3: Backend Bağımlılıkları
PowerShell veya CMD açın:

```powershell
cd C:\inetpub\globalmenu\server
npm install --production
```

### Adım 4: .env Dosyası
`server\.env` dosyası oluşturun:

```env
PORT=3000
NODE_ENV=production

# MSSQL Database (Local/Remote)
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
DB_ENCRYPT=false

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lilagroup.com
EMAIL_TO=orders@lilagroup.com

# CORS - Vercel domain'inizi buraya ekleyin
CORS_ORIGIN=https://your-project.vercel.app
```

### Adım 5: Veritabanı Setup
SQL Server Management Studio (SSMS) ile:

```sql
-- server/database/schema.sql dosyasını çalıştırın
-- server/database/seed.sql dosyasını çalıştırın (örnek veri için)
```

### Adım 6: Windows Service Olarak Çalıştırma

**pm2-installer** kullanarak (önerilen):

```powershell
# PM2 global kurulum
npm install -g pm2
npm install -g pm2-windows-service

# PM2 Windows Service kurulumu
pm2-service-install

# Backend'i başlat
cd C:\inetpub\globalmenu\server
pm2 start server.js --name "lila-menu-api"
pm2 save

# Durum kontrolü
pm2 status
pm2 logs lila-menu-api
```

**Veya node-windows ile**:

`server/install-service.js` dosyası oluşturun:

```javascript
import Service from 'node-windows';
const { Service: WindowsService } = Service;

const svc = new WindowsService({
  name: 'Lila Menu API',
  description: 'Lila Group Menu Backend API Service',
  script: 'C:\\inetpub\\globalmenu\\server\\server.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

svc.on('install', function(){
  svc.start();
});

svc.install();
```

Çalıştır:
```powershell
node install-service.js
```

### Adım 7: Firewall
Windows Firewall'da port 3000'i açın:

```powershell
netsh advfirewall firewall add rule name="Lila Menu API" dir=in action=allow protocol=TCP localport=3000
```

### Adım 8: IIS Reverse Proxy (Opsiyonel)

Eğer IIS kullanıyorsanız, subdomain için reverse proxy:

1. IIS Manager'ı açın
2. **URL Rewrite** modülünü yükleyin
3. Yeni bir site oluşturun: `api.yourdomain.com`
4. **URL Rewrite** rules ekleyin:

```xml
<rewrite>
  <rules>
    <rule name="ReverseProxyInboundRule" stopProcessing="true">
      <match url="(.*)" />
      <action type="Rewrite" url="http://localhost:3000/{R:1}" />
    </rule>
  </rules>
</rewrite>
```

---

## 🐧 Linux Sunucu (Ubuntu/CentOS)

### Adım 1: Node.js Kurulumu

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### Adım 2: Proje Dosyaları

```bash
cd /var/www
git clone https://github.com/yourusername/globalmenu.git
cd globalmenu/server
npm install --production
```

### Adım 3: .env Dosyası

Yukarıdaki .env dosyasını oluşturun.

### Adım 4: PM2 ile Çalıştırma

```bash
# PM2 kurulumu
sudo npm install -g pm2

# Backend başlat
cd /var/www/globalmenu/server
pm2 start server.js --name "lila-menu-api"

# Sistem başlangıcında otomatik başlat
pm2 startup systemd
pm2 save

# Status
pm2 status
pm2 logs lila-menu-api
```

### Adım 5: Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/api.yourdomain.com
```

İçerik:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifleştir:

```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Adım 6: SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## ✅ Test

### Backend Test

```bash
# Windows
curl http://localhost:3000/api/health

# Linux
curl http://api.yourdomain.com/api/health
```

Başarılı yanıt:
```json
{
  "status": "OK",
  "message": "Lila Group Menu API çalışıyor"
}
```

---

## 🔄 Güncelleme

### Windows
```powershell
cd C:\inetpub\globalmenu\server
git pull  # veya dosyaları kopyalayın
npm install --production
pm2 restart lila-menu-api
```

### Linux
```bash
cd /var/www/globalmenu/server
git pull
npm install --production
pm2 restart lila-menu-api
```

---

## 📊 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Loglar
pm2 logs lila-menu-api --lines 100

# Hata logları
pm2 logs lila-menu-api --err

# Restart
pm2 restart lila-menu-api

# Stop
pm2 stop lila-menu-api
```

---

## 🎉 Tamamlandı!

Backend API'niz şu adreste çalışıyor:
- Local: `http://localhost:3000/api`
- Public: `http://api.yourdomain.com/api` (Nginx/IIS ile)

Artık Vercel'deki frontend bu API'yi kullanabilir!

