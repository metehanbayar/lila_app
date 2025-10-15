/**
 * Windows Service yönetimi
 * Agent'ı Windows servisi olarak kurma ve yönetme
 */

import Service from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = promisify(setTimeout);

/**
 * Windows servisi olarak kur
 */
export async function installService() {
  return new Promise((resolve, reject) => {
    try {
      // Servis yapılandırması
      const svc = new Service.Service({
        name: 'LilaGroupPrinterAgent',
        description: 'Lila Group Otomatik Sipariş Yazıcı',
        script: __filename,
        nodeOptions: [],
        workingDirectory: path.dirname(__dirname),
        allowServiceLogon: true,
        env: [
          {
            name: 'NODE_ENV',
            value: 'production',
          },
        ],
      });

      // Servis kurulduğunda
      svc.on('install', () => {
        console.log('✅ Windows servisi kuruldu');
        
        // Servisi başlat
        svc.start();
        
        setTimeout(() => {
          resolve();
        }, 2000);
      });

      // Hata
      svc.on('error', (err) => {
        console.error('❌ Servis kurulum hatası:', err);
        reject(err);
      });

      // Zaten kuruluysa
      svc.on('alreadyinstalled', () => {
        console.log('ℹ️  Servis zaten kurulu');
        resolve();
      });

      // Kurulumu başlat
      console.log('🔧 Windows servisi kuruluyor...');
      svc.install();

    } catch (error) {
      console.error('❌ Service install hatası:', error);
      reject(error);
    }
  });
}

/**
 * Windows servisini kaldır
 */
export async function uninstallService() {
  return new Promise((resolve, reject) => {
    try {
      const svc = new Service.Service({
        name: 'LilaGroupPrinterAgent',
        script: __filename,
      });

      svc.on('uninstall', () => {
        console.log('✅ Windows servisi kaldırıldı');
        resolve();
      });

      svc.on('error', (err) => {
        console.error('❌ Servis kaldırma hatası:', err);
        reject(err);
      });

      svc.on('notinstalled', () => {
        console.log('ℹ️  Servis zaten kurulu değil');
        resolve();
      });

      console.log('🗑️  Windows servisi kaldırılıyor...');
      svc.uninstall();

    } catch (error) {
      console.error('❌ Service uninstall hatası:', error);
      reject(error);
    }
  });
}

/**
 * Servisin kurulu olup olmadığını kontrol et
 */
export async function isServiceInstalled() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('sc query LilaGroupPrinterAgent', {
      encoding: 'utf8',
    });

    return stdout.includes('LilaGroupPrinterAgent');
  } catch (error) {
    // Servis bulunamadı
    return false;
  }
}

/**
 * Servisi başlat
 */
export async function startService() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync('sc start LilaGroupPrinterAgent');
    console.log('✅ Servis başlatıldı');
    return true;
  } catch (error) {
    console.error('❌ Servis başlatma hatası:', error.message);
    return false;
  }
}

/**
 * Servisi durdur
 */
export async function stopService() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    await execAsync('sc stop LilaGroupPrinterAgent');
    console.log('✅ Servis durduruldu');
    return true;
  } catch (error) {
    console.error('❌ Servis durdurma hatası:', error.message);
    return false;
  }
}

