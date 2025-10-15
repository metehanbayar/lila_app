using System.Drawing;
using System.Drawing.Printing;
using LilaPrinterClient.Models;

namespace LilaPrinterClient.Services;

/// <summary>
/// Yazıcı işlemleri yönetimi
/// </summary>
public class PrinterService
{
    /// <summary>
    /// Sistemde kurulu yazıcıları listele
    /// </summary>
    public static List<string> GetAvailablePrinters()
    {
        var printers = new List<string>();

        foreach (string printer in PrinterSettings.InstalledPrinters)
        {
            printers.Add(printer);
        }

        return printers;
    }

    /// <summary>
    /// Varsayılan yazıcıyı al
    /// </summary>
    public static string GetDefaultPrinter()
    {
        var settings = new PrinterSettings();
        return settings.PrinterName;
    }

    /// <summary>
    /// Belirtilen yazıcıda fiş yazdır (template ile)
    /// </summary>
    public static bool PrintReceipt(string printerName, OrderData order, ReceiptTemplate? template = null)
    {
        try
        {
            // Template yoksa varsayılan kullan
            template ??= GetDefaultTemplate();

            var printDoc = new PrintDocument();
            printDoc.PrinterSettings.PrinterName = printerName;

            // Yazıcı mevcut mu kontrol et
            if (!printDoc.PrinterSettings.IsValid)
            {
                Console.WriteLine($"❌ Yazıcı bulunamadı: {printerName}");
                return false;
            }

            // PrintPage eventi
            printDoc.PrintPage += (sender, e) =>
            {
                if (e.Graphics == null) return;

                DrawReceipt(e.Graphics, order, template);
            };

            // Yazdır
            printDoc.Print();

            Console.WriteLine($"✅ Fiş yazdırıldı: {order.OrderNumber}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Yazdırma hatası: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Varsayılan template
    /// </summary>
    private static ReceiptTemplate GetDefaultTemplate()
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
    /// Fiş içeriğini çiz (template ile)
    /// </summary>
    private static void DrawReceipt(Graphics graphics, OrderData order, ReceiptTemplate template)
    {
        // Template'den ayarları al
        var titleFont = new Font("Arial", template.FontSize.Title, FontStyle.Bold);
        var normalFont = new Font("Courier New", template.FontSize.Normal);
        var boldFont = new Font("Courier New", template.FontSize.Bold, FontStyle.Bold);
        var smallFont = new Font("Courier New", template.FontSize.Small);

        var brush = Brushes.Black;
        float x = template.Margins.Left;
        float y = template.Margins.Top;
        float lineHeight = template.LineSpacing;

        // Genişlik: Template'den al (mm'den pixel'e çevir, ~3.78 px/mm @ 96 DPI)
        int width = (int)(template.PaperWidth * 3.78) - template.Margins.Left - template.Margins.Right;

        // ═══════════════════════════════
        DrawLine(graphics, normalFont, brush, x, ref y, lineHeight, "=", width);

        // Restoran adı (ortada)
        DrawCentered(graphics, titleFont, brush, x, ref y, lineHeight + 5, order.RestaurantName, width);

        DrawLine(graphics, normalFont, brush, x, ref y, lineHeight, "=", width);

        // Sipariş bilgileri
        DrawText(graphics, normalFont, brush, x, ref y, lineHeight, $"Sipariş: {order.OrderNumber}");
        DrawText(graphics, smallFont, brush, x, ref y, lineHeight - 1, $"Tarih: {order.CreatedAt:dd.MM.yyyy HH:mm}");

        DrawLine(graphics, normalFont, brush, x, ref y, lineHeight, "-", width);

        // Müşteri bilgileri (template'e göre)
        DrawText(graphics, normalFont, brush, x, ref y, lineHeight, $"Müşteri: {order.CustomerName}");
        
        if (template.ShowCustomerPhone)
        {
            DrawText(graphics, smallFont, brush, x, ref y, lineHeight - 1, $"Tel: {order.CustomerPhone}");
        }

        if (template.ShowCustomerAddress)
        {
            DrawWrappedText(graphics, smallFont, brush, x, ref y, lineHeight - 2, $"{order.CustomerAddress}", width);
        }

        DrawLine(graphics, normalFont, brush, x, ref y, lineHeight, "-", width);

        // ÜRÜNLER
        DrawText(graphics, boldFont, brush, x, ref y, lineHeight, "ÜRÜNLER:");
        DrawLine(graphics, normalFont, brush, x, ref y, lineHeight - 1, "-", width);

        // Ürün listesi - Thermal yazıcı formatı
        foreach (var item in order.Items)
        {
            var productName = string.IsNullOrEmpty(item.VariantName)
                ? item.ProductName
                : $"{item.ProductName} ({item.VariantName})";

            // Ürün adını kısalt (max 30 karakter)
            if (productName.Length > 30)
            {
                productName = productName.Substring(0, 27) + "...";
            }

            // Tek satırda: 2x Hamburger........85.00
            var qty = $"{item.Quantity}x ";
            var price = $"{item.Subtotal:F2}";
            var maxNameLen = width - (int)graphics.MeasureString(qty + price + " TL", normalFont).Width;
            
            graphics.DrawString(qty, normalFont, brush, x, y);
            graphics.DrawString(productName, normalFont, brush, x + graphics.MeasureString(qty, normalFont).Width, y);
            
            var priceX = x + width - graphics.MeasureString(price + " TL", normalFont).Width;
            graphics.DrawString(price + " TL", normalFont, brush, priceX, y);
            
            y += lineHeight;

            // Varyant varsa bir alt satırda küçük yazıyla göster
            if (!string.IsNullOrEmpty(item.VariantName) && item.Quantity > 1)
            {
                graphics.DrawString($"  (@{item.Price:F2} TL)", smallFont, brush, x, y);
                y += lineHeight - 2;
            }
        }

        DrawLine(graphics, normalFont, brush, x, ref y, lineHeight, "-", width);

        // Toplam
        if (order.DiscountAmount > 0)
        {
            DrawRightAligned(graphics, normalFont, brush, x, ref y, lineHeight,
                $"Ara Toplam: {order.Subtotal:F2} TL", width);

            DrawRightAligned(graphics, normalFont, brush, x, ref y, lineHeight,
                $"İndirim: -{order.DiscountAmount:F2} TL", width);

            if (!string.IsNullOrEmpty(order.CouponCode))
            {
                DrawRightAligned(graphics, smallFont, brush, x, ref y, lineHeight,
                    $"({order.CouponCode})", width);
            }
        }

        DrawLine(graphics, normalFont, brush, x, ref y, lineHeight, "=", width);

        DrawRightAligned(graphics, titleFont, brush, x, ref y, lineHeight + 5,
            $"TOPLAM: {order.TotalAmount:F2} TL", width);

        DrawLine(graphics, normalFont, brush, x, ref y, lineHeight, "=", width);

        // Notlar (template'e göre)
        if (template.ShowNotes && !string.IsNullOrEmpty(order.Notes))
        {
            y += 2;
            DrawText(graphics, boldFont, brush, x, ref y, lineHeight, "Not:");
            DrawWrappedText(graphics, smallFont, brush, x, ref y, lineHeight - 2, order.Notes, width);
            DrawLine(graphics, normalFont, brush, x, ref y, lineHeight, "-", width);
        }

        // Kapanış (Footer Text)
        y += 5;
        foreach (var footerLine in template.FooterText)
        {
            DrawCentered(graphics, boldFont, brush, x, ref y, lineHeight, footerLine, width);
        }

        // İletişim bilgileri (template'den)
        if (!string.IsNullOrEmpty(template.ContactInfo.Website))
        {
            DrawCentered(graphics, smallFont, brush, x, ref y, lineHeight, template.ContactInfo.Website, width);
        }

        if (!string.IsNullOrEmpty(template.ContactInfo.Phone))
        {
            DrawCentered(graphics, smallFont, brush, x, ref y, lineHeight, $"Tel: {template.ContactInfo.Phone}", width);
        }

        if (!string.IsNullOrEmpty(template.ContactInfo.Instagram))
        {
            DrawCentered(graphics, smallFont, brush, x, ref y, lineHeight, $"Instagram: {template.ContactInfo.Instagram}", width);
        }

        if (!string.IsNullOrEmpty(template.ContactInfo.Address))
        {
            DrawWrappedText(graphics, smallFont, brush, x + (width / 4), ref y, lineHeight - 2, template.ContactInfo.Address, width / 2);
        }
        
        // Kağıt kesme için boşluk (template'den)
        y += template.Margins.Bottom;
    }

    // Yardımcı metotlar
    private static void DrawText(Graphics g, Font font, Brush brush, float x, ref float y, float lineHeight, string text)
    {
        g.DrawString(text, font, brush, x, y);
        y += lineHeight;
    }

    private static void DrawCentered(Graphics g, Font font, Brush brush, float x, ref float y, float lineHeight, string text, int width)
    {
        var size = g.MeasureString(text, font);
        var centerX = x + (width - size.Width) / 2;
        g.DrawString(text, font, brush, centerX, y);
        y += lineHeight;
    }

    private static void DrawRightAligned(Graphics g, Font font, Brush brush, float x, ref float y, float lineHeight, string text, int width)
    {
        var size = g.MeasureString(text, font);
        var rightX = x + width - size.Width;
        g.DrawString(text, font, brush, rightX, y);
        y += lineHeight;
    }

    private static void DrawLine(Graphics g, Font font, Brush brush, float x, ref float y, float lineHeight, string character, int width)
    {
        var charSize = g.MeasureString(character, font);
        var charWidth = (int)charSize.Width;
        var repeatCount = width / charWidth;
        var line = new string(character[0], repeatCount);
        g.DrawString(line, font, brush, x, y);
        y += lineHeight;
    }

    private static void DrawWrappedText(Graphics g, Font font, Brush brush, float x, ref float y, float lineHeight, string text, int width)
    {
        var words = text.Split(' ');
        var currentLine = "";

        foreach (var word in words)
        {
            var testLine = string.IsNullOrEmpty(currentLine) ? word : currentLine + " " + word;
            var size = g.MeasureString(testLine, font);

            if (size.Width > width && !string.IsNullOrEmpty(currentLine))
            {
                g.DrawString(currentLine, font, brush, x, y);
                y += lineHeight;
                currentLine = word;
            }
            else
            {
                currentLine = testLine;
            }
        }

        if (!string.IsNullOrEmpty(currentLine))
        {
            g.DrawString(currentLine, font, brush, x, y);
            y += lineHeight;
        }
    }
}

