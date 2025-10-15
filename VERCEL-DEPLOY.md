# 🚀 Vercel ile Frontend Deployment (En Kolay Yöntem)

## ⚡ 2 Dakikada Deploy Edin!

### Adım 1: Vercel Hesabı
1. [vercel.com](https://vercel.com) adresine gidin
2. GitHub hesabınızla giriş yapın (ücretsiz)

### Adım 2: Proje Import
1. Vercel Dashboard'da **"New Project"** butonuna tıklayın
2. GitHub repository'nizi seçin (`globalmenu`)
3. **Framework Preset**: `Vite` seçin
4. **Root Directory**: `client` yazın

### Adım 3: Environment Variables
**Environment Variables** bölümüne ekleyin:

```
VITE_API_URL = https://api.yourdomain.com/api
```

> ⚠️ `api.yourdomain.com` yerine kendi backend sunucu adresinizi yazın

### Adım 4: Deploy
**"Deploy"** butonuna tıklayın. 2-3 dakika içinde hazır!

---

## 🎉 Tamamlandı!

Frontend'iniz şu adreste yayında:
- `https://your-project.vercel.app`

### Domain Bağlama (Opsiyonel)
1. Vercel Dashboard'da **Settings** > **Domains**
2. Kendi domain'inizi ekleyin (örn: `menu.lilagroup.com`)
3. DNS ayarlarını yapın (Vercel size söyleyecek)

---

## 🔄 Otomatik Deployment

Her GitHub'a push attığınızda:
- ✅ Otomatik build alınır
- ✅ Otomatik deploy edilir
- ✅ Preview URL oluşturulur (branch'ler için)

---

## 📊 Alternatif: Netlify

Aynı şekilde [netlify.com](https://netlify.com) da kullanabilirsiniz:

1. Netlify'a giriş yapın
2. **"Add new site"** > **"Import an existing project"**
3. GitHub repo'nuzu seçin
4. **Build settings**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
5. Environment variable ekleyin: `VITE_API_URL`
6. Deploy!

Her iki platform da %100 ücretsiz ve harika çalışır.

