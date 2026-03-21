# Production Deployment Rehberi

Bu rehber, güncel repo yapısına göre `client` build'i ve `server` API'sini canlıya alırken gereken minimum adımları özetler.

## 1. Gerekli Env Alanları

Canlı ortam için `server/.env` içinde en az şu alanlar doğru olmalıdır:

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com

AUTH_TOKEN_SECRET=replace-with-a-long-random-secret-at-least-32-chars
TOKEN_TTL_HOURS=168

DB_SERVER=your-mssql-server
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_ENCRYPT=true
```

Ödeme canlıda kullanılacaksa ayrıca:

```env
PAYMENT_ENVIRONMENT=production
PAYMENT_SUCCESS_URL=https://yourdomain.com/payment/success
PAYMENT_FAILURE_URL=https://yourdomain.com/payment/failure
VAKIF_MERCHANT_ID=...
VAKIF_MERCHANT_PASSWORD=...
VAKIF_TERMINAL_NO=...
VAKIF_TERMINAL_SAFE_ID=...
VAKIF_TERMINAL_SAFE_KEY=...
```

Notlar:

- `CORS_ORIGIN` production ortamında zorunludur.
- `AUTH_TOKEN_SECRET` production ortamında zorunludur ve en az 32 karakter olmalıdır.
- Payment canlıya alınacaksa callback URL'leri ve `VAKIF_*` alanları eksik bırakılamaz.

## 2. Client Build

```bash
cd client
npm run build
```

Çıktı:

```text
client/dist
```

## 3. Server Kontrolleri

Canlıya almadan önce:

```bash
cd server
npm run check
```

## 4. Server Sürecini Başlat

Örnek PM2 kullanımı:

```bash
cd server
pm2 start server.js --name globalmenu-api
pm2 save
```

Backend yerelde şu adreste dinlemelidir:

```text
http://127.0.0.1:3000
```

## 5. Nginx Örneği

Önerilen model:

- frontend dosyalarını Nginx doğrudan servis etsin
- `/api`, `/uploads` ve `/socket.io` istekleri Node server'a proxy edilsin

Örnek:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;

    root /path/to/globalmenu/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

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

## 6. SSL

Nginx üzerinden SSL açmak için örnek:

```bash
sudo certbot --nginx -d yourdomain.com
```

## 7. Firewall

Production ortamında tipik ihtiyaç:

- `80/tcp`
- `443/tcp`

Node server doğrudan internete açılmayacaksa `3000` sadece lokal erişimde kalmalıdır.

## 8. Kontrol Listesi

- [ ] `client/dist` üretildi
- [ ] `server/.env` production için dolduruldu
- [ ] `npm run check` geçti
- [ ] Node server çalışıyor
- [ ] Nginx config yüklendi
- [ ] SSL aktif edildi
- [ ] `/api/health` başarılı dönüyor

## Sorun Giderme

### Site açılıyor ama API çalışmıyor

- `pm2 logs globalmenu-api`
- `curl http://127.0.0.1:3000/api/health`
- Nginx `proxy_pass` hedefini kontrol edin

### 404 sayfa yenileme hatası

- `location /` içinde `try_files $uri $uri/ /index.html;` olmalı

### CORS hatası

- `CORS_ORIGIN` değerinin gerçek domain ile birebir eşleştiğini kontrol edin

### Payment canlıda başlamıyor

- `PAYMENT_ENVIRONMENT=production`
- tüm `VAKIF_*` alanları dolu
- callback URL'leri HTTPS ve doğru domain'e işaret ediyor
