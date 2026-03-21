# Lila Printer Client

Windows tray uygulaması olarak çalışır ve `order:new` event'lerini dinleyip fiş yazdırır.

## Çalışma Mantığı

- ilk açılışta config yoksa kurulum sihirbazı açılır
- config varsa uygulama system tray'e yerleşir
- Socket.IO ile backend'e bağlanır
- restoran filtresi istemci tarafında `RestaurantId` ile yapılır
- yeni sipariş gelince seçili yazıcıya fiş basılır

## Temel Özellikler

- ilk kurulum sihirbazı
- ayarlar formu
- tray menüsü
- test yazdırma
- template indirme desteği
- otomatik sipariş yazdırma

## Başlatma

```bash
cd LilaPrinterClient/LilaPrinterClient
dotnet run
```

Backend ayrıca çalışıyor olmalıdır:

```bash
cd server
npm run dev
```

## Kurulumda İstenen Bilgiler

- server URL
- restaurant ID
- restaurant adı
- yazıcı adı

Config dosyası kullanıcı profilinde saklanır:

```text
%AppData%\LilaPrinterClient\config.json
```

## Tray Menüsü

- durum
- ayarlar
- test yazdır
- çıkış

## Sorun Giderme

### Bağlanmıyor

- backend `http://localhost:3300/api/health` cevap veriyor mu kontrol edin
- server URL doğru mu kontrol edin
- firewall engeli var mı kontrol edin

### Sipariş gelmiyor

- restaurant ID doğru mu kontrol edin
- backend sipariş oluşturunca socket event yayınlıyor mu kontrol edin

### Yazdırmıyor

- yazıcı adı doğru mu kontrol edin
- Windows yazıcıya erişebiliyor mu kontrol edin
- tray menüsünden test yazdırma deneyin

## İlgili Dosyalar

- `LilaPrinterClient/LilaPrinterClient/Program.cs`
- `LilaPrinterClient/LilaPrinterClient/UI/SetupWizardForm.cs`
- `LilaPrinterClient/LilaPrinterClient/UI/SettingsForm.cs`
- `LilaPrinterClient/LilaPrinterClient/UI/TrayApplicationContext.cs`
- `LilaPrinterClient/LilaPrinterClient/Services/SocketService.cs`
- `LilaPrinterClient/LilaPrinterClient/Services/PrinterService.cs`
