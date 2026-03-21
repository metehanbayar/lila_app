# Ağdan Erişim Rehberi

Bu rehber, geliştirme ortamını aynı yerel ağdaki başka cihazlardan açmak içindir.

## Gereksinimler

- cihazlar aynı Wi-Fi veya LAN üzerinde olmalı
- backend çalışmalı
- frontend dev server çalışmalı
- Windows Firewall gerekli portlara izin vermeli

## Kullanılan Portlar

- `3000`: backend API
- `5173`: frontend Vite dev server

## 1. Yerel IP Adresini Öğren

PowerShell:

```powershell
ipconfig
```

Örneğin:

```text
192.168.1.105
```

## 2. Firewall Kuralı Aç

Yönetici PowerShell ile:

```powershell
New-NetFirewallRule -DisplayName "GlobalMenu Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "GlobalMenu Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## 3. Sunucuları Başlat

Backend:

```powershell
cd server
npm run dev
```

Frontend:

```powershell
cd client
npm run dev
```

## 4. Başka Cihazdan Aç

Tarayıcıda:

```text
http://<YEREL-IP>:5173
```

Örnek:

```text
http://192.168.1.105:5173
```

## Nasıl Çalışır

- frontend ağdaki cihazdan `5173` üstünden açılır
- `/api` ve `/uploads` istekleri Vite proxy üzerinden backend `3000` portuna yönlenir
- bu yüzden aynı ağda görseller ve API çağrıları normalde çalışmalıdır

## Sorun Giderme

### Sayfa açılmıyor

- firewall kuralını kontrol edin
- doğru IP adresini kullandığınızdan emin olun
- frontend terminalinde `Network` adresi görünüyor mu kontrol edin

### API çalışmıyor

- backend gerçekten `3000` portunda açık mı kontrol edin
- `server/.env` içinde yanlış host veya CORS ayarı var mı kontrol edin

### Görseller gelmiyor

- `client/vite.config.js` içindeki `/uploads` proxy ayarını kontrol edin
- backend statik dosya servisi ve `server/uploads` içeriğini kontrol edin

## Not

Bu rehber development içindir. Production kurulum için [PRODUCTION-DEPLOYMENT.md](/C:/Users/meteh/Desktop/globalmenu/PRODUCTION-DEPLOYMENT.md) dosyasını kullanın.
