# 🖨️ Lila Printer Client

Windows uygulaması - Socket.IO ile otomatik sipariş yazdırma

## ✅ TAMAMLANAN BÖLÜMLER

### 1. Temel Altyapı
- ✅ Proje yapısı oluşturuldu
- ✅ NuGet paketleri eklendi (SocketIOClient, Newtonsoft.Json)
- ✅ Klasör yapısı hazır (Services, Models, UI, Utils, Resources)

### 2. Veri Modelleri
- ✅ OrderData.cs - Sipariş veri modeli
- ✅ OrderItem.cs - Sipariş kalemi modeli
- ✅ AppConfig.cs - Uygulama yapılandırması

### 3. Servisler
- ✅ ConfigService.cs - Yapılandırma yönetimi
- ✅ SocketService.cs - Socket.IO bağlantı ve iletişim
- ✅ PrinterService.cs - Yazıcı işlemleri ve fiş yazdırma

### 4. UI
- ✅ TrayApplicationContext.cs - System tray uygulaması
- ✅ SetupWizardForm.cs - İlk kurulum sihirbazı
- ✅ Program.cs - Ana giriş noktası

## 🚀 NASIL KULLANILIR

### İlk Çalıştırma

1. Uygulamayı çalıştır:
   ```bash
   dotnet run
   ```

2. İlk açılışta kurulum wizard'ı açılır:
   - Sunucu URL gir (örn: `http://localhost:3000`)
   - Restoran ID gir (örn: `1`)
   - Restoran adı gir (örn: `Lila Gourmet`)
   - Yazıcı seç (listeden)
   - Test Yazdır
   - Kaydet

3. Uygulama sistem tepsisine gider (tray icon)

4. Artık siparişler otomatik yazdırılacak!

### System Tray Menüsü

- **Durum:** Bağlantı durumunu gösterir
- **Ayarlar:** Ayarlar sayfası (yakında)
- **Test Yazdır:** Test fişi yazdırır
- **Çıkış:** Uygulamadan çıkar

## 🧪 TEST ETME

### 1. Backend Başlat

```bash
cd server
npm run dev
```

Backend `http://localhost:3000` adresinde çalışmalı.

### 2. Client Başlat

```bash
cd LilaPrinterClient/LilaPrinterClient
dotnet run
```

### 3. Test Siparişi Gönder

Postman ile:

```http
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "customerName": "Test Müşteri",
  "customerPhone": "0555 123 4567",
  "customerAddress": "Test Adres",
  "notes": "Test sipariş",
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "customerId": 1
}
```

### 4. Sonuç

- Client console'da sipariş bilgisi görünmeli
- Yazıcıdan fiş çıkmalı
- Balloon notification gösterilmeli

## 📦 EXE OLUŞTURMA

### Development Build

```bash
dotnet build -c Release
```

EXE: `bin\Release\net6.0-windows\LilaPrinterClient.exe`

### Tek EXE (Self-Contained)

```bash
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

EXE: `bin\Release\net6.0-windows\win-x64\publish\LilaPrinterClient.exe`

**Boyut:** ~80-100 MB (tüm .NET runtime dahil)

### Trimmed (Küçük Boyut)

```bash
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:PublishTrimmed=true
```

**Boyut:** ~40-60 MB

## 📁 CONFIG DOSYASI

Uygulama ayarları şurada saklanır:

```
%AppData%\LilaPrinterClient\config.json
```

Örnek içerik:

```json
{
  "serverUrl": "http://localhost:3000",
  "restaurantId": 1,
  "restaurantName": "Lila Gourmet",
  "printerName": "EPSON TM-T88V",
  "autoStart": true,
  "autoPrint": true
}
```

## 🐛 SORUN GİDERME

### "Yazıcı bulunamadı" hatası

- Yazıcınız açık ve bağlı mı kontrol edin
- Windows yazıcı ayarlarından yazıcıyı görebiliyor musunuz?

### "Bağlantı hatası"

- Backend çalışıyor mu? (`http://localhost:3000/api/health`)
- Sunucu URL doğru mu?
- Firewall engelliyor olabilir

### Sipariş gelmiyor

- Console'da "Socket.IO bağlandı" mesajı var mı?
- Restoran ID doğru mu?
- Backend'de sipariş oluşturulurken `notifyNewOrder()` çağrılıyor mu?

## 📝 YAPILACAKLAR (TODO)

- [ ] Özel tray icon ekle (Resources/icon.ico)
- [ ] Ayarlar formu ekle (yazıcı, sunucu değiştirme)
- [ ] Windows başlangıcında otomatik başlat (registry)
- [ ] Offline mode (bağlantı kopunca siparişleri kuyruğa al)
- [ ] Loglama (Serilog ile dosyaya log)
- [ ] Ses bildirimi (sipariş geldiğinde)
- [ ] Çoklu yazıcı desteği (mutfak + kasa)
- [ ] Auto-update mekanizması
- [ ] Fiş template'i özelleştirilebilir yap
- [ ] Logo ekle (fiş başlığına)

## 🎯 SONRAKI ADIMLAR

1. **Backend'i başlat** ve test et
2. **Client'ı çalıştır** ve kurulumu tamamla
3. **Test siparişi gönder** ve yazdırmayı kontrol et
4. **EXE oluştur** ve diğer bilgisayarlarda test et
5. **Production kurulum** için hazırla

## 📞 DESTEK

Sorun yaşarsanız:

1. Console çıktısını kontrol edin
2. Config dosyasını kontrol edin (`%AppData%\LilaPrinterClient\config.json`)
3. Backend loglarına bakın
4. Backend'de Socket.IO çalışıyor mu kontrol edin

---

**Geliştirici:** Lila Group
**Versiyon:** 1.0.0
**Tarih:** 15 Ekim 2024

