using System.Text.Json.Serialization;

namespace LilaPrinterClient.Models;

/// <summary>
/// Fiş template ayarları
/// </summary>
public class ReceiptTemplate
{
    [JsonPropertyName("showLogo")]
    public bool ShowLogo { get; set; }

    [JsonPropertyName("logoUrl")]
    public string? LogoUrl { get; set; }

    [JsonPropertyName("fontSize")]
    public FontSizes FontSize { get; set; } = new();

    [JsonPropertyName("showQRCode")]
    public bool ShowQRCode { get; set; }

    [JsonPropertyName("qrCodeType")]
    public string QrCodeType { get; set; } = "orderNumber";

    [JsonPropertyName("showBarcode")]
    public bool ShowBarcode { get; set; }

    [JsonPropertyName("barcodeType")]
    public string BarcodeType { get; set; } = "orderNumber";

    [JsonPropertyName("headerText")]
    public List<string> HeaderText { get; set; } = new();

    [JsonPropertyName("footerText")]
    public List<string> FooterText { get; set; } = new();

    [JsonPropertyName("showCustomerAddress")]
    public bool ShowCustomerAddress { get; set; } = true;

    [JsonPropertyName("showCustomerPhone")]
    public bool ShowCustomerPhone { get; set; } = true;

    [JsonPropertyName("showNotes")]
    public bool ShowNotes { get; set; } = true;

    [JsonPropertyName("showItemPrices")]
    public bool ShowItemPrices { get; set; } = true;

    [JsonPropertyName("showDiscount")]
    public bool ShowDiscount { get; set; } = true;

    [JsonPropertyName("paperWidth")]
    public int PaperWidth { get; set; } = 75;

    [JsonPropertyName("lineSpacing")]
    public int LineSpacing { get; set; } = 12;

    [JsonPropertyName("margins")]
    public Margins Margins { get; set; } = new();

    [JsonPropertyName("contactInfo")]
    public ContactInfo ContactInfo { get; set; } = new();
}

public class FontSizes
{
    [JsonPropertyName("title")]
    public int Title { get; set; } = 12;

    [JsonPropertyName("normal")]
    public int Normal { get; set; } = 8;

    [JsonPropertyName("bold")]
    public int Bold { get; set; } = 9;

    [JsonPropertyName("small")]
    public int Small { get; set; } = 7;
}

public class Margins
{
    [JsonPropertyName("left")]
    public int Left { get; set; } = 5;

    [JsonPropertyName("right")]
    public int Right { get; set; } = 5;

    [JsonPropertyName("top")]
    public int Top { get; set; } = 5;

    [JsonPropertyName("bottom")]
    public int Bottom { get; set; } = 30;
}

public class ContactInfo
{
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("website")]
    public string? Website { get; set; }

    [JsonPropertyName("instagram")]
    public string? Instagram { get; set; }

    [JsonPropertyName("address")]
    public string? Address { get; set; }
}

