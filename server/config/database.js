import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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

