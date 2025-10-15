using SocketIOClient;
using LilaPrinterClient.Models;
using System.Text.Json;

namespace LilaPrinterClient.Services;

/// <summary>
/// Socket.IO bağlantı ve iletişim yönetimi
/// </summary>
public class SocketService
{
    private SocketIO? _client;
    private readonly string _serverUrl;
    private readonly int _restaurantId;
    private bool _isConnected;
    private ReceiptTemplate? _receiptTemplate;

    /// <summary>
    /// Bağlantı durumu değiştiğinde tetiklenir
    /// </summary>
    public event EventHandler<bool>? ConnectionStatusChanged;

    /// <summary>
    /// Yeni sipariş geldiğinde tetiklenir
    /// </summary>
    public event EventHandler<OrderData>? OrderReceived;

    /// <summary>
    /// Hata oluştuğunda tetiklenir
    /// </summary>
    public event EventHandler<string>? ErrorOccurred;

    /// <summary>
    /// Template değiştiğinde tetiklenir
    /// </summary>
    public event EventHandler<ReceiptTemplate>? TemplateReceived;

    public bool IsConnected => _isConnected;
    public ReceiptTemplate? CurrentTemplate => _receiptTemplate;

    public SocketService(string serverUrl, int restaurantId)
    {
        _serverUrl = serverUrl;
        _restaurantId = restaurantId;
    }

    /// <summary>
    /// Sunucuya bağlan
    /// </summary>
    public async Task ConnectAsync()
    {
        try
        {
            // Socket.IO client oluştur
            _client = new SocketIO(_serverUrl, new SocketIOOptions
            {
                Reconnection = true,
                ReconnectionAttempts = int.MaxValue,
                ReconnectionDelay = 1000,
                ReconnectionDelayMax = 10000,
                Transport = SocketIOClient.Transport.TransportProtocol.WebSocket
            });

            // Event handler'ları tanımla
            SetupEventHandlers();

            // Bağlan
            await _client.ConnectAsync();

            Console.WriteLine($"Socket.IO bağlantısı başlatıldı: {_serverUrl}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Bağlantı hatası: {ex.Message}");
            ErrorOccurred?.Invoke(this, $"Bağlantı hatası: {ex.Message}");
        }
    }

    /// <summary>
    /// Event handler'ları ayarla
    /// </summary>
    private void SetupEventHandlers()
    {
        if (_client == null) return;

        // Bağlandığında
        _client.OnConnected += (sender, e) =>
        {
            _isConnected = true;
            Console.WriteLine("✅ Socket.IO bağlandı");
            ConnectionStatusChanged?.Invoke(this, true);
        };

        // Bağlantı koptuğunda
        _client.OnDisconnected += (sender, e) =>
        {
            _isConnected = false;
            Console.WriteLine("⚠️ Socket.IO bağlantısı koptu");
            ConnectionStatusChanged?.Invoke(this, false);
        };

        // Hata oluştuğunda
        _client.OnError += (sender, e) =>
        {
            Console.WriteLine($"❌ Socket.IO hatası: {e}");
            ErrorOccurred?.Invoke(this, e);
        };

        // Yeniden bağlanırken
        _client.OnReconnectAttempt += (sender, attempt) =>
        {
            Console.WriteLine($"🔄 Yeniden bağlanma denemesi: {attempt}");
        };

        // Yeniden bağlandığında
        _client.OnReconnected += (sender, attempt) =>
        {
            Console.WriteLine($"✅ Yeniden bağlandı (Deneme: {attempt})");
            _isConnected = true;
            ConnectionStatusChanged?.Invoke(this, true);
        };

        // Yeni sipariş eventi dinle
        _client.On("order:new", response =>
        {
            try
            {
                Console.WriteLine("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                Console.WriteLine("📥 SOCKET EVENT ALINDI: order:new");

                // Direkt OrderData olarak deserialize et (SocketIOClient kendi serializer'ını kullanıyor)
                var order = response.GetValue<OrderData>();

                if (order != null)
                {
                    Console.WriteLine($"   Parse başarılı!");
                    Console.WriteLine($"   Sipariş No: {order.OrderNumber}");
                    Console.WriteLine($"   Restoran ID (gelen): {order.RestaurantId}");
                    Console.WriteLine($"   Restoran ID (beklenen): {_restaurantId}");
                    Console.WriteLine($"   Müşteri: {order.CustomerName}");
                    Console.WriteLine($"   Tutar: {order.TotalAmount:C2}");
                    Console.WriteLine($"   Ürün sayısı: {order.Items?.Count ?? 0}");

                    if (order.RestaurantId == _restaurantId)
                    {
                        Console.WriteLine($"   ✅ RESTORAN EŞLEŞTİ! Yazdırma başlatılıyor...");
                        // Event tetikle
                        OrderReceived?.Invoke(this, order);
                    }
                    else
                    {
                        Console.WriteLine($"   ⚠️ Farklı restoran! Beklenen: {_restaurantId}, Gelen: {order.RestaurantId}");
                    }
                }
                else
                {
                    Console.WriteLine("   ❌ Order null!");
                }
                Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Sipariş parse hatası: {ex.Message}");
                Console.WriteLine($"   Stack: {ex.StackTrace}");
                ErrorOccurred?.Invoke(this, $"Sipariş parse hatası: {ex.Message}");
            }
        });

        // Test yazdırma eventi
        _client.On("order:test", response =>
        {
            try
            {
                Console.WriteLine("\n🧪 Test yazdırma alındı!");

                var order = response.GetValue<OrderData>();

                if (order != null)
                {
                    Console.WriteLine($"   Sipariş No: {order.OrderNumber}");
                    OrderReceived?.Invoke(this, order);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Test parse hatası: {ex.Message}");
            }
        });
    }

    /// <summary>
    /// Fiş template'ini backend'den indir
    /// </summary>
    public async Task<ReceiptTemplate?> FetchTemplateAsync()
    {
        try
        {
            using var httpClient = new HttpClient();
            var url = $"{_serverUrl}/api/admin/receipt-templates/restaurants/{_restaurantId}/receipt-template";
            
            var response = await httpClient.GetAsync(url);
            
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<TemplateResponse>(json);
                
                if (result?.Data?.Template != null)
                {
                    _receiptTemplate = result.Data.Template;
                    TemplateReceived?.Invoke(this, _receiptTemplate);
                    Console.WriteLine("✅ Fiş template indirildi");
                    return _receiptTemplate;
                }
            }
            
            Console.WriteLine("⚠️ Template indirilemedi, varsayılan kullanılacak");
            return GetDefaultTemplate();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Template indirme hatası: {ex.Message}");
            return GetDefaultTemplate();
        }
    }

    /// <summary>
    /// Varsayılan template
    /// </summary>
    private ReceiptTemplate GetDefaultTemplate()
    {
        return new ReceiptTemplate
        {
            ShowLogo = false,
            FontSize = new FontSizes { Title = 12, Normal = 8, Bold = 9, Small = 7 },
            FooterText = new List<string> { "AFİYET OLSUN!", "www.lilagusto.com" },
            ShowCustomerAddress = true,
            ShowCustomerPhone = true,
            ShowNotes = true,
            ShowItemPrices = true,
            ShowDiscount = true,
            PaperWidth = 75,
            LineSpacing = 12,
            Margins = new Models.Margins { Left = 5, Right = 5, Top = 5, Bottom = 30 },
            ContactInfo = new Models.ContactInfo { Website = "www.lilagusto.com" }
        };
    }

    /// <summary>
    /// Bağlantıyı kapat
    /// </summary>
    public async Task DisconnectAsync()
    {
        if (_client != null)
        {
            await _client.DisconnectAsync();
            _isConnected = false;
        }
    }

    /// <summary>
    /// Cleanup
    /// </summary>
    public void Dispose()
    {
        _client?.Dispose();
    }
}

// Helper classes for API response
internal class TemplateResponse
{
    [System.Text.Json.Serialization.JsonPropertyName("success")]
    public bool Success { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("data")]
    public TemplateData? Data { get; set; }
}

internal class TemplateData
{
    [System.Text.Json.Serialization.JsonPropertyName("template")]
    public ReceiptTemplate? Template { get; set; }
}

