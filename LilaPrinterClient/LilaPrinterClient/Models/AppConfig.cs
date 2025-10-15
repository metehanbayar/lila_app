using System.Text.Json.Serialization;

namespace LilaPrinterClient.Models;

/// <summary>
/// Uygulama yapılandırması
/// </summary>
public class AppConfig
{
    /// <summary>
    /// Backend sunucu URL'i
    /// </summary>
    [JsonPropertyName("serverUrl")]
    public string ServerUrl { get; set; } = "http://localhost:3000";

    /// <summary>
    /// Restoran ID
    /// </summary>
    [JsonPropertyName("restaurantId")]
    public int RestaurantId { get; set; }

    /// <summary>
    /// Restoran adı
    /// </summary>
    [JsonPropertyName("restaurantName")]
    public string RestaurantName { get; set; } = string.Empty;

    /// <summary>
    /// Seçili yazıcı adı
    /// </summary>
    [JsonPropertyName("printerName")]
    public string PrinterName { get; set; } = string.Empty;

    /// <summary>
    /// Windows başlangıcında otomatik başlat
    /// </summary>
    [JsonPropertyName("autoStart")]
    public bool AutoStart { get; set; } = true;

    /// <summary>
    /// Otomatik yazdırma aktif mi
    /// </summary>
    [JsonPropertyName("autoPrint")]
    public bool AutoPrint { get; set; } = true;

    /// <summary>
    /// Config kurulumu tamamlandı mı
    /// </summary>
    [JsonIgnore]
    public bool IsConfigured => RestaurantId > 0 && !string.IsNullOrEmpty(PrinterName);
}

