/**
 * System Tray Icon
 * Windows sistem tepsisinde simge gösterme
 * 
 * Not: Bu basit bir implementasyon. Gerçek production için
 * Electron veya NW.js kullanılabilir.
 */

/**
 * System tray icon oluştur
 * 
 * Not: Node.js'de native tray icon için Electron gerekir.
 * Bu basit versiyon sadece console çıktısı verir.
 * Production için Electron wrapper eklenebilir.
 */
export function createTrayIcon(options) {
  const { restaurantName, onQuit, onReconnect, onTestPrint } = options;

  console.log('\n💡 System Tray Info:');
  console.log('   Agent arka planda çalışıyor');
  console.log('   Restoran: ' + restaurantName);
  console.log('   Bu pencereyi kapatabilirsiniz\n');

  // Gerçek tray icon için Electron gerekir
  // Şimdilik basit bir console menu sunuyoruz
  
  // Windows'da minimized olarak çalışması için
  if (process.platform === 'win32') {
    // Silent mode - hiçbir pencere gösterme
    // Windows servisi olarak çalışırken otomatik olur
  }

  return {
    destroy: () => {
      console.log('Tray icon kapatıldı');
    },
  };
}

/**
 * Tray durumunu güncelle
 */
export function updateTrayStatus(status) {
  const statusMap = {
    connected: '🟢 Bağlı',
    disconnected: '🟡 Bağlantı kopuk',
    error: '🔴 Hata',
    printing: '🖨️  Yazdırılıyor',
  };

  const statusText = statusMap[status] || status;
  
  // Console'a durum yaz
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  console.log(`[${timestamp}] Durum: ${statusText}`);

  // Gerçek tray icon için Electron'da tooltip güncellenebilir
  return statusText;
}

/**
 * Bildirim göster
 */
export function showNotification(title, message) {
  console.log(`\n🔔 ${title}`);
  console.log(`   ${message}\n`);

  // Windows toast notification için node-notifier kullanılabilir
  // Şimdilik console log yeterli
  
  try {
    // PowerShell ile Windows 10+ toast notification
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      
      const psScript = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        
        $template = @"
<toast>
    <visual>
        <binding template="ToastText02">
            <text id="1">${title.replace(/"/g, '\\"')}</text>
            <text id="2">${message.replace(/"/g, '\\"')}</text>
        </binding>
    </visual>
</toast>
"@
        
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Lila Group Printer").Show($toast)
      `;
      
      exec(`powershell -Command "${psScript}"`, (error) => {
        if (error) {
          // Toast başarısız, sessizce devam et
        }
      });
    }
  } catch (error) {
    // Toast notification hatası, önemli değil
  }
}

/**
 * Tray menüsü oluştur (Electron için)
 */
export function createTrayMenu(options) {
  // Bu fonksiyon Electron kullanıldığında aktif olacak
  // Şimdilik placeholder
  
  return [
    {
      label: options.restaurantName,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Durum: ' + (options.status || 'Hazır'),
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Test Yazdır',
      click: options.onTestPrint,
    },
    {
      label: 'Yeniden Bağlan',
      click: options.onReconnect,
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: options.onQuit,
    },
  ];
}

