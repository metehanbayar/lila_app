import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// .env dosyasından gerekli değerleri al (varsayılan değer yok)
const requiredEnvVars = {
  DB_SERVER: process.env.DB_SERVER,
  DB_PORT: process.env.DB_PORT,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
};

// Eksik .env değişkenlerini kontrol et
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('\n❌ Eksik .env değişkenleri bulundu:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Lütfen server/.env dosyanızı kontrol edin ve eksik değerleri ekleyin.\n');
  throw new Error(`Eksik .env değişkenleri: ${missingVars.join(', ')}`);
}

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000, // 30 saniye
    requestTimeout: 30000, // 30 saniye
    connectionTimeout: 30000, // 30 saniye
    // Alternatif bağlantı yöntemleri (isteğe bağlı)
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

// Detaylı hata mesajı oluştur
function formatConnectionError(error, method, config) {
  const errorMsg = error.message || error.toString();
  let diagnosticMsg = '\n🔍 Tanı Bilgileri:\n';
  diagnosticMsg += `   - Yöntem: ${method}\n`;
  diagnosticMsg += `   - Sunucu: ${config.server}\n`;
  diagnosticMsg += `   - Port: ${config.port}\n`;
  diagnosticMsg += `   - Veritabanı: ${config.database}\n`;
  diagnosticMsg += `   - Kullanıcı: ${config.user}\n`;
  
  if (errorMsg.includes('Could not connect') || errorMsg.includes('ECONNREFUSED')) {
    diagnosticMsg += '\n❌ Bağlantı Hatası - Muhtemel Nedenler:\n';
    diagnosticMsg += '   1. SQL Server servisi çalışmıyor olabilir\n';
    diagnosticMsg += '      → SQL Server Configuration Manager\'ı kontrol edin\n';
    diagnosticMsg += '      → Windows Services\'te SQL Server servisini başlatın\n';
    diagnosticMsg += '   2. TCP/IP protokolü devre dışı olabilir\n';
    diagnosticMsg += '      → SQL Server Configuration Manager → SQL Server Network Configuration\n';
    diagnosticMsg += '      → TCP/IP\'yi etkinleştirin ve yeniden başlatın\n';
    diagnosticMsg += '   3. Port 1433 engellenmiş olabilir\n';
    diagnosticMsg += '      → Windows Firewall ayarlarını kontrol edin\n';
    diagnosticMsg += '   4. SQL Server farklı bir instance\'da çalışıyor olabilir\n';
    diagnosticMsg += '      → DB_INSTANCE değişkenini kontrol edin (örn: SQLEXPRESS)\n';
  } else if (errorMsg.includes('Login failed')) {
    diagnosticMsg += '\n❌ Kimlik Doğrulama Hatası:\n';
    diagnosticMsg += '   1. Kullanıcı adı ve şifreyi kontrol edin\n';
    diagnosticMsg += '   2. SQL Server Authentication Mode aktif mi?\n';
    diagnosticMsg += '   3. Kullanıcının veritabanına erişim yetkisi var mı?\n';
  } else if (errorMsg.includes('Cannot open database')) {
    diagnosticMsg += '\n❌ Veritabanı Bulunamadı:\n';
    diagnosticMsg += '   1. Veritabanı adını kontrol edin\n';
    diagnosticMsg += '   2. Veritabanının oluşturulduğundan emin olun\n';
    diagnosticMsg += '   3. Kullanıcının veritabanına erişim yetkisi olduğunu kontrol edin\n';
  }
  
  return errorMsg + diagnosticMsg;
}

export async function getConnection() {
  try {
    if (pool) {
      return pool;
    }
    
    const errors = [];
    
    // Yöntem 1: Normal bağlantı (config ile)
    console.log(`\n🔌 Veritabanı bağlantısı deneniyor...`);
    console.log(`   Sunucu: ${config.server}:${config.port}`);
    console.log(`   Veritabanı: ${config.database}`);
    console.log(`   Kullanıcı: ${config.user}`);
    
    try {
      pool = await sql.connect(config);
      console.log('✅ Veritabanı bağlantısı başarılı!\n');
      return pool;
    } catch (error1) {
      errors.push({ method: 'Normal bağlantı', error: error1 });
      console.log('   ❌ Normal bağlantı başarısız, alternatif yöntemler deneniyor...\n');
      
      // Yöntem 2: Instance name ile (SQLEXPRESS)
      if (!config.options.instanceName) {
        try {
          const configWithInstance = {
            ...config,
            options: {
              ...config.options,
              instanceName: 'SQLEXPRESS'
            }
          };
          console.log('   🔄 SQLEXPRESS instance ile deneniyor...');
          pool = await sql.connect(configWithInstance);
          console.log('✅ Veritabanı bağlantısı başarılı! (SQLEXPRESS instance)\n');
          return pool;
        } catch (error2) {
          errors.push({ method: 'SQLEXPRESS instance', error: error2 });
        }
      }
      
      // Yöntem 3: Instance name ile (MSSQLSERVER - varsayılan)
      try {
        const configWithDefaultInstance = {
          ...config,
          port: undefined, // Instance name kullanıldığında port belirtmeyin
          options: {
            ...config.options,
            instanceName: 'MSSQLSERVER'
          }
        };
        console.log('   🔄 MSSQLSERVER instance ile deneniyor...');
        pool = await sql.connect(configWithDefaultInstance);
        console.log('✅ Veritabanı bağlantısı başarılı! (MSSQLSERVER instance)\n');
        return pool;
      } catch (error3) {
        errors.push({ method: 'MSSQLSERVER instance', error: error3 });
      }
      
      // Yöntem 4: Connection string ile
      try {
        const connectionString = `Server=${config.server},${config.port};Database=${config.database};User Id=${config.user};Password=${config.password};Encrypt=${config.options.encrypt};TrustServerCertificate=true;Connect Timeout=30;`;
        console.log('   🔄 Connection string ile deneniyor...');
        pool = await sql.connect(connectionString);
        console.log('✅ Veritabanı bağlantısı başarılı! (Connection string)\n');
        return pool;
      } catch (error4) {
        errors.push({ method: 'Connection string', error: error4 });
      }
      
      // Yöntem 5: Windows Authentication (eğer user ve password boşsa)
      if (!config.user || !config.password) {
        try {
          const configWindowsAuth = {
            ...config,
            user: undefined,
            password: undefined,
            options: {
              ...config.options,
              trustedConnection: true
            }
          };
          console.log('   🔄 Windows Authentication ile deneniyor...');
          pool = await sql.connect(configWindowsAuth);
          console.log('✅ Veritabanı bağlantısı başarılı! (Windows Authentication)\n');
          return pool;
        } catch (error5) {
          errors.push({ method: 'Windows Authentication', error: error5 });
        }
      }
      
      // Tüm yöntemler başarısız oldu
      const firstError = errors[0];
      const detailedError = new Error(formatConnectionError(firstError.error, firstError.method, config));
      detailedError.originalError = firstError.error;
      detailedError.allErrors = errors;
      throw detailedError;
    }
  } catch (error) {
    // Eğer zaten formatlanmış bir hata ise, direkt fırlat
    if (error.allErrors) {
      throw error;
    }
    // Değilse formatla ve fırlat
    const detailedError = new Error(formatConnectionError(error, 'Bilinmeyen yöntem', config));
    detailedError.originalError = error;
    throw detailedError;
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

