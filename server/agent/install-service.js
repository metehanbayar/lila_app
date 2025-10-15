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
  console.log('📝 Önce setup.js çalıştırarak ayarları yapın:');
  console.log('   node setup.js');
  process.exit(1);
}

// Config oku
let config;
try {
  const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
  config = JSON.parse(configData);
} catch (error) {
  console.error('❌ Config dosyası okunamadı:', error.message);
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║   Windows Servisi Kurulum                         ║');
console.log('╚════════════════════════════════════════════════════╝\n');

console.log(`🏪 Restoran: ${config.restaurantName} (ID: ${config.restaurantId})`);
console.log(`🌐 Sunucu: ${config.serverUrl}\n`);

// Servis oluştur
const svc = new Service({
  name: `LilaGroupPrinter_${config.restaurantId}`,
  description: `Lila Group Otomatik Fiş Yazdırma Servisi - ${config.restaurantName}`,
  script: path.join(__dirname, 'agent.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
});

// Servis kurulum olayları
svc.on('install', () => {
  console.log('✅ Servis başarıyla kuruldu!');
  console.log(`📋 Servis Adı: ${svc.name}`);
  console.log('\n▶️  Servisi başlatmak için Windows Hizmetler panelini kullanın veya:');
  console.log(`   sc start "${svc.name}"`);
  console.log('\n🔍 Servis durumunu kontrol etmek için:');
  console.log('   services.msc (Windows Hizmetler)\n');
  
  // Servisi otomatik başlat
  svc.start();
});

svc.on('start', () => {
  console.log('✅ Servis başlatıldı!');
  console.log('🖨️  Artık siparişler otomatik olarak yazdırılacak.\n');
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️  Servis zaten kurulu!');
  console.log('📝 Önce kaldırıp tekrar kurmak için:');
  console.log('   node uninstall-service.js');
  console.log('   node install-service.js\n');
});

svc.on('error', (err) => {
  console.error('❌ Servis kurulum hatası:', err.message);
  console.log('\n💡 İpucu: Bu scripti Yönetici olarak çalıştırmanız gerekir.');
  console.log('   PowerShell veya CMD\'yi "Yönetici olarak çalıştır" ile açın.\n');
});

// Servisi kur
console.log('⏳ Servis kuruluyor...\n');
svc.install();

