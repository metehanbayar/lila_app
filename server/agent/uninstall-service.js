#!/usr/bin/env node

import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, 'config.json');

// Config kontrolü
if (!fs.existsSync(CONFIG_FILE)) {
  console.error('❌ HATA: config.json bulunamadı!');
  console.log('⚠️  Restoran ID\'yi manuel olarak girmeniz gerekebilir.\n');
}

// Config oku
let config = { restaurantId: null, restaurantName: 'Bilinmiyor' };
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = JSON.parse(configData);
  }
} catch (error) {
  console.error('⚠️  Config dosyası okunamadı:', error.message);
}

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║   Windows Servisi Kaldırma                        ║');
console.log('╚════════════════════════════════════════════════════╝\n');

if (!config.restaurantId) {
  console.error('❌ Restoran ID bulunamadı!');
  console.log('📝 Manuel olarak kaldırmak için Windows Hizmetler panelini kullanın:');
  console.log('   1. services.msc çalıştırın');
  console.log('   2. "LilaGroupPrinter_*" servisini bulun');
  console.log('   3. Sağ tıklayıp "Durdur" ve "Kaldır" seçeneklerini kullanın\n');
  process.exit(1);
}

console.log(`🏪 Restoran: ${config.restaurantName} (ID: ${config.restaurantId})\n`);

// Servis oluştur
const svc = new Service({
  name: `LilaGroupPrinter_${config.restaurantId}`,
  script: path.join(__dirname, 'agent.js'),
});

// Servis kaldırma olayları
svc.on('uninstall', () => {
  console.log('✅ Servis başarıyla kaldırıldı!\n');
});

svc.on('alreadyuninstalled', () => {
  console.log('⚠️  Servis zaten kaldırılmış!\n');
});

svc.on('error', (err) => {
  console.error('❌ Servis kaldırma hatası:', err.message);
  console.log('\n💡 İpucu: Bu scripti Yönetici olarak çalıştırmanız gerekir.');
  console.log('   PowerShell veya CMD\'yi "Yönetici olarak çalıştır" ile açın.\n');
});

// Servisi kaldır
console.log('⏳ Servis kaldırılıyor...\n');
svc.uninstall();

