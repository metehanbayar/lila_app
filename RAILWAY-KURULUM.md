# 🚂 Railway Deployment - Adım Adım Kurulum

## 🎯 Başlamadan Önce Hazırlıklar

✅ GitHub hesabınız olmalı  
✅ Proje GitHub'a push edilmiş olmalı  
✅ MSSQL sunucu bilgileriniz hazır olmalı  
✅ Gmail SMTP bilgileriniz hazır olmalı  

---

## 📋 ADIM 1: Railway Hesabı Oluşturun

1. 🌐 [railway.app](https://railway.app) adresine gidin
2. 🔑 **"Login with GitHub"** butonuna tıklayın
3. ✅ GitHub izinlerini onaylayın
4. 🎉 Dashboard'a yönlendirileceksiniz

---

## 🚀 ADIM 2: Yeni Proje Oluşturun

1. Dashboard'da **"New Project"** butonuna tıklayın
2. **"Deploy from GitHub repo"** seçeneğini seçin
3. Repository listesinden **`globalmenu`** projenizi seçin
4. Railway projeniz oluşturuldu! 🎊

---

## 🔧 ADIM 3: Backend Service Kurulumu

### 3.1 - Backend Service Ekleyin

1. Proje sayfasında **"+ New"** butonuna tıklayın
2. **"GitHub Repo"** seçeneğini seçin (aynı repo)
3. Service adını **"backend"** olarak değiştirin

### 3.2 - Backend Ayarları

1. Service'e tıklayın
2. **"Settings"** sekmesine gidin
3. **"Root Directory"** bölümünü bulun
4. Değeri **`server`** olarak ayarlayın
5. **"Start Command"** bölümünü bulun
6. Değeri **`npm start`** olarak ayarlayın

### 3.3 - Backend Environment Variables

1. **"Variables"** sekmesine gidin
2. **"RAW Editor"** butonuna tıklayın
3. Aşağıdaki değerleri **kendi bilgilerinizle** doldurup yapıştırın:

```env
PORT=3000
NODE_ENV=production

# MSSQL Database - KENDİ BİLGİLERİNİZİ YAZIN!
DB_SERVER=sizin-mssql-server.com
DB_PORT=1433
DB_DATABASE=LilaGroupMenu
DB_USER=sizin_kullanici_adiniz
DB_PASSWORD=sizin_sifreniz
DB_ENCRYPT=true

# Email - KENDİ BİLGİLERİNİZİ YAZIN!
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=sizin-email@gmail.com
EMAIL_PASSWORD=sizin-app-password
EMAIL_FROM=noreply@lilagroup.com
EMAIL_TO=orders@lilagroup.com

# CORS - Şimdilik * bırakın, sonra güncelleyeceğiz
CORS_ORIGIN=*
```

4. **"Update Variables"** butonuna tıklayın

### 3.4 - Backend Deploy

1. **"Deployments"** sekmesine gidin
2. Otomatik deployment başlamış olmalı
3. Logları izleyin: **"View Logs"**
4. ✅ "Deployment succeeded" mesajını bekleyin (2-3 dakika)

### 3.5 - Backend URL'sini Alın

1. **"Settings"** sekmesine gidin
2. **"Domains"** bölümünü bulun
3. **"Generate Domain"** butonuna tıklayın
4. 📋 URL'yi kopyalayın (örn: `backend-production-xxxx.up.railway.app`)

---

## 🎨 ADIM 4: Frontend Service Kurulumu

### 4.1 - Frontend Service Ekleyin

1. Ana proje sayfasına dönün
2. **"+ New"** → **"GitHub Repo"** (aynı repo)
3. Service adını **"frontend"** olarak değiştirin

### 4.2 - Frontend Ayarları

1. Frontend service'e tıklayın
2. **"Settings"** sekmesine gidin
3. **"Root Directory"**: **`client`**
4. **"Build Command"**: **`npm run build`**
5. **"Start Command"**: **`npm run preview`**

### 4.3 - Frontend Environment Variables

1. **"Variables"** sekmesine gidin
2. **"New Variable"** butonuna tıklayın
3. Variable Name: **`VITE_API_URL`**
4. Variable Value: **`https://BACKEND-URL-NİZİ-YAZIN/api`**
   
   > ⚠️ Yukarıda aldığınız backend URL'sini kullanın!
   > Örnek: `https://backend-production-xxxx.up.railway.app/api`

5. **"Add"** butonuna tıklayın

### 4.4 - Frontend Deploy

1. **"Deployments"** sekmesine gidin
2. Otomatik build başlayacak
3. Logları izleyin (3-5 dakika sürebilir)
4. ✅ "Deployment succeeded" mesajını bekleyin

### 4.5 - Frontend URL'sini Alın

1. **"Settings"** sekmesine gidin
2. **"Domains"** bölümünde
3. **"Generate Domain"** butonuna tıklayın
4. 📋 URL'yi kopyalayın (örn: `frontend-production-yyyy.up.railway.app`)

---

## 🔄 ADIM 5: CORS Ayarını Güncelleyin

Şimdi frontend URL'niz hazır olduğuna göre, backend CORS ayarını güncelleyin:

1. **Backend service**'e gidin
2. **"Variables"** sekmesine gidin
3. **`CORS_ORIGIN`** değişkenini bulun
4. Değeri frontend URL'niz olarak güncelleyin:
   ```
   https://frontend-production-yyyy.up.railway.app
   ```
5. **"Update"** butonuna tıklayın
6. Backend otomatik yeniden deploy olacak (30 saniye)

---

## ✅ ADIM 6: Test Edin

### Backend Test

Tarayıcıda backend URL'nizi açın:
```
https://backend-production-xxxx.up.railway.app/api/health
```

Şu yanıtı görmelisiniz:
```json
{
  "status": "OK",
  "message": "Lila Group Menu API çalışıyor",
  "timestamp": "2024-..."
}
```

### Frontend Test

Tarayıcıda frontend URL'nizi açın:
```
https://frontend-production-yyyy.up.railway.app
```

Ana sayfa yüklenmeli! 🎉

### Full Test

1. Bir restoran seçin
2. Ürün ekleyin
3. Sepete git
4. Sipariş verin
5. Email geldi mi kontrol edin

---

## 🎉 TAMAMLANDI!

Uygulamanız canlıda! 🚀

- 🎨 **Frontend**: https://frontend-production-yyyy.up.railway.app
- ⚙️ **Backend API**: https://backend-production-xxxx.up.railway.app/api
- 🔌 **Socket.IO**: wss://backend-production-xxxx.up.railway.app

---

## 🌐 ADIM 7: Kendi Domain'inizi Bağlayın (Opsiyonel)

### Frontend için Custom Domain

1. Frontend service → **"Settings"** → **"Domains"**
2. **"Custom Domain"** butonuna tıklayın
3. Domain'inizi yazın: `menu.sizdomain.com`
4. DNS ayarlarını yapın:
   - **Type**: CNAME
   - **Name**: menu
   - **Value**: Railway'in verdiği değer

### Backend için Custom Domain

1. Backend service → **"Settings"** → **"Domains"**
2. **"Custom Domain"** butonuna tıklayın
3. Domain'inizi yazın: `api.sizdomain.com`
4. DNS ayarlarını yapın

### CORS'u Custom Domain ile Güncelleyin

Backend variables'da:
```
CORS_ORIGIN=https://menu.sizdomain.com
```

Frontend variables'da:
```
VITE_API_URL=https://api.sizdomain.com/api
```

---

## 💰 Maliyet Tahmini

Railway kullanım bazlı ücretlendirme yapar:

| Kaynak | Kullanım | Tahmini Maliyet |
|--------|----------|-----------------|
| **Backend** | 24/7 çalışır | ~$3-4/ay |
| **Frontend** | 24/7 çalışır | ~$1-2/ay |
| **Toplam** | İki service | **~$5/ay** |

> 💡 İlk $5 Railway tarafından ücretsiz veriliyor!

---

## 🔄 Otomatik Deployment

Her GitHub push otomatik deploy edilir:

```bash
# Kod değişikliği yapın
git add .
git commit -m "Yeni özellik eklendi"
git push origin main

# Railway otomatik:
# ✅ Build alır
# ✅ Test eder
# ✅ Deploy eder
# ✅ Eski versiyonu tutar (rollback için)
```

---

## 📊 Monitoring ve Logs

### Real-time Logs

1. Service'e tıklayın
2. **"Deployments"** sekmesi
3. Son deployment'e tıklayın
4. **"View Logs"**

### Metrics

1. Service sayfasında
2. **"Metrics"** sekmesi
3. CPU, RAM, Network kullanımını görün

### Alerts

1. Proje settings
2. **"Alerts"** bölümü
3. Email/Slack bildirimleri ayarlayın

---

## 🐛 Sorun Giderme

### Backend Başlamıyor

**Logs'u Kontrol Edin:**
1. Backend service → **"Deployments"**
2. **"View Logs"**
3. Hata mesajlarına bakın

**Olası Sorunlar:**
- ❌ MSSQL bağlantı hatası → DB bilgilerini kontrol edin
- ❌ Port hatası → PORT=3000 olmalı
- ❌ npm install hatası → package.json kontrol edin

### Frontend Açılmıyor

1. Frontend logs'u kontrol edin
2. `VITE_API_URL` doğru mu?
3. Backend çalışıyor mu?

### CORS Hatası

Browser console'da CORS hatası:
1. Backend variables → `CORS_ORIGIN` doğru mu?
2. Frontend URL ile eşleşiyor mu?
3. Backend yeniden deploy edin

### Veritabanı Bağlantı Hatası

**MSSQL sunucunuz Railway'den erişilebilir olmalı:**

1. **Azure SQL kullanıyorsanız:**
   - Azure Portal → SQL Server → Firewall
   - ✅ "Allow Azure services and resources to access this server" ON

2. **Kendi sunucunuzda:**
   - Port 1433 dışarıya açık olmalı
   - Firewall Railway IP'lerini izin vermeli

3. **Connection String Test:**
   Railway terminal'de test edin:
   ```bash
   # Service → "Settings" → "Terminal"
   npm install -g mssql
   node -e "const sql = require('mssql'); sql.connect('mssql://USER:PASS@SERVER:1433/DB').then(() => console.log('OK')).catch(console.error)"
   ```

---

## 🔒 Güvenlik Önerileri

1. ✅ Environment variables asla GitHub'a push etmeyin
2. ✅ CORS'u production domain'e sınırlayın (`*` kullanmayın)
3. ✅ MSSQL şifresini güçlü yapın
4. ✅ Email App Password kullanın (gerçek şifre değil)
5. ✅ Railway 2FA'yı aktifleştirin

---

## 🚀 İleri Seviye

### Persistent Volume (File Upload için)

Railway otomatik persistent disk sağlar. Ancak garantilemek için:

1. Service → **"Settings"** → **"Volumes"**
2. **"New Volume"** butonuna tıklayın
3. **Mount Path**: `/app/server/uploads`
4. **Size**: 1 GB (başlangıç için yeterli)

### Database Migration

Migration'ları otomatik çalıştırmak için:

`server/package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "migrate": "node migrate.js",
    "postinstall": "npm run migrate"
  }
}
```

### Environment-Specific Config

Development/Staging/Production ortamları için:

1. Railway'de yeni proje oluşturun: `globalmenu-staging`
2. Aynı adımları tekrarlayın
3. Farklı environment variables kullanın

---

## 📞 Destek

### Railway Destek

- 📧 Email: [team@railway.app](mailto:team@railway.app)
- 💬 Discord: [Railway Community](https://discord.gg/railway)
- 📖 Docs: [docs.railway.app](https://docs.railway.app)

### Proje Destek

- 📧 Email: support@lilagroup.com
- 📱 Telefon: +90 555 123 45 67

---

## 🎊 Sonuç

Railway ile başarıyla deploy ettiniz! 🎉

✅ Backend çalışıyor (Socket.IO ile)  
✅ Frontend çalışıyor  
✅ MSSQL bağlantısı aktif  
✅ Email bildirimleri çalışıyor  
✅ SSL otomatik  
✅ Otomatik deployment aktif  

**Artık siparişlerinizi alabilirsiniz!** 🍽️

---

## 📌 Hızlı Komutlar

```bash
# Logs izle
railway logs --service backend

# Terminal aç
railway shell

# Variables listele
railway variables

# Deploy et (manuel)
railway up

# Status kontrol
railway status
```

---

**Kolay gelsin! 🚂✨**

