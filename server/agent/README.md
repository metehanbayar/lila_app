# Lila Group - Otomatik Fiş Yazdırma Servisi

Windows bilgisayarlarda çalışan, siparişleri otomatik olarak termal yazıcıya yazdıran agent uygulaması.

## Özellikler

- ✅ Otomatik sipariş bildirimi (WebSocket üzerinden)
- ✅ Termal yazıcı desteği (ESC/POS)
- ✅ Windows servisi olarak çalışma
- ✅ Tek EXE dosyası (Node.js kurulumu gerekmez)
- ✅ Birden fazla restoran desteği
- ✅ Otomatik yeniden bağlanma
- ✅ Test modu

## Geliştirme Ortamı Kurulumu

### Gereksinimler

- Node.js 18+
- Windows 10 veya üzeri
- USB termal yazıcı

### Kurulum

```bash
cd server/agent
npm install
```

### Ayarları Yapılandırma

```bash
node setup.js
```

İstenilen bilgiler:
- **Sunucu URL**: API sunucusunun adresi (örn: `http://192.168.1.100:3000`)
- **Restoran ID**: Restoranın veritabanındaki ID numarası
- **Restoran Adı**: Restoranın adı (fişte görünecek)
- **Test Modu**: Test için `y`, gerçek yazdırma için `n`
- **Yazıcı Adı**: Windows'ta tanımlı yazıcı adı (opsiyonel)

### Çalıştırma

```bash
node agent.js
```

### Test Modu

Test modunda fiş konsola yazdırılır, yazıcıya gönderilmez. İlk test için idealdir.

```json
{
  "testMode": true
}
```

## Üretim Kurulumu

### EXE Oluşturma

```bash
npm run build
```

Bu komut `dist` klasörüne şunları oluşturur:
- `LilaGroupPrinterAgent.exe` - Ana uygulama
- `config.example.json` - Örnek ayar dosyası
- `OKUBENI.txt` - Kullanım kılavuzu

### Şubelere Dağıtım

1. `dist` klasörünü şubeye kopyalayın
2. `config.example.json`'u `config.json` olarak kopyalayın
3. `config.json`'u şubeye göre düzenleyin
4. Windows servisini kurun (aşağıya bakın)

### Windows Servisi Kurulumu

**Yönetici olarak** PowerShell veya CMD açın:

```cmd
cd C:\path\to\dist
LilaGroupPrinterAgent.exe install-service.js
```

Servis otomatik olarak başlatılacaktır. Manuel kontrol için:

```cmd
# Servis durumunu kontrol et
sc query "LilaGroupPrinter_1"

# Servisi başlat
sc start "LilaGroupPrinter_1"

# Servisi durdur
sc stop "LilaGroupPrinter_1"
```

### Windows Servisi Kaldırma

**Yönetici olarak**:

```cmd
LilaGroupPrinterAgent.exe uninstall-service.js
```

## Konfigürasyon

### config.json

```json
{
  "serverUrl": "http://192.168.1.100:3000",
  "restaurantId": 1,
  "restaurantName": "Lila Gusto",
  "printerName": "",
  "printerVendorId": null,
  "printerProductId": null,
  "encoding": "cp857",
  "reconnectInterval": 5000,
  "testMode": false
}
```

**Parametreler:**

- `serverUrl`: API sunucusunun tam adresi
- `restaurantId`: **ZORUNLU** - Restoranın ID'si
- `restaurantName`: **ZORUNLU** - Restoran adı
- `printerName`: Windows yazıcı adı (boş bırakılabilir, varsayılan yazıcı kullanılır)
- `printerVendorId`: USB Vendor ID (gelişmiş)
- `printerProductId`: USB Product ID (gelişmiş)
- `encoding`: Karakter kodlaması (Türkçe için `cp857`)
- `reconnectInterval`: Yeniden bağlanma süresi (ms)
- `testMode`: Test modu (true = konsola yazdır)

## Nasıl Çalışır?

1. Agent başlatılır ve `config.json` okunur
2. WebSocket ile sunucuya bağlanır
3. Kendini restoran ID ile kaydeder
4. Sunucu, yeni sipariş geldiğinde ilgili restoranın agent'ına bildirim gönderir
5. Agent sipariş bilgilerini termal yazıcıya yazdırır
6. Birden fazla restorandan sipariş varsa, her restoran kendi fişini alır

## Sipariş Fişi Formatı

```
================================
        LILA GUSTO
================================
Sipariş No: LG241015001
Tarih: 15.10.2024 14:30
================================
Müşteri: Ahmet Yılmaz
Telefon: 0555 123 4567
Adres: Atatürk Cad. No: 123...
Not: Kapıyı çalın lütfen
================================
ÜRÜNLER
================================
Lahmacun (Büyük Boy)
  2 x 45.00 TL = 90.00 TL
Ayran
  2 x 5.00 TL = 10.00 TL
================================
Ara Toplam: 100.00 TL
İndirim (YENI20): 20.00 TL
--------------------------------
TOPLAM: 80.00 TL
================================

Afiyet olsun!

[Kesim]
```

## Sorun Giderme

### Yazıcı Bulunamıyor

- USB yazıcınızın takılı ve açık olduğundan emin olun
- Windows'ta yazıcı driver'larının kurulu olduğunu kontrol edin
- `testMode: true` ile konsola yazdırarak sistemin çalıştığını doğrulayın

### Sunucuya Bağlanamıyor

- `serverUrl` doğru mu?
- Sunucu çalışıyor mu?
- Firewall engel oluyor mu?
- Ağ bağlantısı var mı?

### Fiş Gelmiyor

- Agent çalışıyor mu?
- Doğru `restaurantId` kullanılıyor mu?
- WebSocket bağlantısı kurulu mu? (Agent konsoluna bakın)
- Sunucu loglarında bildirim gönderilmiş mi?

### Türkçe Karakterler Bozuk

- `encoding: "cp857"` kullanıldığından emin olun
- Yazıcınız Türkçe karakter setini destekliyor olmalı

### Servis Başlamıyor

- Yönetici yetkisiyle kuruldum mu?
- config.json doğru mu?
- Windows Event Viewer'da hata loglarına bakın

## Geliştirme

### Bağımlılıklar

- **socket.io-client**: WebSocket istemcisi
- **escpos**: Termal yazıcı ESC/POS protokolü
- **escpos-usb**: USB yazıcı desteği
- **node-windows**: Windows servisi desteği

### Kod Yapısı

```
server/agent/
├── agent.js              # Ana uygulama
├── setup.js              # Kurulum yardımcısı
├── install-service.js    # Windows servisi kurulum
├── uninstall-service.js  # Windows servisi kaldırma
├── build.js              # EXE oluşturma scripti
├── config.json           # Ayarlar (oluşturulur)
├── config.example.json   # Örnek ayarlar
├── package.json          # NPM bağımlılıkları
└── README.md            # Bu dosya
```

## Lisans

MIT

## Destek

Sorun yaşıyorsanız lütfen sistem yöneticinizle iletişime geçin.

