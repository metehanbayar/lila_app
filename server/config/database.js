import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

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
    connectTimeout: 30000, // 30 saniye
    requestTimeout: 30000, // 30 saniye
    connectionTimeout: 30000, // 30 saniye
    // Alternatif bağlantı yöntemleri
    instanceName: process.env.DB_INSTANCE || undefined,
    connectionString: process.env.DB_CONNECTION_STRING || undefined,
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
    
    // Farklı bağlantı yöntemlerini dene
    // Yöntem 1: Normal bağlantı
    try {
      pool = await sql.connect(config);
      return pool;
    } catch (error1) {
      // Yöntem 2: Instance name ile
      const configWithInstance = {
        ...config,
        options: {
          ...config.options,
          instanceName: 'SQLEXPRESS'
        }
      };
      
      try {
        pool = await sql.connect(configWithInstance);
        return pool;
      } catch (error2) {
        // Yöntem 3: Connection string ile
        const connectionString = `Server=${config.server},${config.port};Database=${config.database};User Id=${config.user};Password=${config.password};Encrypt=${config.options.encrypt};TrustServerCertificate=true;`;
        
        try {
          pool = await sql.connect(connectionString);
          return pool;
        } catch (error3) {
          throw error1; // İlk hatayı fırlat
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

export async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
    }
  } catch (error) {
    // Bağlantı kapatma hatası
  }
}

export { sql };

