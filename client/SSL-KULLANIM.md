# SSL ile Geliştirme Sunucusu Kullanımı

## Kurulum Tamamlandı ✅

Geliştirme sunucunuz artık HTTPS desteği ile çalışacak. Bu sayede telefonunuzdan konum izni test edebilirsiniz.

## Kullanım

### 1. Sunucuyu Başlatın

```bash
cd client
npm run dev
```

İlk çalıştırmada sertifika otomatik oluşturulacak ve tarayıcıda güvenilir olarak işaretlenecek.

### 2. Erişim Adresleri

- **Bilgisayarınızdan**: `https://localhost:5173`
- **Telefonunuzdan**: `https://[BİLGİSAYAR-IP-ADRESINIZ]:5173`

### 3. IP Adresinizi Öğrenin

Windows PowerShell'de şu komutu çalıştırın:

```powershell
ipconfig
```

"IPv4 Address" satırını bulun (örn: `192.168.1.100`)

### 4. Telefondan Bağlanma

1. Telefonunuzu **aynı WiFi ağına** bağlayın
2. Tarayıcıda `https://192.168.1.100:5173` adresine gidin (kendi IP'nizle)
3. İlk girişte "Bu site güvensiz" uyarısı çıkabilir
4. **"Gelişmiş" > "Devam Et"** seçeneklerine tıklayın (her tarayıcıda farklı olabilir)

## Güvenlik Uyarısı Sorunları

Eğer telefonunuzda sertifika uyarısı çıkarsa:

### Android
1. Chrome'da: **Gelişmiş** → **Devam et**
2. Veya: Ayarlar → Güvenlik → Sertifikalar → SD kart'tan yükle

### iOS  
1. Safari'de: **Devam Et** butonuna basın
2. Veya: Ayarlar → Genel → VPN ve Cihaz Yönetimi → Sertifikaya güven

## Sorun Giderme

### Konum İzni Hala Çalışmıyorsa

1. Tarayıcı ayarlarında konum iznini kontrol edin
2. Siteyi güvenilir sitelere ekleyin
3. Tarayıcı önbelleğini temizleyin

### Bağlantı Sorunu

1. Firewall'un 5173 portunu engellemediğinden emin olun
2. Bilgisayar ve telefon aynı ağda mı kontrol edin
3. VPN kapalı olmalı

## Notlar

⚠️ Bu sertifika sadece **geliştirme amaçlıdır**
✅ Production için Let's Encrypt gibi gerçek sertifika kullanın
🔒 Konum servisleri artık düzgün çalışacak

