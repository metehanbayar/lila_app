using System.IO;
using System.Text.Json;
using LilaPrinterClient.Models;

namespace LilaPrinterClient.Services;

/// <summary>
/// Uygulama yapılandırma yönetimi
/// </summary>
public class ConfigService
{
    private static readonly string ConfigDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "LilaPrinterClient"
    );

    private static readonly string ConfigFilePath = Path.Combine(ConfigDirectory, "config.json");

    /// <summary>
    /// Yapılandırmayı yükle
    /// </summary>
    public static AppConfig LoadConfig()
    {
        try
        {
            if (!File.Exists(ConfigFilePath))
            {
                return new AppConfig();
            }

            var json = File.ReadAllText(ConfigFilePath);
            return JsonSerializer.Deserialize<AppConfig>(json) ?? new AppConfig();
        }
        catch (Exception ex)
        {
            // Hata durumunda varsayılan döndür
            Console.WriteLine($"Config yükleme hatası: {ex.Message}");
            return new AppConfig();
        }
    }

    /// <summary>
    /// Yapılandırmayı kaydet
    /// </summary>
    public static bool SaveConfig(AppConfig config)
    {
        try
        {
            // Dizini oluştur
            if (!Directory.Exists(ConfigDirectory))
            {
                Directory.CreateDirectory(ConfigDirectory);
            }

            // JSON'a serialize et ve kaydet
            var options = new JsonSerializerOptions { WriteIndented = true };
            var json = JsonSerializer.Serialize(config, options);
            File.WriteAllText(ConfigFilePath, json);

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Config kaydetme hatası: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Config dosyası var mı kontrol et
    /// </summary>
    public static bool ConfigExists()
    {
        return File.Exists(ConfigFilePath);
    }

    /// <summary>
    /// Config dosya yolu
    /// </summary>
    public static string GetConfigPath()
    {
        return ConfigFilePath;
    }
}

