# 🖨️ Otomatik Yazıcı Agent Sistemi

## Genel Bakış

Bu sistem, sipariş alındığında ilgili restoranların yazıcılarından **otomatik olarak** fiş çıkmasını sağlar. Birden fazla restorandan sipariş verildiğinde, her restorana ayrı fiş basılır.

## ✨ Özellikler

### Zero-Config Kurulum
- ✅ Kullanıcı hiçbir ayar yapmaz
- ✅ Admin panelden link oluşturulur
- ✅ Link açılır, EXE indirilir
- ✅ EXE çalıştırılır
- ✅ Sistem otomatik kurulur ve çalışır!

### Otomatik Yazdırma
- ✅ Sipariş geldiğinde anında yazdırılır
- ✅ Restoran bazında ayrı fişler
- ✅ Çoklu restoran desteği (bir sepette birden fazla restoran)
- ✅ Kupon ve indirim bilgileri
- ✅ Ürün varyantları desteği

### Güvenilirlik
- ✅ Windows servisi olarak çalışır
- ✅ Bilgisayar açıldığında otomatik başlar
- ✅ Bağlantı kopsa bile otomatik yeniden bağlanır
- ✅ Yazdırma hataları takip edilir
- ✅ Offline mod (bağlantı kopunca siparişler kuyrukta bekler)

### İzleme ve Yönetim
- ✅ Admin panelden tüm agent'ları görüntüleme
- ✅ Gerçek zamanlı durum takibi
- ✅ Yazdırma geçmişi
- ✅ Test yazdırma
- ✅ Uzaktan yönetim

## 📋 Nasıl Çalışır?

### 1. Admin Panelde Kurulum Linki Oluşturma

Admin panelde "Yazıcı Agent Yönetimi" sayfasına gidin:

```
Restoranlar > [Restoran Seç] > Agent Ekle
```

Sistem size özel bir indirme linki oluşturur:
```
https://yoursite.com/api/agent/download/LG-K7M2-P9X4-H3N8
```

Bu link:
- ✅ Sadece o restoran için geçerlidir
- ✅ 48 saat geçerlidir
- ✅ Embedded config içerir (restoran ID, sunucu URL, token)

### 2. Agent Kurulumu

Kullanıcı (restoran çalışanı):

1. Linke tıklar
2. `LilaGroup_RestoranAdi_Printer.exe` indirilir
3. EXE'yi çalıştırır
4. Program:
   - Varsayılan yazıcıyı tespit eder
   - Windows servisi olarak kurulur
   - Sunucuya bağlanır
   - Test yazdırması yapar
   - "Kurulum tamamlandı" mesajı gösterir

### 3. Sipariş Süreci

```
Müşteri Sipariş Verir
        ↓
Backend: Sipariş kaydedilir
        ↓
Backend: Ürünler restoranlarına göre gruplandırılır
        ↓
Backend: Socket.io ile her restorana bildirim gönderilir
        ↓
Agent: Bildirimi alır
        ↓
Agent: Fişi yazdırır
        ↓
Agent: Sunucuya onay gönderir
        ↓
Admin Panel: Yazdırıldı ✅
```

## 🏗️ Teknik Mimari

### Veritabanı Yapısı

```sql
-- Restoranlar tablosuna eklenen kolonlar
AgentToken          -- Benzersiz agent token'ı
AgentStatus         -- connected, disconnected, error
AgentLastSeen       -- Son bağlantı zamanı
AgentVersion        -- Agent versiyonu
AgentComputerName   -- Bilgisayar adı
PrinterName         -- Yazıcı adı
AutoPrint           -- Otomatik yazdırma aktif mi?

-- AgentTokens tablosu
Id, Token, RestaurantId, Status, CreatedAt, ExpiresAt, DownloadCount

-- OrderRestaurants tablosu
Id, OrderId, RestaurantId, Subtotal, IsPrinted, PrintedAt

-- PrintHistory tablosu
Id, OrderId, RestaurantId, AgentToken, PrinterName, Status, ErrorMessage

-- AgentLogs tablosu
Id, RestaurantId, AgentToken, LogLevel, Message, Details
```

### Backend API Endpoints

```javascript
// Admin - Agent Yönetimi
POST   /api/admin/printer/restaurants/:id/generate-token
GET    /api/admin/printer/restaurants/:id/agent-status
PUT    /api/admin/printer/restaurants/:id/printer-settings
DELETE /api/admin/printer/restaurants/:id/revoke-token
GET    /api/admin/printer/agents
GET    /api/admin/printer/restaurants/:id/logs

// Agent - Public Endpoints
GET    /api/agent/download/:token
GET    /api/agent/setup/:token
POST   /api/agent/heartbeat
POST   /api/agent/print-confirmation
```

### Socket.io Events

```javascript
// Agent -> Server
'agent:authenticate'    // Kimlik doğrulama
'agent:heartbeat'       // Canlılık kontrolü (30 saniyede bir)
'print:confirm'         // Yazdırma onayı

// Server -> Agent
'agent:authenticated'   // Kimlik doğrulama başarılı
'agent:auth-error'      // Kimlik doğrulama hatası
'order:new'             // Yeni sipariş
'order:test'            // Test yazdırma
'orders:pending'        // Bekleyen siparişler (bağlantıda)
'agent:heartbeat-ack'   // Heartbeat onayı
```

### Agent Yapısı

```
server/agent/
├── package.json           # Dependencies
├── build.js              # Build scripti
├── embedded-config.json  # Template config
├── src/
│   ├── main.js          # Ana program
│   ├── printer.js       # Yazıcı kontrolü
│   ├── service.js       # Windows servisi
│   └── tray.js          # System tray icon
├── builds/              # Geçici build dosyaları
└── dist/                # Derlenmiş EXE'ler
```

## 🔧 Kurulum ve Çalıştırma

### 1. Veritabanı Migration'ı Çalıştır

```sql
-- SQL Server'da çalıştır
C:\Users\meteh\Desktop\globalmenu\server\database\migrations\add-printer-agent-system.sql
```

### 2. Backend Bağımlılıklarını Kur

```bash
cd server
npm install socket.io
```

### 3. Agent Bağımlılıklarını Kur

```bash
cd server/agent
npm install
```

### 4. Backend'i Başlat

```bash
cd server
npm run dev
```

Backend başladığında Socket.io da otomatik başlar.

### 5. Template Agent'ı Build Et (Opsiyonel)

```bash
cd server/agent
npm run build
```

Bu, `dist/LilaGroupPrinterAgent-Template.exe` dosyasını oluşturur.

**Not:** Template build opsiyoneldir. Sistem her token için dinamik olarak build yapar.

## 📱 Kullanım

### Admin Olarak

1. Admin panele giriş yap
2. "Yazıcı Agent Yönetimi" sayfasına git
3. İlgili restoranın yanındaki "Agent Ekle" butonuna tıkla
4. Oluşan linki kopyala
5. Linki restoran bilgisayarına gönder (WhatsApp, mail vb.)

### Restoran Çalışanı Olarak

1. Admin'den gelen linke tıkla
2. İndirilen `LilaGroup_RestoranAdi_Printer.exe` dosyasını çalıştır
3. Program otomatik kurulur
4. "Kurulum tamamlandı" mesajını bekle
5. BİTTİ! Artık siparişler otomatik yazdırılacak

### Sipariş Alındığında

Sistem otomatik olarak:
1. Siparişi restoranlarına göre ayırır
2. Her restorana Socket.io ile bildirim gönderir
3. Agent fişi yazdırır
4. Yazdırma durumunu loglar
5. Admin panelde "Yazdırıldı" işaretlenir

## 🧪 Test Etme

### Backend Test

```bash
# Sunucu çalışıyor mu?
curl http://localhost:3000/api/health

# Socket.io çalışıyor mu?
# Tarayıcı console:
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('Connected!'));
```

### Agent Test

```bash
cd server/agent
node src/main.js --test
```

Bu komut:
- Yazıcıyı tespit eder
- Test fişi yazdırır
- Çıkar

### Admin Panel Test

1. Yeni token oluştur
2. Download linkini tıkla
3. EXE'yi çalıştır
4. "Agent Durumu" sayfasında "Bağlı" olarak görünmeli
5. "Test Yazdır" butonuna bas
6. Yazıcıdan test fişi çıkmalı

## 📊 İzleme ve Sorun Giderme

### Agent Durumu Kontrol

Admin panelde:
```
Yazıcı Agent Yönetimi > [Restoran] > Detay
```

Burada görebilirsiniz:
- Agent durumu (bağlı/bağlı değil)
- Son görülme zamanı
- Bilgisayar adı
- Yazıcı adı
- Bekleyen siparişler
- Yazdırma geçmişi
- Hata logları

### Yaygın Sorunlar ve Çözümleri

**1. Agent bağlanmıyor**
- ✅ Firewall kontrol et (Port 3000 açık mı?)
- ✅ SERVER_URL doğru mu? (.env dosyası)
- ✅ Token geçerli mi? (48 saat)

**2. Yazdırmıyor**
- ✅ Yazıcı bağlı mı? (Windows ayarlarından kontrol)
- ✅ Default printer olarak ayarlı mı?
- ✅ Test yazdırma çalışıyor mu?

**3. Çift yazdırıyor**
- ✅ Aynı restoran için birden fazla agent kurulmuş olabilir
- ✅ Admin panelden eski token'ları iptal et

**4. Windows servisi çalışmıyor**
- ✅ Administrator olarak çalıştır
- ✅ `services.msc` > "LilaGroupPrinterAgent" durumuna bak
- ✅ Manuel başlatmayı dene

### Loglar

**Backend Logları:**
```
server/
  console çıktıları (Socket.io bağlantıları, yazdırma bildirimleri)
```

**Agent Logları:**
```
Windows Event Viewer > Windows Logs > Application
  Kaynak: LilaGroupPrinterAgent
```

**Veritabanı Logları:**
```sql
-- Agent logları
SELECT * FROM AgentLogs WHERE RestaurantId = 1 ORDER BY CreatedAt DESC;

-- Yazdırma geçmişi
SELECT * FROM PrintHistory WHERE RestaurantId = 1 ORDER BY PrintedAt DESC;

-- Bekleyen siparişler
SELECT * FROM OrderRestaurants WHERE RestaurantId = 1 AND IsPrinted = 0;
```

## 🔐 Güvenlik

### Token Güvenliği
- ✅ Her token benzersiz ve tahmin edilemez
- ✅ 48 saat geçerli
- ✅ Tek kullanımlık (aktivasyondan sonra iptal edilebilir)
- ✅ Restoran bazında izole

### İletişim Güvenliği
- ✅ Socket.io authentication
- ✅ HTTPS kullanımı önerilir (production)
- ✅ CORS yapılandırması

### Agent Güvenliği
- ✅ Embedded credentials (EXE içinde)
- ✅ Windows servisi olarak güvenli çalışma
- ✅ Heartbeat ile canlılık kontrolü

## 📈 Performans

### Ölçeklenebilirlik
- ✅ 100+ eş zamanlı agent desteği
- ✅ Socket.io clustering (ihtiyaç halinde)
- ✅ Redis adapter (çoklu sunucu için)

### Optimizasyon
- ✅ Agent build caching (aynı token tekrar istenirse cache'den)
- ✅ Eski build'leri otomatik temizleme (48 saat)
- ✅ Veritabanı indexleri

## 🚀 Production Notları

### Environment Variables

`.env` dosyasına ekle:
```env
# Socket.io için
SERVER_URL=https://yourdomain.com

# CORS
CORS_ORIGIN=https://yourdomain.com
```

### HTTPS Gereksinimi

Production'da HTTPS kullanın:
```bash
# Let's Encrypt ile SSL
certbot --nginx -d yourdomain.com
```

Socket.io otomatik olarak WSS (WebSocket Secure) kullanır.

### Firewall Ayarları

Server:
```
Port 3000 (HTTP/WebSocket) - Açık olmalı
```

Client (Agent):
```
Outbound 3000 - İzin verilmeli
```

### Backup

Düzenli yedekleme:
```sql
-- Agent verileri
BACKUP TABLE AgentTokens, PrintHistory, AgentLogs
```

## 📞 Destek

Sorun yaşarsanız:

1. **Logları kontrol edin**
2. **Admin panelden agent durumunu kontrol edin**
3. **Test yazdırma yapın**
4. **Agent'ı yeniden başlatın**
5. **Gerekirse yeni token oluşturup tekrar kurun**

---

## 🎉 Tebrikler!

Artık tam otomatik sipariş yazdırma sisteminiz hazır! 

Her sipariş geldiğinde:
- ✅ Otomatik yazdırılır
- ✅ Restoran bazında ayrılır
- ✅ Takip edilir
- ✅ Log tutulur

**Hiçbir manuel işlem gerekmez!** 🚀

