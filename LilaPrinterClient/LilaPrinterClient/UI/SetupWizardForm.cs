using LilaPrinterClient.Models;
using LilaPrinterClient.Services;

namespace LilaPrinterClient.UI;

/// <summary>
/// İlk kurulum sihirbazı
/// </summary>
public class SetupWizardForm : Form
{
    private TextBox txtServerUrl = null!;
    private NumericUpDown numRestaurantId = null!;
    private TextBox txtRestaurantName = null!;
    private ComboBox cboPrinter = null!;
    private Button btnTestPrint = null!;
    private Button btnSave = null!;
    private AppConfig? _resultConfig;

    public AppConfig? ResultConfig => _resultConfig;

    public SetupWizardForm()
    {
        InitializeComponents();
        LoadPrinters();
    }

    private void InitializeComponents()
    {
        this.Text = "Lila Printer - İlk Kurulum";
        this.Size = new Size(500, 400);
        this.StartPosition = FormStartPosition.CenterScreen;
        this.FormBorderStyle = FormBorderStyle.FixedDialog;
        this.MaximizeBox = false;

        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(20)
        };

        int yPos = 10;

        // Başlık
        var lblTitle = new Label
        {
            Text = "Lila Printer Client Kurulumu",
            Font = new Font("Segoe UI", 14, FontStyle.Bold),
            Location = new Point(10, yPos),
            AutoSize = true
        };
        panel.Controls.Add(lblTitle);
        yPos += 40;

        // Sunucu URL
        var lblServer = new Label
        {
            Text = "Sunucu URL:",
            Location = new Point(10, yPos),
            AutoSize = true
        };
        panel.Controls.Add(lblServer);
        yPos += 25;

        txtServerUrl = new TextBox
        {
            Location = new Point(10, yPos),
            Width = 420,
            Text = "http://localhost:3000"
        };
        panel.Controls.Add(txtServerUrl);
        yPos += 35;

        // Restoran ID
        var lblRestaurantId = new Label
        {
            Text = "Restoran ID:",
            Location = new Point(10, yPos),
            AutoSize = true
        };
        panel.Controls.Add(lblRestaurantId);
        yPos += 25;

        numRestaurantId = new NumericUpDown
        {
            Location = new Point(10, yPos),
            Width = 100,
            Minimum = 1,
            Maximum = 999,
            Value = 1
        };
        panel.Controls.Add(numRestaurantId);
        yPos += 35;

        // Restoran Adı
        var lblRestaurantName = new Label
        {
            Text = "Restoran Adı:",
            Location = new Point(10, yPos),
            AutoSize = true
        };
        panel.Controls.Add(lblRestaurantName);
        yPos += 25;

        txtRestaurantName = new TextBox
        {
            Location = new Point(10, yPos),
            Width = 420,
            Text = "Lila Gourmet"
        };
        panel.Controls.Add(txtRestaurantName);
        yPos += 35;

        // Yazıcı
        var lblPrinter = new Label
        {
            Text = "Yazıcı Seç:",
            Location = new Point(10, yPos),
            AutoSize = true
        };
        panel.Controls.Add(lblPrinter);
        yPos += 25;

        cboPrinter = new ComboBox
        {
            Location = new Point(10, yPos),
            Width = 320,
            DropDownStyle = ComboBoxStyle.DropDownList
        };
        panel.Controls.Add(cboPrinter);

        btnTestPrint = new Button
        {
            Text = "Test Yazdır",
            Location = new Point(340, yPos),
            Width = 90
        };
        btnTestPrint.Click += BtnTestPrint_Click;
        panel.Controls.Add(btnTestPrint);
        yPos += 50;

        // Kaydet butonu
        btnSave = new Button
        {
            Text = "Kaydet ve Başlat",
            Location = new Point(10, yPos),
            Width = 420,
            Height = 40,
            BackColor = Color.Green,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10, FontStyle.Bold)
        };
        btnSave.Click += BtnSave_Click;
        panel.Controls.Add(btnSave);

        this.Controls.Add(panel);
    }

    private void LoadPrinters()
    {
        cboPrinter.Items.Clear();

        var printers = PrinterService.GetAvailablePrinters();

        if (printers.Count == 0)
        {
            MessageBox.Show(
                "Sistemde yazıcı bulunamadı!",
                "Uyarı",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning
            );
            return;
        }

        foreach (var printer in printers)
        {
            cboPrinter.Items.Add(printer);
        }

        // Varsayılan yazıcıyı seç
        var defaultPrinter = PrinterService.GetDefaultPrinter();
        if (!string.IsNullOrEmpty(defaultPrinter) && cboPrinter.Items.Contains(defaultPrinter))
        {
            cboPrinter.SelectedItem = defaultPrinter;
        }
        else if (cboPrinter.Items.Count > 0)
        {
            cboPrinter.SelectedIndex = 0;
        }
    }

    private void BtnTestPrint_Click(object? sender, EventArgs e)
    {
        if (cboPrinter.SelectedItem == null)
        {
            MessageBox.Show("Lütfen yazıcı seçin!", "Uyarı", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        var testOrder = new OrderData
        {
            OrderNumber = "TEST-" + DateTime.Now.Ticks,
            RestaurantName = txtRestaurantName.Text,
            CustomerName = "Test Müşteri",
            CustomerPhone = "0555 123 4567",
            CustomerAddress = "Test Adres, Test Mahalle, No: 123",
            Notes = "Bu bir test yazdırmasıdır.",
            Subtotal = 100m,
            TotalAmount = 100m,
            Items = new List<OrderItem>
            {
                new() { ProductName = "Test Ürün 1", Quantity = 2, Price = 30m, Subtotal = 60m },
                new() { ProductName = "Test Ürün 2", Quantity = 1, Price = 40m, Subtotal = 40m }
            },
            CreatedAt = DateTime.Now
        };

        var printerName = cboPrinter.SelectedItem?.ToString() ?? "";
        bool success = PrinterService.PrintReceipt(printerName, testOrder, null); // null = varsayılan template

        MessageBox.Show(
            success ? "Test yazdırma başarılı!" : "Test yazdırma başarısız!",
            "Test",
            MessageBoxButtons.OK,
            success ? MessageBoxIcon.Information : MessageBoxIcon.Error
        );
    }

    private void BtnSave_Click(object? sender, EventArgs e)
    {
        // Validasyon
        if (string.IsNullOrWhiteSpace(txtServerUrl.Text))
        {
            MessageBox.Show("Sunucu URL gerekli!", "Uyarı", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        if (string.IsNullOrWhiteSpace(txtRestaurantName.Text))
        {
            MessageBox.Show("Restoran adı gerekli!", "Uyarı", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        if (cboPrinter.SelectedItem == null)
        {
            MessageBox.Show("Yazıcı seçmelisiniz!", "Uyarı", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        // Config oluştur
        _resultConfig = new AppConfig
        {
            ServerUrl = txtServerUrl.Text.Trim(),
            RestaurantId = (int)numRestaurantId.Value,
            RestaurantName = txtRestaurantName.Text.Trim(),
            PrinterName = cboPrinter.SelectedItem.ToString()!,
            AutoStart = true,
            AutoPrint = true
        };

        // Kaydet
        if (ConfigService.SaveConfig(_resultConfig))
        {
            MessageBox.Show(
                "Ayarlar kaydedildi!\n\nUygulama şimdi başlatılacak.",
                "Başarılı",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );

            this.DialogResult = DialogResult.OK;
            this.Close();
        }
        else
        {
            MessageBox.Show(
                "Ayarlar kaydedilemedi!",
                "Hata",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }
}

