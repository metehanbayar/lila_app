import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Environment değişkenlerini kontrol et
console.log('🔍 Environment değişkenleri:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_ENCRYPT:', process.env.DB_ENCRYPT);

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'LilaGroupMenu',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Config'i kontrol et
console.log('🔧 Database config:', {
  server: config.server,
  port: config.port,
  database: config.database,
  user: config.user,
  password: config.password ? '***' : 'undefined',
  encrypt: config.options.encrypt
});

let pool = null;

export async function getConnection() {
  try {
    if (pool) {
      return pool;
    }
    pool = await sql.connect(config);
    console.log('✅ MSSQL veritabanına bağlantı başarılı');
    return pool;
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error);
    throw error;
  }
}

export async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Veritabanı bağlantısı kapatıldı');
    }
  } catch (error) {
    console.error('Bağlantı kapatma hatası:', error);
  }
}

export { sql };

