using LilaPrinterClient.Models;
using LilaPrinterClient.Services;

namespace LilaPrinterClient.UI;

/// <summary>
/// System Tray uygulaması ana context
/// </summary>
public class TrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _trayIcon;
    private readonly ContextMenuStrip _contextMenu;
    private readonly SocketService _socketService;
    private readonly AppConfig _config;
    private ReceiptTemplate? _receiptTemplate;

    public TrayApplicationContext(AppConfig config)
    {
        _config = config;

        // Context menu oluştur
        _contextMenu = CreateContextMenu();

        // Tray icon oluştur
        _trayIcon = new NotifyIcon
        {
            Icon = SystemIcons.Application, // TODO: Özel icon eklenecek
            ContextMenuStrip = _contextMenu,
            Visible = true,
            Text = $"Lila Printer - {config.RestaurantName}"
        };

        // Double click event
        _trayIcon.DoubleClick += TrayIcon_DoubleClick;

        // Socket servisini başlat
        _socketService = new SocketService(config.ServerUrl, config.RestaurantId);
        _socketService.ConnectionStatusChanged += SocketService_ConnectionStatusChanged;
        _socketService.OrderReceived += SocketService_OrderReceived;
        _socketService.ErrorOccurred += SocketService_ErrorOccurred;
        _socketService.TemplateReceived += SocketService_TemplateReceived;

        // Bağlan
        _ = ConnectToServerAsync();
    }

    /// <summary>
    /// Context menu oluştur
    /// </summary>
    private ContextMenuStrip CreateContextMenu()
    {
        var menu = new ContextMenuStrip();

        // Durum
        var statusItem = new ToolStripMenuItem("Durum: Bağlanıyor...")
        {
            Enabled = false,
            Name = "statusItem"
        };
        menu.Items.Add(statusItem);

        menu.Items.Add(new ToolStripSeparator());

        // Ayarlar
        var settingsItem = new ToolStripMenuItem("Ayarlar", null, Settings_Click);
        menu.Items.Add(settingsItem);

        // Test Yazdır
        var testPrintItem = new ToolStripMenuItem("Test Yazdır", null, TestPrint_Click);
        menu.Items.Add(testPrintItem);

        menu.Items.Add(new ToolStripSeparator());

        // Çıkış
        var exitItem = new ToolStripMenuItem("Çıkış", null, Exit_Click);
        menu.Items.Add(exitItem);

        return menu;
    }

    /// <summary>
    /// Sunucuya bağlan
    /// </summary>
    private async Task ConnectToServerAsync()
    {
        try
        {
            // Socket bağlantısını başlat
            await _socketService.ConnectAsync();
            
            // Template'i indir
            _receiptTemplate = await _socketService.FetchTemplateAsync();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Sunucuya bağlanırken hata oluştu:\n{ex.Message}",
                "Bağlantı Hatası",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }

    /// <summary>
    /// Bağlantı durumu değiştiğinde
    /// </summary>
    private void SocketService_ConnectionStatusChanged(object? sender, bool isConnected)
    {
        if (_trayIcon.ContextMenuStrip?.InvokeRequired == true)
        {
            _trayIcon.ContextMenuStrip.Invoke(() => UpdateConnectionStatus(isConnected));
        }
        else
        {
            UpdateConnectionStatus(isConnected);
        }
    }

    /// <summary>
    /// Bağlantı durumu UI güncellemesi
    /// </summary>
    private void UpdateConnectionStatus(bool isConnected)
    {
        var statusItem = _contextMenu.Items.Find("statusItem", false).FirstOrDefault();
        if (statusItem != null)
        {
            statusItem.Text = isConnected ? "🟢 Durum: Bağlı" : "🔴 Durum: Bağlı Değil";
        }

        _trayIcon.Text = isConnected
            ? $"Lila Printer - {_config.RestaurantName} (Bağlı)"
            : $"Lila Printer - {_config.RestaurantName} (Bağlı Değil)";

        // Bildirim göster
        if (isConnected)
        {
            _trayIcon.ShowBalloonTip(3000,
                "Bağlandı",
                $"{_config.RestaurantName} - Siparişler dinleniyor",
                ToolTipIcon.Info);
        }
    }

    /// <summary>
    /// Template güncellendiğinde
    /// </summary>
    private void SocketService_TemplateReceived(object? sender, ReceiptTemplate template)
    {
        _receiptTemplate = template;
        Console.WriteLine("✅ Yeni template alındı ve kaydedildi");
    }

    /// <summary>
    /// Yeni sipariş geldiğinde
    /// </summary>
    private void SocketService_OrderReceived(object? sender, OrderData order)
    {
        // Yazdır (template ile)
        if (_config.AutoPrint)
        {
            bool success = PrinterService.PrintReceipt(_config.PrinterName, order, _receiptTemplate);

            // UI thread'de bildirim göster
            if (_contextMenu.InvokeRequired)
            {
                _contextMenu.Invoke(() => ShowOrderNotification(success, order));
            }
            else
            {
                ShowOrderNotification(success, order);
            }
        }
    }

    /// <summary>
    /// Sipariş bildirimi göster
    /// </summary>
    private void ShowOrderNotification(bool success, OrderData order)
    {
        if (success)
        {
            _trayIcon.ShowBalloonTip(5000,
                "Sipariş Yazdırıldı",
                $"#{order.OrderNumber}\n{order.CustomerName}\n{order.TotalAmount:C2}",
                ToolTipIcon.Info);
        }
        else
        {
            _trayIcon.ShowBalloonTip(10000,
                "Yazdırma Hatası!",
                $"#{order.OrderNumber} yazdırılamadı!\nYazıcı: {_config.PrinterName}",
                ToolTipIcon.Error);
        }
    }

    /// <summary>
    /// Hata oluştuğunda
    /// </summary>
    private void SocketService_ErrorOccurred(object? sender, string error)
    {
        Console.WriteLine($"Hata: {error}");
    }

    /// <summary>
    /// Tray icon double click
    /// </summary>
    private void TrayIcon_DoubleClick(object? sender, EventArgs e)
    {
        MessageBox.Show(
            $"Lila Printer Client\n\n" +
            $"Restoran: {_config.RestaurantName}\n" +
            $"Yazıcı: {_config.PrinterName}\n" +
            $"Durum: {(_socketService.IsConnected ? "Bağlı ✅" : "Bağlı Değil ❌")}",
            "Lila Printer",
            MessageBoxButtons.OK,
            MessageBoxIcon.Information
        );
    }

    /// <summary>
    /// Ayarlar menüsü
    /// </summary>
    private void Settings_Click(object? sender, EventArgs e)
    {
        using var settingsForm = new SettingsForm(_config);
        var result = settingsForm.ShowDialog();

        if (result == DialogResult.OK && settingsForm.ConfigChanged)
        {
            // Ayarlar değişti, uygulamayı yeniden başlatmak gerekebilir
            // (Kullanıcı zaten restart seçeneği gördü)
        }
    }

    /// <summary>
    /// Test yazdırma
    /// </summary>
    private void TestPrint_Click(object? sender, EventArgs e)
    {
        var testOrder = new OrderData
        {
            OrderNumber = "TEST-" + DateTime.Now.Ticks,
            RestaurantName = _config.RestaurantName,
            CustomerName = "Test Müşteri",
            CustomerPhone = "0555 123 4567",
            CustomerAddress = "Test Adres, Test Mahalle, No: 123, Test İlçesi, Test İli",
            Notes = "Bu bir test yazdırmasıdır.",
            Subtotal = 100m,
            TotalAmount = 100m,
            DiscountAmount = 0m,
            Items = new List<OrderItem>
            {
                new() { ProductName = "Test Ürün 1", Quantity = 2, Price = 30m, Subtotal = 60m },
                new() { ProductName = "Test Ürün 2", VariantName = "Büyük", Quantity = 1, Price = 40m, Subtotal = 40m }
            },
            CreatedAt = DateTime.Now
        };

        // Template ile yazdır
        bool success = PrinterService.PrintReceipt(_config.PrinterName, testOrder, _receiptTemplate);

        MessageBox.Show(
            success ? "Test yazdırma başarılı!" : "Test yazdırma başarısız!",
            "Test Yazdırma",
            MessageBoxButtons.OK,
            success ? MessageBoxIcon.Information : MessageBoxIcon.Error
        );
    }

    /// <summary>
    /// Çıkış
    /// </summary>
    private void Exit_Click(object? sender, EventArgs e)
    {
        var result = MessageBox.Show(
            "Uygulamadan çıkmak istediğinize emin misiniz?\n\nÇıkarsanız siparişler yazdırılmayacak!",
            "Çıkış",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Warning
        );

        if (result == DialogResult.Yes)
        {
            _trayIcon.Visible = false;
            _socketService.Dispose();
            Application.Exit();
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _trayIcon?.Dispose();
            _contextMenu?.Dispose();
            _socketService?.Dispose();
        }
        base.Dispose(disposing);
    }
}

