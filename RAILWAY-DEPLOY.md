# 🚂 Railway.app ile Full-Stack Deployment

## 🎯 Socket.IO + File Uploads + Her Şey Çalışsın!

Eğer Socket.IO ve file uploads'ı **olduğu gibi** kullanmak istiyorsanız, **Railway.app** en kolay çözüm!

---

## ⚡ Neden Railway?

✅ Socket.IO çalışır (WebSocket desteği tam)  
✅ File uploads kalıcı (persistent disk)  
✅ MSSQL bağlantısı (kendi sunucunuza)  
✅ Ücretsiz $5 kredi (başlangıç için yeterli)  
✅ Git ile otomatik deploy  
✅ SSL otomatik  
✅ Logs ve monitoring dahil  

---

## 🚀 Deployment Adımları

### 1️⃣ Railway Hesabı

1. [railway.app](https://railway.app) → GitHub ile giriş yapın
2. **"Start a New Project"** → **"Deploy from GitHub repo"**
3. `globalmenu` repo'nuzu seçin

### 2️⃣ Backend Service Oluştur

1. **"+ New"** → **"Service"** → **"Backend"**
2. **Root Directory**: `server` seçin
3. **Start Command**: `npm start`
4. **Build Command**: `npm install`

### 3️⃣ Environment Variables (Backend)

**Variables** sekmesinde ekleyin:

```
PORT = 3000
NODE_ENV = production

# Database (MSSQL - kendi sunucunuz)
DB_SERVER = your-mssql-server.com
DB_PORT = 1433
DB_DATABASE = LilaGroupMenu
DB_USER = your_username
DB_PASSWORD = your_password
DB_ENCRYPT = true

# Email
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_SECURE = false
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-password
EMAIL_FROM = noreply@lilagroup.com
EMAIL_TO = orders@lilagroup.com

# CORS (Frontend URL buraya gelecek - sonra güncelleyeceğiz)
CORS_ORIGIN = https://your-frontend.railway.app
```

### 4️⃣ Deploy Backend

**"Deploy"** butonuna tıklayın. 2-3 dakika içinde backend hazır!

Backend URL'nizi kopyalayın:
```
https://your-backend.up.railway.app
```

### 5️⃣ Frontend Service Oluştur

1. Aynı projede **"+ New"** → **"Service"** → **"Frontend"**
2. **Root Directory**: `client` seçin
3. **Build Command**: `npm run build`
4. **Start Command**: `npm run preview`

### 6️⃣ Environment Variables (Frontend)

```
VITE_API_URL = https://your-backend.up.railway.app/api
```

> ⚠️ Yukarıdaki backend URL'nizi kullanın

### 7️⃣ Deploy Frontend

**"Deploy"** butonuna tıklayın!

### 8️⃣ CORS Güncelle

Frontend URL'niz hazır olduğunda:

1. Backend service'e git
2. **Variables** → `CORS_ORIGIN` değerini frontend URL'niz olarak güncelleyin:
   ```
   CORS_ORIGIN = https://your-frontend.up.railway.app
   ```
3. Backend otomatik yeniden deploy olacak

---

## 🎉 Tamamlandı!

- **Frontend**: `https://your-frontend.up.railway.app`
- **Backend API**: `https://your-backend.up.railway.app/api`
- **Socket.IO**: `wss://your-backend.up.railway.app`

---

## 💰 Fiyatlandırma

| Plan | Fiyat | Özellikler |
|------|-------|-----------|
| **Hobby** | $5/ay kredi | 500 saat/ay, 8GB RAM, 100GB disk |
| **Pro** | $20/ay | Unlimited, daha fazla kaynak |

**Başlangıçta $5 ücretsiz kredi veriyorlar!**

---

## 📁 Persistent Storage (File Uploads)

Railway otomatik olarak `/app` dizininde persistent storage sağlar.

Mevcut upload yapınız (`server/uploads`) olduğu gibi çalışır!

---

## 🔄 Otomatik Deployment

Her GitHub push otomatik deploy:

```bash
git add .
git commit -m "Update"
git push origin main
# Railway otomatik deploy başlatır
```

---

## 📊 Monitoring ve Logs

Railway Dashboard'da:

1. **Logs**: Real-time server logları
2. **Metrics**: CPU, RAM, Network kullanımı
3. **Deployments**: Deployment geçmişi

---

## 🎯 Pro İpuçları

### Custom Domain Bağlama

1. Service → **Settings** → **Domains**
2. **Add Domain** → `api.yourdomain.com`
3. DNS ayarlarını yapın (CNAME)

### Database Backup

Railway ücretsiz PostgreSQL de sunar, isterseniz MSSQL yerine kullanabilirsiniz:

1. **+ New** → **Database** → **PostgreSQL**
2. Otomatik environment variables ekler
3. Günlük otomatik backup

### SSL/HTTPS

Otomatik! Railway tüm servislere ücretsiz SSL verir.

---

## 🔄 Güncelleme

```bash
# Kod değişikliği yap
git add .
git commit -m "Fix bug"
git push origin main

# Railway otomatik:
# 1. Build alır
# 2. Deploy eder
# 3. Eski versiyonu tutar (rollback için)
```

---

## ⚠️ MSSQL Bağlantısı

MSSQL sunucunuzun Railway'den erişilebilir olması gerekir:

1. **Azure SQL**: Firewall'da "Allow Azure Services" açın
2. **Kendi Sunucu**: Public IP ve firewall port 1433 açık olmalı
3. **VPN**: Railway Pro planla VPN desteği var

---

## 🆚 Railway vs Vercel

| Özellik | Railway | Vercel |
|---------|---------|--------|
| **Socket.IO** | ✅ Çalışır | ❌ Çalışmaz |
| **File Uploads** | ✅ Kalıcı | ❌ Geçici |
| **Timeout** | ∞ Unlimited | 10-60 saniye |
| **WebSocket** | ✅ Full destek | ⚠️ Sınırlı |
| **Database** | ✅ Dahil (PostgreSQL) | ❌ Harici |
| **Fiyat** | $5/ay | Ücretsiz* |

---

## 🎯 Sonuç

Railway kullanın eğer:
- ✅ Socket.IO lazımsa
- ✅ File upload kalıcı olmalı
- ✅ Long-running processes var
- ✅ Full backend özellikleri istiyorsanız

**Projeniz için Railway en uygun seçenek! 🚂**

