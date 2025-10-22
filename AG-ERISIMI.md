# 🌐 Ağdan Erişim Rehberi

Bu rehber, projenize ağınızdaki diğer cihazlardan (telefon, tablet, başka bilgisayarlar) nasıl erişeceğinizi anlatır.

## 📋 Gereksinimler

- Tüm cihazlar aynı Wi-Fi ağına bağlı olmalı
- Windows Firewall ayarları yapılandırılmalı
- Backend ve Frontend sunucuları çalışıyor olmalı

## 🚀 Adım Adım Kurulum

### 1️⃣ Yerel IP Adresinizi Öğrenin

Windows PowerShell veya CMD'de şu komutu çalıştırın:

```powershell
ipconfig
```

**Örnek çıktı:**
```
Kablosuz LAN bağdaştırıcısı Wi-Fi:
   IPv4 Adresi. . . . . . . . . . . : 192.168.1.105
```

`192.168.1.105` gibi bir adres göreceksiniz. Bu sizin **YEREL-IP** adresinizdir.

### 2️⃣ Windows Firewall Ayarları

**Portları açmanız gerekiyor:**
- **Port 3000**: Backend API
- **Port 5173**: Frontend (Vite Dev Server)

#### Yöntem 1: PowerShell ile (Önerilen - Hızlı)

PowerShell'i **Yönetici olarak** açın ve şu komutları çalıştırın:

```powershell
# Backend için (Port 3000)
New-NetFirewallRule -DisplayName "GlobalMenu Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Frontend için (Port 5173)
New-NetFirewallRule -DisplayName "GlobalMenu Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

#### Yöntem 2: Windows Güvenlik Duvarı Ayarları

1. **Windows Güvenlik** → **Güvenlik Duvarı ve ağ koruması** → **Gelişmiş ayarlar**
2. **Gelen Kuralları** → **Yeni Kural**
3. **Bağlantı noktası** seçin → **İleri**
4. **TCP** seçin ve **3000** yazın → **İleri**
5. **Bağlantıya izin ver** → **İleri**
6. Tüm profilleri seçili bırakın → **İleri**
7. İsim: "GlobalMenu Backend" → **Bitir**
8. Aynı adımları **5173** portu için tekrarlayın (İsim: "GlobalMenu Frontend")

### 3️⃣ Sunucuları Başlatın

#### Terminal 1 - Backend:
```powershell
cd server
npm run dev
```

Çıktıda şöyle bir mesaj göreceksiniz:
```
🚀 Lila Group Menu API çalışıyor
📍 Port: 3000
🌐 Ağdan erişim için: http://<YEREL-IP>:3000
```

#### Terminal 2 - Frontend:
```powershell
cd client
npm run dev
```

Çıktıda şöyle bir mesaj göreceksiniz:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.105:5173/
```

**Network** satırındaki adres diğer cihazlardan erişeceğiniz adrestir!

### 4️⃣ Diğer Cihazlardan Erişim

Telefonunuz veya başka bir cihazdan tarayıcıda şu adresi açın:

```
http://192.168.1.105:5173
```

(192.168.1.105 yerine kendi yerel IP adresinizi yazın)

## 📱 Test Etme

1. Cep telefonunuzda Wi-Fi'ye bağlı olduğunuzdan emin olun
2. Tarayıcıyı açın ve `http://<YEREL-IP>:5173` adresine gidin
3. Projeniz açılmalı ve normalde çalışmalı

## 🔧 Sorun Giderme

### Problem: "Siteye erişilemiyor" hatası

**Çözüm 1:** Firewall'un portları engellemediğinden emin olun
```powershell
# Mevcut kuralları kontrol edin (PowerShell - Yönetici)
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*GlobalMenu*"}
```

**Çözüm 2:** Antivirüs yazılımınızın bu portları engellemediğinden emin olun

**Çözüm 3:** Router ayarlarınızı kontrol edin (bazı router'lar cihazlar arası iletişimi engelleyebilir)

### Problem: Sayfalar açılıyor ama resimler yüklenmiyor

Bu normal - görseller backend'den (localhost:3000) servis edildiği için diğer cihazlarda görünmeyebilir. Production build'de bu sorun olmaz.

### Problem: API istekleri başarısız oluyor

Backend'in 0.0.0.0'da çalıştığından emin olun:
```bash
netstat -an | findstr :3000
```

Çıktıda `0.0.0.0:3000` görmelisiniz.

## 🌍 Production Kurulum

Bu ayarlar sadece geliştirme ortamı içindir. Production kurulum için `README.md` dosyasına bakın.

## 💡 İpuçları

- **Güvenlik:** Geliştirme sunucusunu sadece güvendiğiniz ağlarda açın
- **Performans:** Ağ hızınıza bağlı olarak yükleme süreleri değişebilir
- **Otomatik Yenileme:** Vite'ın hot reload özelliği ağdaki diğer cihazlarda da çalışır
- **QR Kod:** Mobil test için URL'yi QR kod haline getirip telefonla taratabilirsiniz

## 📞 Destek

Sorun yaşarsanız veya sorularınız varsa:
1. Firewall ayarlarını kontrol edin
2. IP adresinin doğru olduğundan emin olun
3. Her iki sunucunun da çalıştığını doğrulayın
4. Router'ın AP Isolation özelliğinin kapalı olduğundan emin olun

---

**Son Güncelleme:** Ekim 2025

