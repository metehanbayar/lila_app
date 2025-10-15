/**
 * Yazıcı işlemleri
 * Windows yazıcılarına ESC/POS komutu ile yazdırma
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Varsayılan yazıcıyı al
 */
export async function getDefaultPrinter() {
  try {
    // Windows komutu ile default printer'ı al
    const { stdout } = await execAsync('wmic printer where default=true get name', {
      encoding: 'utf8',
    });

    const lines = stdout.split('\n').map(line => line.trim()).filter(Boolean);
    
    if (lines.length > 1) {
      return lines[1]; // İlk satır "Name", ikinci satır yazıcı adı
    }

    // Alternatif: İlk yazıcıyı al
    const { stdout: allPrinters } = await execAsync('wmic printer get name', {
      encoding: 'utf8',
    });
    
    const printers = allPrinters.split('\n').map(line => line.trim()).filter(Boolean);
    
    if (printers.length > 1) {
      return printers[1];
    }

    return null;
  } catch (error) {
    console.error('Yazıcı tespit hatası:', error.message);
    return null;
  }
}

/**
 * Tüm yazıcıları listele
 */
export async function listPrinters() {
  try {
    const { stdout } = await execAsync('wmic printer get name', {
      encoding: 'utf8',
    });

    const printers = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== 'Name');

    return printers;
  } catch (error) {
    console.error('Yazıcı listesi hatası:', error.message);
    return [];
  }
}

/**
 * Fiş yazdır
 */
export async function printReceipt(printerName, orderData) {
  try {
    // Fiş içeriğini oluştur
    const receiptText = generateReceiptText(orderData);
    
    // Geçici dosya oluştur
    const tempDir = path.join(os.tmpdir(), 'lila-printer');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFile = path.join(tempDir, `receipt_${Date.now()}.txt`);
    await fs.writeFile(tempFile, receiptText, 'utf8');

    // Windows print komutu ile yazdır
    // Not: Bu basit text yazdırma, thermal yazıcılar için
    await execAsync(`print /D:"${printerName}" "${tempFile}"`);
    
    // Geçici dosyayı sil
    setTimeout(async () => {
      try {
        await fs.unlink(tempFile);
      } catch (err) {
        // Ignore
      }
    }, 5000);

    return { success: true };

  } catch (error) {
    console.error('Yazdırma hatası:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test yazdırma
 */
export async function printTest(printerName, restaurantName) {
  const testData = {
    orderNumber: 'TEST-' + Date.now(),
    restaurantName: restaurantName,
    customerName: 'Test Müşteri',
    customerPhone: '0555 123 4567',
    customerAddress: 'Test Adres, Test Mahalle, No: 123',
    notes: 'Bu bir test yazdırmasıdır.',
    subtotal: 100.00,
    totalAmount: 100.00,
    discountAmount: 0,
    items: [
      {
        productName: 'Test Ürün 1',
        quantity: 2,
        price: 30.00,
        subtotal: 60.00,
      },
      {
        productName: 'Test Ürün 2',
        quantity: 1,
        price: 40.00,
        subtotal: 40.00,
      },
    ],
    createdAt: new Date(),
    isTest: true,
  };

  return await printReceipt(printerName, testData);
}

/**
 * Fiş metni oluştur
 */
function generateReceiptText(orderData) {
  const width = 42; // Thermal printer genişliği (karakter)
  
  let text = '';
  
  // Başlık
  text += center(orderData.restaurantName || 'LILA GROUP', width) + '\n';
  text += '='.repeat(width) + '\n';
  
  // Sipariş bilgileri
  text += `Sipariş No: ${orderData.orderNumber}\n`;
  text += `Tarih: ${formatDate(orderData.createdAt)}\n`;
  text += '-'.repeat(width) + '\n';
  
  // Müşteri bilgileri
  text += `Müşteri: ${orderData.customerName}\n`;
  text += `Tel: ${orderData.customerPhone}\n`;
  
  // Adres (word wrap)
  const address = wordWrap(`Adres: ${orderData.customerAddress}`, width);
  text += address + '\n';
  
  text += '-'.repeat(width) + '\n';
  text += 'ÜRÜNLER:\n';
  text += '-'.repeat(width) + '\n';
  
  // Ürünler
  for (const item of orderData.items) {
    const productName = item.variantName 
      ? `${item.productName} (${item.variantName})`
      : item.productName;
    
    const qty = `${item.quantity}x`;
    const price = formatPrice(item.subtotal);
    
    // Ürün satırı: 2x Hamburger............85.00 TL
    const nameMaxLen = width - qty.length - price.length - 1;
    const truncatedName = productName.length > nameMaxLen
      ? productName.substring(0, nameMaxLen - 3) + '...'
      : productName;
    
    const dots = '.'.repeat(Math.max(1, width - qty.length - truncatedName.length - price.length));
    
    text += `${qty} ${truncatedName}${dots}${price}\n`;
    
    // Birim fiyat (küçük font)
    if (item.quantity > 1) {
      text += `   (@${formatPrice(item.price)})\n`;
    }
  }
  
  text += '-'.repeat(width) + '\n';
  
  // Toplam
  text += rightAlign(`Ara Toplam: ${formatPrice(orderData.subtotal)}`, width) + '\n';
  
  if (orderData.discountAmount && orderData.discountAmount > 0) {
    text += rightAlign(`İndirim: -${formatPrice(orderData.discountAmount)}`, width) + '\n';
    
    if (orderData.couponCode) {
      text += rightAlign(`(${orderData.couponCode})`, width) + '\n';
    }
  }
  
  text += '='.repeat(width) + '\n';
  text += rightAlign(`TOPLAM: ${formatPrice(orderData.totalAmount)}`, width) + '\n';
  text += '='.repeat(width) + '\n';
  
  // Notlar
  if (orderData.notes) {
    text += '\nNot:\n';
    text += wordWrap(orderData.notes, width) + '\n';
    text += '-'.repeat(width) + '\n';
  }
  
  // Kapanış
  text += '\n';
  text += center('AFİYET OLSUN!', width) + '\n';
  text += center('www.lilagusto.com', width) + '\n';
  text += '\n';
  
  // Test yazdırma işareti
  if (orderData.isTest) {
    text += '\n';
    text += center('*** TEST YAZDIR ***', width) + '\n';
  }
  
  // Kağıt kes (ESC/POS komutu)
  text += '\n\n\n\n';
  
  return text;
}

/**
 * Metni ortala
 */
function center(text, width) {
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(Math.max(0, padding)) + text;
}

/**
 * Metni sağa hizala
 */
function rightAlign(text, width) {
  const padding = width - text.length;
  return ' '.repeat(Math.max(0, padding)) + text;
}

/**
 * Fiyat formatla
 */
function formatPrice(amount) {
  return amount.toFixed(2) + ' TL';
}

/**
 * Tarih formatla
 */
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Uzun metni satırlara böl (word wrap)
 */
function wordWrap(text, width) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length > width) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
      
      // Kelime çok uzunsa böl
      if (word.length > width) {
        for (let i = 0; i < word.length; i += width) {
          lines.push(word.substring(i, i + width));
        }
      } else {
        currentLine = word + ' ';
      }
    } else {
      currentLine += word + ' ';
    }
  }
  
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  
  return lines.join('\n');
}

