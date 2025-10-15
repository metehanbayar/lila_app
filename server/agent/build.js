/**
 * Agent Builder Script
 * Template agent'ı PKG ile EXE'ye derler
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  try {
    console.log('🔨 Lila Group Printer Agent - Build');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Dist klasörünü oluştur
    const distDir = path.join(__dirname, 'dist');
    await fs.mkdir(distDir, { recursive: true });

    console.log('📦 PKG ile derleniyor...');
    console.log('   Target: Windows x64 (Node 18)');
    console.log('   Output: dist/LilaGroupPrinterAgent-Template.exe\n');

    // PKG komutu
    const pkgCommand = `npx pkg . --target node18-win-x64 --output ${path.join(distDir, 'LilaGroupPrinterAgent-Template.exe')} --compress GZip`;

    const { stdout, stderr } = await execAsync(pkgCommand, {
      cwd: __dirname,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('\n✅ Build tamamlandı!');
    console.log(`📁 Konum: ${path.join(distDir, 'LilaGroupPrinterAgent-Template.exe')}\n`);

    // Dosya boyutunu göster
    const stats = await fs.stat(path.join(distDir, 'LilaGroupPrinterAgent-Template.exe'));
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 Boyut: ${sizeMB} MB\n`);

  } catch (error) {
    console.error('❌ Build hatası:', error);
    process.exit(1);
  }
}

build();

