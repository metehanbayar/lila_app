using LilaPrinterClient.Services;
using LilaPrinterClient.UI;

namespace LilaPrinterClient;

static class Program
{
    /// <summary>
    ///  The main entry point for the application.
    /// </summary>
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();

        // Config yükle
        var config = ConfigService.LoadConfig();

        // Config yoksa veya geçersizse, kurulum wizard'ı göster
        if (!config.IsConfigured)
        {
            using var setupWizard = new SetupWizardForm();
            var result = setupWizard.ShowDialog();

            if (result != DialogResult.OK || setupWizard.ResultConfig == null)
            {
                MessageBox.Show(
                    "Kurulum iptal edildi. Uygulama kapatılıyor.",
                    "Kurulum İptal",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
                return;
            }

            config = setupWizard.ResultConfig;
        }

        // Tray uygulamasını başlat
        try
        {
            var trayContext = new TrayApplicationContext(config);
            Application.Run(trayContext);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Uygulama başlatılırken hata oluştu:\n\n{ex.Message}",
                "Hata",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }
}