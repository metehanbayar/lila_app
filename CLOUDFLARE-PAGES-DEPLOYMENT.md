# ☁️ Cloudflare Pages Deployment Rehberi

## Frontend (React/Vite) Deployment

### Yöntem 1: GitHub ile Otomatik Deploy (Önerilen)

#### Adım 1: GitHub Repo Oluştur

```bash
cd C:\Users\meteh\Desktop\globalmenu
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/globalmenu.git
git push -u origin main
```

#### Adım 2: Cloudflare Pages Bağla

1. https://dash.cloudflare.com → Pages
2. **"Create a project"**
3. **"Connect to Git"** → GitHub seç
4. Repository seç: `globalmenu`
5. Build settings:

```yaml
Framework preset: Vite
Build command: npm run build
Build output directory: client/dist
Root directory: client
```

6. **Environment Variables:**

```env
VITE_API_URL=https://your-backend-url.com/api
```

7. **"Save and Deploy"**

#### Adım 3: Her Commit'te Otomatik Deploy

```bash
# Değişiklik yap
git add .
git commit -m "Update"
git push

# Cloudflare otomatik deploy eder!
```

---

### Yöntem 2: Wrangler CLI (Manuel)

```bash
# Cloudflare CLI kur
npm install -g wrangler

# Login
wrangler login

# Build
cd client
npm run build

# Deploy
wrangler pages deploy dist --project-name=lilagusto
```

---

## 🔧 Frontend Build Ayarları

### `client/.env.production`

```env
VITE_API_URL=https://your-backend.azurewebsites.net/api
```

### Build Test (Local)

```bash
cd client
npm run build
npm run preview
```

Tarayıcıda aç: http://localhost:4173

---

## 🌐 Custom Domain

Cloudflare Pages'de:

1. Pages → Your Project → Custom Domains
2. **"Set up a custom domain"**
3. `www.lilagusto.com` ekle
4. DNS ayarları gösterilecek
5. Cloudflare DNS'e ekle

```
CNAME  www  lilagusto.pages.dev
```

SSL otomatik sağlanır! ✅

---

## 📱 Backend Deployment Seçenekleri

### Seçenek 1: Azure App Service (Önerilen) ⭐

**Neden Azure?**
- ✅ MSSQL zaten Azure'da olabilir (Azure SQL)
- ✅ Kolay entegrasyon
- ✅ Auto-scaling
- ✅ WebSocket desteği (Socket.IO için)

**Deployment:**

```bash
# Azure CLI kur
# https://aka.ms/installazurecli

# Login
az login

# Resource group oluştur
az group create --name lila-group-rg --location westeurope

# App Service Plan
az appservice plan create --name lila-plan --resource-group lila-group-rg --sku B1 --is-linux

# Web App oluştur
az webapp create --resource-group lila-group-rg --plan lila-plan --name lila-backend --runtime "NODE:18-lts"

# Deploy
cd server
zip -r deploy.zip .
az webapp deployment source config-zip --resource-group lila-group-rg --name lila-backend --src deploy.zip

# Environment variables
az webapp config appsettings set --resource-group lila-group-rg --name lila-backend --settings \
  DB_SERVER=your-server.database.windows.net \
  DB_NAME=LilaGroupMenu \
  DB_USER=admin \
  DB_PASSWORD=yourpassword \
  CORS_ORIGIN=https://lilagusto.pages.dev \
  NODE_ENV=production
```

**URL:** `https://lila-backend.azurewebsites.net`

---

### Seçenek 2: Railway.app (Kolay) 🚂

1. https://railway.app → Sign up
2. **"New Project"** → "Deploy from GitHub repo"
3. `globalmenu` seç
4. Root directory: `server`
5. Environment variables ekle:

```env
DB_SERVER=your-server
DB_NAME=LilaGroupMenu
DB_USER=admin
DB_PASSWORD=password
CORS_ORIGIN=https://lilagusto.pages.dev
PORT=3000
```

6. **Deploy!**

**URL:** `https://globalmenu-production.up.railway.app`

---

### Seçenek 3: VPS (DigitalOcean, Hetzner)

```bash
# VPS'e SSH bağlan
ssh root@your-vps-ip

# Node.js kur
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PM2 kur (process manager)
npm install -g pm2

# Kodu çek
git clone https://github.com/USERNAME/globalmenu.git
cd globalmenu/server
npm install

# .env dosyası oluştur
nano .env
# DB bilgilerini gir

# PM2 ile başlat
pm2 start server.js --name lila-backend
pm2 save
pm2 startup

# Nginx reverse proxy
apt install nginx
nano /etc/nginx/sites-available/lila-backend

# Nginx config:
server {
    listen 80;
    server_name api.lilagusto.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}

# SSL (Let's Encrypt)
apt install certbot python3-certbot-nginx
certbot --nginx -d api.lilagusto.com
```

---

## 💾 Database (MSSQL)

### Azure SQL Database

```bash
# Azure SQL oluştur
az sql server create \
  --name lila-sql-server \
  --resource-group lila-group-rg \
  --location westeurope \
  --admin-user sqladmin \
  --admin-password YourPassword123!

# Database oluştur
az sql db create \
  --resource-group lila-group-rg \
  --server lila-sql-server \
  --name LilaGroupMenu \
  --service-objective S0

# Firewall (Azure servislere izin ver)
az sql server firewall-rule create \
  --resource-group lila-group-rg \
  --server lila-sql-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Connection String:**
```
Server=lila-sql-server.database.windows.net;
Database=LilaGroupMenu;
User Id=sqladmin;
Password=YourPassword123!;
Encrypt=true;
```

---

## 🖨️ C# Client Distribution

### GitHub Releases

```bash
# Build single-file EXE
cd LilaPrinterClient/LilaPrinterClient
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true

# EXE: bin/Release/net6.0-windows/win-x64/publish/LilaPrinterClient.exe
```

**GitHub Release oluştur:**
1. GitHub repo → Releases → **"Create a new release"**
2. Tag: `v1.0.0`
3. Title: `Lila Printer Client v1.0.0`
4. Upload: `LilaPrinterClient.exe`
5. **"Publish release"**

**İndirme linki:**
```
https://github.com/USERNAME/globalmenu/releases/download/v1.0.0/LilaPrinterClient.exe
```

---

## 🔗 Tüm URL'ler

Deployment sonrası:

```
Frontend:  https://lilagusto.pages.dev
Backend:   https://lila-backend.azurewebsites.net
Database:  lila-sql-server.database.windows.net
Client:    https://github.com/USER/globalmenu/releases
```

---

## 📝 DEPLOYMENT ADIMLARI (ÖZET)

### 1. Database (Azure SQL)
```bash
# Azure SQL oluştur
# Migration'ları çalıştır
# Connection string al
```

### 2. Backend (Azure App Service)
```bash
# App Service oluştur
# Kodu deploy et
# Environment variables ayarla
# Test et: https://lila-backend.azurewebsites.net/api/health
```

### 3. Frontend (Cloudflare Pages)
```bash
# GitHub'a push et
# Cloudflare Pages bağla
# Build settings:
#   - Build command: npm run build
#   - Output: client/dist
#   - Root: client
# Env var: VITE_API_URL=https://lila-backend.azurewebsites.net/api
```

### 4. Client (GitHub Releases)
```bash
# EXE build et
# GitHub Release oluştur
# Upload et
```

---

## 💰 MALIYET TAHMİNİ (Aylık)

```
Cloudflare Pages:  $0 (Unlimited, ücretsiz!)
Azure App Service: ~$15-30 (B1 tier)
Azure SQL:         ~$5-15 (Basic tier)
Railway:           $5-10 (alternatif backend)
VPS:               $4-6 (Hetzner, alternatif)

Toplam: ~$20-50/ay
```

---

## 🚀 HIZLI BAŞLANGIÇ

**En hızlı yol:**

1. **Railway** → Backend (5 dakika) 🚂
2. **Cloudflare Pages** → Frontend (5 dakika) ☁️
3. **GitHub Releases** → Client (2 dakika) 📦

**15 dakikada canlı!** ⚡

---

**Hangi yöntemi tercih edersin? Railway mı, Azure mı, yoksa VPS mi?** 

Seçtiğin yönteme göre adım adım yürüyebiliriz! 🎯
