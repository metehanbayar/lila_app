#!/usr/bin/env node

import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import escpos from 'escpos';
import USB from 'escpos-usb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config dosyası yolu
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Varsayılan config
const DEFAULT_CONFIG = {
  serverUrl: 'http://localhost:3000',
  restaurantId: null,
  restaurantName: '',
  printerName: '',
  printerVendorId: null,
  printerProductId: null,
  encoding: 'cp857', // Türkçe karakter desteği için
  reconnectInterval: 5000,
  testMode: false, // Test modunda sadece console'a yazdır
};

class PrinterAgent {
  constructor() {
    this.config = this.loadConfig();
    this.socket = null;
    this.printer = null;
    this.reconnectTimer = null;
    this.isConnected = false;
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
        const config = JSON.parse(configData);
        console.log('✅ Ayarlar yüklendi');
        return { ...DEFAULT_CONFIG, ...config };
      } else {
        console.log('⚠️  Ayar dosyası bulunamadı, varsayılan ayarlar kullanılıyor');
        this.saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
    } catch (error) {
      console.error('❌ Ayarlar yüklenirken hata:', error.message);
      return DEFAULT_CONFIG;
    }
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
      console.log('✅ Ayarlar kaydedildi');
    } catch (error) {
      console.error('❌ Ayarlar kaydedilemedi:', error.message);
    }
  }

  start() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   LILA GROUP - Otomatik Fiş Yazdırma Servisi    ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Ayarları kontrol et
    if (!this.config.restaurantId) {
      console.error('❌ HATA: Restoran ID tanımlanmamış!');
      console.log('📝 Lütfen setup.js dosyasını çalıştırarak ayarları yapın:');
      console.log('   node setup.js');
      process.exit(1);
    }

    console.log(`🏪 Restoran: ${this.config.restaurantName} (ID: ${this.config.restaurantId})`);
    console.log(`🌐 Sunucu: ${this.config.serverUrl}`);
    console.log(`🖨️  Yazıcı: ${this.config.printerName || 'Varsayılan'}`);
    console.log(`🧪 Test Modu: ${this.config.testMode ? 'AÇIK' : 'KAPALI'}`);
    console.log('');

    this.connectToServer();
  }

  connectToServer() {
    console.log('🔌 Sunucuya bağlanılıyor...');

    this.socket = io(this.config.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.config.reconnectInterval,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('✅ Sunucuya bağlandı');
      this.isConnected = true;

      // Agent'ı kaydet
      this.socket.emit('agent:register', {
        restaurantId: this.config.restaurantId,
        agentVersion: '1.0.0',
      });
    });

    this.socket.on('agent:registered', (data) => {
      console.log(`✅ ${data.message}`);
      console.log('📡 Yeni siparişler dinleniyor...\n');
    });

    this.socket.on('new:order', (orderData) => {
      console.log(`\n🔔 YENİ SİPARİŞ GELDİ!`);
      console.log(`   Sipariş No: ${orderData.orderNumber}`);
      console.log(`   Restoran: ${orderData.restaurantName}`);
      console.log(`   Tutar: ${orderData.restaurantSubtotal.toFixed(2)} TL`);
      
      this.printReceipt(orderData);
    });

    this.socket.on('disconnect', () => {
      console.log('⚠️  Sunucu bağlantısı kesildi');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Bağlantı hatası:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Yeniden bağlanıldı (Deneme ${attemptNumber})`);
    });

    this.socket.on('pong', () => {
      // Heartbeat yanıtı
    });

    // Her 30 saniyede bir ping gönder
    setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  async printReceipt(orderData) {
    try {
      if (this.config.testMode) {
        this.printToConsole(orderData);
        return;
      }

      // Yazıcıya yazdır
      await this.printToThermalPrinter(orderData);
    } catch (error) {
      console.error('❌ Yazdırma hatası:', error.message);
      console.log('📄 Fiş bilgileri console\'a yazdırılıyor:\n');
      this.printToConsole(orderData);
    }
  }

  printToConsole(orderData) {
    const {
      orderNumber,
      restaurantName,
      customerName,
      customerPhone,
      customerAddress,
      notes,
      items,
      restaurantSubtotal,
      discountAmount,
      totalAmount,
      couponCode,
      createdAt,
    } = orderData;

    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log(`║           ${restaurantName.toUpperCase().padEnd(38, ' ')}║`);
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║ SİPARİŞ NO: ${orderNumber.padEnd(36, ' ')}║`);
    console.log(`║ TARİH: ${new Date(createdAt).toLocaleString('tr-TR').padEnd(41, ' ')}║`);
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║ MÜŞTERİ: ${customerName.padEnd(39, ' ')}║`);
    console.log(`║ TELEFON: ${customerPhone.padEnd(39, ' ')}║`);
    console.log(`║ ADRES: ${customerAddress.substring(0, 41).padEnd(41, ' ')}║`);
    if (customerAddress.length > 41) {
      console.log(`║        ${customerAddress.substring(41, 82).padEnd(41, ' ')}║`);
    }
    if (notes) {
      console.log(`║ NOT: ${notes.substring(0, 43).padEnd(43, ' ')}║`);
    }
    console.log('╠════════════════════════════════════════════════════╣');
    console.log('║ ÜRÜNLER                                          ║');
    console.log('╠════════════════════════════════════════════════════╣');

    items.forEach((item) => {
      const productName = item.variantName
        ? `${item.productName} (${item.variantName})`
        : item.productName;
      const line1 = `║ ${productName.substring(0, 47).padEnd(47, ' ')}║`;
      console.log(line1);
      if (productName.length > 47) {
        console.log(`║ ${productName.substring(47, 94).padEnd(47, ' ')}║`);
      }
      const line2 = `║   ${item.quantity} x ${item.productPrice.toFixed(2)} TL`.padEnd(39, ' ') + 
                   `${item.subtotal.toFixed(2)} TL`.padStart(13, ' ') + '║';
      console.log(line2);
    });

    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║ ARA TOPLAM:${''.padEnd(24, ' ')}${restaurantSubtotal.toFixed(2)} TL`.padStart(50, ' ') + '║');
    
    if (discountAmount && discountAmount > 0) {
      console.log(`║ İNDİRİM${couponCode ? ` (${couponCode})` : ''}:${''.padEnd(18, ' ')}${discountAmount.toFixed(2)} TL`.padStart(50, ' ') + '║');
    }
    
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║ TOPLAM:${''.padEnd(28, ' ')}${(restaurantSubtotal).toFixed(2)} TL`.padStart(50, ' ') + '║');
    console.log('╚════════════════════════════════════════════════════╝\n');
  }

  async printToThermalPrinter(orderData) {
    return new Promise((resolve, reject) => {
      try {
        // USB yazıcıyı bul
        const device = new USB();
        
        // Yazıcıyı aç
        const printer = new escpos.Printer(device, {
          encoding: this.config.encoding,
        });

        device.open(async (error) => {
          if (error) {
            reject(new Error(`Yazıcı açılamadı: ${error.message}`));
            return;
          }

          try {
            const {
              orderNumber,
              restaurantName,
              customerName,
              customerPhone,
              customerAddress,
              notes,
              items,
              restaurantSubtotal,
              discountAmount,
              couponCode,
              createdAt,
            } = orderData;

            // Fiş yazdır
            printer
              .font('a')
              .align('ct')
              .style('bu')
              .size(2, 2)
              .text(restaurantName)
              .size(1, 1)
              .style('normal')
              .text('================================')
              .align('lt')
              .text(`Sipariş No: ${orderNumber}`)
              .text(`Tarih: ${new Date(createdAt).toLocaleString('tr-TR')}`)
              .text('================================')
              .text(`Müşteri: ${customerName}`)
              .text(`Telefon: ${customerPhone}`)
              .text(`Adres: ${customerAddress}`)
              .text('');

            if (notes) {
              printer.text(`Not: ${notes}`).text('');
            }

            printer
              .text('================================')
              .text('ÜRÜNLER')
              .text('================================');

            items.forEach((item) => {
              const productName = item.variantName
                ? `${item.productName} (${item.variantName})`
                : item.productName;
              
              printer
                .text(productName)
                .text(`  ${item.quantity} x ${item.productPrice.toFixed(2)} TL = ${item.subtotal.toFixed(2)} TL`);
            });

            printer
              .text('================================')
              .text(`Ara Toplam: ${restaurantSubtotal.toFixed(2)} TL`);

            if (discountAmount && discountAmount > 0) {
              printer.text(`İndirim${couponCode ? ` (${couponCode})` : ''}: ${discountAmount.toFixed(2)} TL`);
            }

            printer
              .text('--------------------------------')
              .style('bu')
              .size(1, 2)
              .text(`TOPLAM: ${restaurantSubtotal.toFixed(2)} TL`)
              .size(1, 1)
              .style('normal')
              .text('================================')
              .text('')
              .text('Afiyet olsun!')
              .text('')
              .cut()
              .close(() => {
                console.log('✅ Fiş yazdırıldı');
                resolve();
              });
          } catch (printError) {
            reject(printError);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop() {
    console.log('\n⏹️  Servis durduruluyor...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }

    console.log('✅ Servis durduruldu\n');
    process.exit(0);
  }
}

// Ana program
const agent = new PrinterAgent();

// Graceful shutdown
process.on('SIGINT', () => agent.stop());
process.on('SIGTERM', () => agent.stop());

// Servisi başlat
agent.start();

