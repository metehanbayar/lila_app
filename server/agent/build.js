#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║   EXE Oluşturma İşlemi Başlıyor                   ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// Dist klasörünü oluştur
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ dist klasörü oluşturuldu');
}

// pkg ile exe oluştur
console.log('⏳ EXE dosyası oluşturuluyor (Bu işlem birkaç dakika sürebilir)...\n');

const pkgCommand = 'pkg . --targets node18-win-x64 --compress GZip --output dist/LilaGroupPrinterAgent.exe';

exec(pkgCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ EXE oluşturma hatası:', error.message);
    console.error(stderr);
    process.exit(1);
  }

  console.log(stdout);
  console.log('✅ EXE dosyası başarıyla oluşturuldu!');
  
  // Setup dosyalarını kopyala
  console.log('\n⏳ Yardımcı dosyalar kopyalanıyor...\n');
  
  const filesToCopy = [
    'setup.js',
    'install-service.js',
    'uninstall-service.js',
    'config.example.json',
    'package.json'
  ];

  filesToCopy.forEach(file => {
    const source = path.join(__dirname, file);
    const dest = path.join(distDir, file);
    
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, dest);
      console.log(`✅ ${file} kopyalandı`);
    }
  });

  // README.txt oluştur
  const readmeContent = `LILA GROUP - Otomatik Fiş Yazdırma Servisi
===========================================

KURULUM:

1. Node.js kurulumu GEREKMEZ - Tek dosya olarak çalışır

2. Ayarları yapılandırın:
   - config.example.json dosyasını config.json olarak kopyalayın
   - config.json içindeki bilgileri doldurun:
     * serverUrl: API sunucunuzun adresi (örn: http://192.168.1.100:3000)
     * restaurantId: Restoranınızın ID numarası
     * restaurantName: Restoranınızın adı
     * printerName: Yazıcı adı (boş bırakılırsa varsayılan yazıcı kullanılır)
     * testMode: Test için true, gerçek yazdırma için false

3. Windows Servisi olarak kurulum:
   a) PowerShell veya CMD'yi YÖNETİCİ OLARAK açın
   b) Bu klasöre gidin (cd komutu ile)
   c) Şu komutu çalıştırın:
      LilaGroupPrinterAgent.exe install-service.js

4. Servisi başlatın:
   - Windows Hizmetler panelini açın (services.msc)
   - "LilaGroupPrinter_[RestaurantID]" servisini bulun
   - Başlat butonuna tıklayın
   - Otomatik başlangıç için: Sağ tıklayıp Özellikler > Başlangıç türü: Otomatik

KALDIRMA:

1. PowerShell veya CMD'yi YÖNETİCİ OLARAK açın
2. Bu klasöre gidin
3. Şu komutu çalıştırın:
   LilaGroupPrinterAgent.exe uninstall-service.js

SORUN GİDERME:

- Yazıcı bulunamıyor: USB yazıcınızın takılı ve açık olduğundan emin olun
- Sunucuya bağlanamıyor: serverUrl'in doğru olduğunu kontrol edin
- Test modu: Önce testMode:true ile deneyin, konsola yazdırır

DESTEK:

Sorun yaşıyorsanız lütfen sistem yöneticinizle iletişime geçin.

Versiyon: 1.0.0
`;

  fs.writeFileSync(path.join(distDir, 'OKUBENI.txt'), readmeContent, 'utf8');
  console.log('✅ OKUBENI.txt oluşturuldu');

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   EXE Paketi Hazır!                               ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log('📦 Dosyalar dist klasöründe:');
  console.log('   - LilaGroupPrinterAgent.exe');
  console.log('   - config.example.json');
  console.log('   - OKUBENI.txt');
  console.log('\n📤 dist klasörünü şubelere dağıtabilirsiniz!\n');
});

