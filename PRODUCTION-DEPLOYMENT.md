# 🚀 Production Deployment Rehberi

## 1️⃣ Build Alma

```bash
cd client
npm run build
```

Bu komut `client/dist` klasöründe production build'i oluşturur.

## 2️⃣ Firewall Kontrolü

Port 5173'ün açık olduğundan emin olun:

```bash
# CentOS/RHEL
sudo firewall-cmd --list-ports
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload

# Ubuntu/Debian
sudo ufw status
sudo ufw allow 5173/tcp
sudo ufw reload
```

## 3️⃣ Nginx ile Production Build Serve Etme

### Option A: Nginx Reverse Proxy (Önerilen)

Nginx'i dev server yerine build edilmiş dosyaları serve edecek şekilde yapılandırın:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 78.135.105.136; # veya domain adınız
    
    # Build edilmiş dosyaların bulunduğu klasör
    root /path/to/globalmenu/client/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # React Router için SPA desteği
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy - Backend'e yönlendirme
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
    
    # Uploads proxy
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_buffering off;
    }
}
```

### Option B: PM2 + serve (Alternatif)

```bash
# serve paketini global yükleyin
npm install -g serve

# Build edilmiş dosyaları serve edin
cd client/dist
serve -s . -l 5173
```

## 4️⃣ SSL/HTTPS Kurulumu (Opsiyonel)

Certbot ile ücretsiz SSL sertifikası:

```bash
sudo certbot --nginx -d yourdomain.com
```

## 5️⃣ Kontrol Listesi

- [ ] `client/dist` klasöründe build dosyaları var mı?
- [ ] Nginx konfigürasyonu doğru mu?
- [ ] Port 80/443 firewall'da açık mı?
- [ ] Backend server (port 3000) çalışıyor mu?
- [ ] Nginx yeniden başlatıldı mı? (`sudo systemctl reload nginx`)

## 🔍 Sorun Giderme

### Site görünmüyor
1. Nginx loglarını kontrol edin: `sudo tail -f /var/log/nginx/error.log`
2. Port kontrolü: `sudo netstat -tulpn | grep :5173` veya `sudo ss -tulpn | grep :5173`
3. Firewall kontrolü: `sudo firewall-cmd --list-all`

### API çalışmıyor
1. Backend server çalışıyor mu? `pm2 list` veya `ps aux | grep node`
2. Backend portu açık mı? `curl http://localhost:3000/api/health`

### 404 hatası (sayfa yenileme sonrası)
- Nginx konfigürasyonunda `try_files $uri $uri/ /index.html;` olduğundan emin olun

