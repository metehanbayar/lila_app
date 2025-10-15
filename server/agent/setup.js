#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, 'config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   LILA GROUP - Fiş Yazdırma Servisi Kurulum     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Mevcut ayarları yükle
  let currentConfig = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      currentConfig = JSON.parse(configData);
      console.log('✅ Mevcut ayarlar bulundu\n');
    } catch (error) {
      console.log('⚠️  Mevcut ayarlar okunamadı, yeni ayarlar oluşturulacak\n');
    }
  }

  console.log('📝 Lütfen aşağıdaki bilgileri girin:\n');

  // Sunucu URL
  const serverUrl = await question(
    `Sunucu URL (Varsayılan: ${currentConfig.serverUrl || 'http://localhost:3000'}): `
  );

  // Restoran ID
  const restaurantIdInput = await question(
    `Restoran ID ${currentConfig.restaurantId ? `(Mevcut: ${currentConfig.restaurantId})` : ''}: `
  );

  // Restoran Adı
  const restaurantName = await question(
    `Restoran Adı ${currentConfig.restaurantName ? `(Mevcut: ${currentConfig.restaurantName})` : ''}: `
  );

  // Test Modu
  const testModeInput = await question(
    `Test Modu? (y/n) ${currentConfig.testMode !== undefined ? `(Mevcut: ${currentConfig.testMode ? 'y' : 'n'})` : '(Varsayılan: n)'}: `
  );

  // Yazıcı adı (test modu değilse)
  let printerName = currentConfig.printerName || '';
  if (!testModeInput.toLowerCase().startsWith('y')) {
    printerName = await question(
      `Yazıcı Adı (Boş bırakılırsa varsayılan yazıcı kullanılır)${currentConfig.printerName ? ` (Mevcut: ${currentConfig.printerName})` : ''}: `
    );
  }

  // Config oluştur
  const config = {
    serverUrl: serverUrl.trim() || currentConfig.serverUrl || 'http://localhost:3000',
    restaurantId: restaurantIdInput.trim()
      ? parseInt(restaurantIdInput.trim())
      : currentConfig.restaurantId,
    restaurantName: restaurantName.trim() || currentConfig.restaurantName || '',
    printerName: printerName.trim() || currentConfig.printerName || '',
    printerVendorId: currentConfig.printerVendorId || null,
    printerProductId: currentConfig.printerProductId || null,
    encoding: currentConfig.encoding || 'cp857',
    reconnectInterval: currentConfig.reconnectInterval || 5000,
    testMode: testModeInput.toLowerCase().startsWith('y'),
  };

  // Validasyon
  if (!config.restaurantId) {
    console.error('\n❌ HATA: Restoran ID gereklidir!');
    rl.close();
    process.exit(1);
  }

  if (!config.restaurantName) {
    console.error('\n❌ HATA: Restoran adı gereklidir!');
    rl.close();
    process.exit(1);
  }

  // Ayarları kaydet
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    console.log('\n✅ Ayarlar başarıyla kaydedildi!');
    console.log('\n📋 Ayar Özeti:');
    console.log(`   Sunucu URL: ${config.serverUrl}`);
    console.log(`   Restoran ID: ${config.restaurantId}`);
    console.log(`   Restoran Adı: ${config.restaurantName}`);
    console.log(`   Test Modu: ${config.testMode ? 'AÇIK' : 'KAPALI'}`);
    if (!config.testMode && config.printerName) {
      console.log(`   Yazıcı: ${config.printerName}`);
    }
    
    console.log('\n▶️  Servisi başlatmak için:');
    console.log('   node agent.js');
    console.log('\n▶️  Windows servisi olarak kurmak için:');
    console.log('   node install-service.js (Yönetici olarak çalıştırın)');
  } catch (error) {
    console.error('\n❌ Ayarlar kaydedilemedi:', error.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

setup();

