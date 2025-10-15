#!/usr/bin/env node

/**
 * Lila Group Printer Agent
 * Otomatik sipariş yazdırma servisi
 * 
 * Zero-config: Agent parametreler embedded olarak gelir
 */

import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { printReceipt, printTest, getDefaultPrinter } from './printer.js';
import { installService, uninstallService, isServiceInstalled } from './service.js';
import { createTrayIcon, showNotification, updateTrayStatus } from './tray.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Embedded config'i yükle (build sırasında inject edilir)
let config;
try {
  const configPath = path.join(__dirname, '..', 'embedded-config.json');
  const configData = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(configData);
  console.log(`✅ Config yüklendi: ${config.restaurantName}`);
} catch (error) {
  console.error('❌ Config yüklenemedi:', error.message);
  console.error('⚠️  Bu agent sadece özelleştirilmiş build ile çalışır.');
  process.exit(1);
}

// Global state
let socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 999999; // Sonsuz deneme
let isConnected = false;
let printerName = null;

/**
 * Agent'ı başlat
 */
async function start() {
  try {
    console.log('\n🖨️  Lila Group Printer Agent');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Restoran: ${config.restaurantName}`);
    console.log(`🔗 Sunucu: ${config.serverUrl}`);
    console.log(`📅 Build: ${new Date(config.buildDate).toLocaleString('tr-TR')}`);
    console.log(`📦 Versiyon: ${config.version}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Yazıcıyı tespit et
    if (config.useDefaultPrinter) {
      printerName = await getDefaultPrinter();
      console.log(`🖨️  Varsayılan yazıcı: ${printerName || 'Bulunamadı'}`);
    }

    // Test modu
    if (process.argv.includes('--test')) {
      console.log('\n🧪 Test modu aktif');
      await testPrint();
      return;
    }

    // Service kurulumu kontrolü
    const serviceInstalled = await isServiceInstalled();
    
    if (!serviceInstalled && !process.argv.includes('--no-service')) {
      console.log('🔧 Windows servisi kuruluyor...');
      await installService();
      console.log('✅ Servis kuruldu ve başlatıldı');
      console.log('ℹ️  Agent artık sistem başlangıcında otomatik çalışacak');
      
      // Kurulum tamamlandı mesajı
      showNotification('Kurulum Tamamlandı!', 
        `${config.restaurantName} yazıcı agent'ı başarıyla kuruldu ve çalışıyor.`);
    }

    // System tray icon oluştur
    if (!process.argv.includes('--no-tray')) {
      createTrayIcon({
        restaurantName: config.restaurantName,
        onQuit: () => {
          console.log('👋 Kullanıcı tarafından kapatıldı');
          process.exit(0);
        },
        onReconnect: () => {
          console.log('🔄 Manuel yeniden bağlanma...');
          connectToServer();
        },
        onTestPrint: () => {
          testPrint();
        },
      });
    }

    // Sunucuya bağlan
    connectToServer();

    // Graceful shutdown
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error('❌ Başlatma hatası:', error);
    process.exit(1);
  }
}

/**
 * Sunucuya Socket.IO ile bağlan
 */
function connectToServer() {
  console.log(`\n🔌 Sunucuya bağlanılıyor: ${config.serverUrl}`);

  socket = io(config.serverUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });

  // Bağlantı kurulduğunda
  socket.on('connect', async () => {
    console.log('✅ Sunucuya bağlandı');
    isConnected = true;
    reconnectAttempts = 0;
    updateTrayStatus('connected');

    // Authenticate
    const authData = {
      token: config.token,
      version: config.version,
      computerName: os.hostname(),
      printerName: printerName,
    };

    console.log('🔐 Kimlik doğrulama yapılıyor...');
    socket.emit('agent:authenticate', authData);
  });

  // Kimlik doğrulama başarılı
  socket.on('agent:authenticated', (data) => {
    console.log(`✅ Kimlik doğrulandı: ${data.restaurantName}`);
    console.log('🎧 Siparişler dinleniyor...\n');
    
    showNotification('Agent Çalışıyor', 
      `${data.restaurantName} siparişleri dinleniyor. Yazıcı hazır!`);
    
    // Heartbeat başlat
    startHeartbeat();
  });

  // Kimlik doğrulama hatası
  socket.on('agent:auth-error', (data) => {
    console.error('❌ Kimlik doğrulama hatası:', data.message);
    updateTrayStatus('error');
    
    showNotification('Bağlantı Hatası', data.message);
    
    // Token geçersizse tekrar deneme
    if (data.message.includes('Geçersiz')) {
      setTimeout(() => process.exit(1), 5000);
    }
  });

  // Yeni sipariş geldi
  socket.on('order:new', async (orderData) => {
    console.log(`\n📥 Yeni sipariş: ${orderData.orderNumber}`);
    console.log(`   Müşteri: ${orderData.customerName}`);
    console.log(`   Tutar: ${orderData.subtotal.toFixed(2)} TL`);
    console.log(`   Ürün sayısı: ${orderData.items.length}`);
    
    // Yazdır
    await printOrder(orderData);
  });

  // Test yazdırma
  socket.on('order:test', async (testData) => {
    console.log('\n🧪 Test yazdırma alındı');
    await printOrder(testData);
  });

  // Bekleyen siparişler
  socket.on('orders:pending', async (orders) => {
    if (orders.length > 0) {
      console.log(`\n📋 ${orders.length} bekleyen sipariş bulundu`);
      
      for (const order of orders) {
        console.log(`   - ${order.orderNumber}`);
        await printOrder(order);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
      }
    }
  });

  // Heartbeat ack
  socket.on('agent:heartbeat-ack', (data) => {
    // Silent
  });

  // Bağlantı koptuğunda
  socket.on('disconnect', (reason) => {
    console.log(`\n⚠️  Bağlantı koptu: ${reason}`);
    isConnected = false;
    updateTrayStatus('disconnected');
    
    if (reason === 'io server disconnect') {
      // Sunucu bağlantıyı kesti, yeniden bağlan
      socket.connect();
    }
  });

  // Bağlantı hatası
  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    
    if (reconnectAttempts === 1) {
      console.error('❌ Bağlantı hatası:', error.message);
      updateTrayStatus('error');
    }
    
    if (reconnectAttempts % 10 === 0) {
      console.log(`🔄 Yeniden bağlanma denemesi: ${reconnectAttempts}`);
    }
  });

  // Yeniden bağlanma
  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Yeniden bağlandı (${attemptNumber} deneme)`);
    isConnected = true;
    reconnectAttempts = 0;
    updateTrayStatus('connected');
  });
}

/**
 * Heartbeat gönder (her 30 saniyede bir)
 */
function startHeartbeat() {
  setInterval(() => {
    if (socket && isConnected) {
      socket.emit('agent:heartbeat');
    }
  }, 30000); // 30 saniye
}

/**
 * Sipariş yazdır
 */
async function printOrder(orderData) {
  try {
    console.log(`🖨️  Yazdırılıyor: ${orderData.orderNumber}...`);
    
    if (!printerName) {
      throw new Error('Yazıcı bulunamadı');
    }

    const result = await printReceipt(printerName, orderData);
    
    if (result.success) {
      console.log(`✅ Yazdırıldı: ${orderData.orderNumber}`);
      
      // Sunucuya onay gönder
      if (socket && !orderData.isTest) {
        socket.emit('print:confirm', {
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          status: 'success',
        });
      }
      
      showNotification('Sipariş Yazdırıldı', 
        `#${orderData.orderNumber} - ${orderData.customerName}`);
      
    } else {
      throw new Error(result.error || 'Yazdırma hatası');
    }
    
  } catch (error) {
    console.error(`❌ Yazdırma hatası: ${error.message}`);
    
    // Sunucuya hata bildir
    if (socket && !orderData.isTest) {
      socket.emit('print:confirm', {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        status: 'failed',
        errorMessage: error.message,
      });
    }
    
    showNotification('Yazdırma Hatası!', 
      `Sipariş ${orderData.orderNumber} yazdırılamadı: ${error.message}`);
  }
}

/**
 * Test yazdırma
 */
async function testPrint() {
  try {
    console.log('\n🧪 Test yazdırma yapılıyor...');
    
    if (!printerName) {
      printerName = await getDefaultPrinter();
    }
    
    if (!printerName) {
      throw new Error('Yazıcı bulunamadı!');
    }
    
    const result = await printTest(printerName, config.restaurantName);
    
    if (result.success) {
      console.log('✅ Test yazdırma başarılı!');
      showNotification('Test Başarılı', 'Yazıcınız çalışıyor!');
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error(`❌ Test hatası: ${error.message}`);
    showNotification('Test Hatası', error.message);
  }
}

/**
 * Temizlik ve kapat
 */
async function cleanup() {
  console.log('\n\n👋 Agent kapatılıyor...');
  
  if (socket) {
    socket.disconnect();
  }
  
  process.exit(0);
}

// Agent'ı başlat
start().catch((error) => {
  console.error('❌ Fatal hata:', error);
  process.exit(1);
});

