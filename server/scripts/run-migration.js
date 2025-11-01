import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration dosyasını çalıştır
 */
async function runMigration(migrationFile) {
  try {
    console.log(`📄 Migration dosyası okunuyor: ${migrationFile}`);
    
    const pool = await getConnection();
    
    // SQL dosyasını oku
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(`🚀 Migration çalıştırılıyor...`);
    
    // SQL'i çalıştır (GO komutlarını split et)
    const batches = sqlContent.split(/^GO$/gm);
    
    for (const batch of batches) {
      const trimmedBatch = batch.trim();
      if (trimmedBatch) {
        await pool.request().query(trimmedBatch);
      }
    }
    
    console.log(`✅ Migration başarıyla tamamlandı: ${migrationFile}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Migration hatası:`, error.message);
    process.exit(1);
  }
}

// Komut satırından dosya adını al
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Migration dosyası belirtilmedi');
  console.log('Kullanım: node scripts/run-migration.js <dosya-adı>');
  console.log('Örnek: node scripts/run-migration.js add-order-group-id.sql');
  process.exit(1);
}

runMigration(migrationFile);

