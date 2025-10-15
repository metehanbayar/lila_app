using LilaPrinterClient.Models;
using LilaPrinterClient.Services;

namespace LilaPrinterClient.UI;

/// <summary>
/// Ayarlar formu
/// </summary>
public class SettingsForm : Form
{
    private readonly AppConfig _config;
    private TextBox txtServerUrl = null!;
    private NumericUpDown numRestaurantId = null!;
    private TextBox txtRestaurantName = null!;
    private ComboBox cboPrinter = null!;
    private CheckBox chkAutoStart = null!;
    private CheckBox chkAutoPrint = null!;
    private Button btnTestPrint = null!;
    private Button btnSave = null!;
    private Button btnCancel = null!;

    public bool ConfigChanged { get; private set; }

    public SettingsForm(AppConfig config)
    {
        _config = config;
        InitializeComponents();
        LoadCurrentSettings();
        LoadPrinters();
    }

    private void InitializeComponents()
    {
        this.Text = "Ayarlar";
        this.Size = new Size(500, 450);
        this.StartPosition = FormStartPosition.CenterScreen;
        this.FormBorderStyle = FormBorderStyle.FixedDialog;
        this.MaximizeBox = false;
        this.MinimizeBox = false;

        var panel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(20),
            AutoScroll = true
        };

        int yPos = 10;

        // Başlık
        var lblTitle = new Label
        {
            Text = "Lila Printer - Ayarlar",
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            Location = new Point(10, yPos),
            AutoSize = true
        };
        panel.Controls.Add(lblTitle);
        yPos += 35;

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
            Maximum = 999
        };
        panel.Controls.Add(numRestaurantId);

        var lblRestaurantIdHelp = new Label
        {
            Text = "(Admin panelden kontrol edin)",
            Location = new Point(120, yPos + 3),
            AutoSize = true,
            ForeColor = Color.Gray,
            Font = new Font("Segoe UI", 8)
        };
        panel.Controls.Add(lblRestaurantIdHelp);
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
            Width = 420
        };
        panel.Controls.Add(txtRestaurantName);
        yPos += 35;

        // Yazıcı
        var lblPrinter = new Label
        {
            Text = "Yazıcı:",
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
            Width = 90,
            BackColor = Color.LightBlue
        };
        btnTestPrint.Click += BtnTestPrint_Click;
        panel.Controls.Add(btnTestPrint);
        yPos += 40;

        // Auto Start
        chkAutoStart = new CheckBox
        {
            Text = "Windows başlangıcında otomatik başlat",
            Location = new Point(10, yPos),
            AutoSize = true
        };
        panel.Controls.Add(chkAutoStart);
        yPos += 30;

        // Auto Print
        chkAutoPrint = new CheckBox
        {
            Text = "Siparişleri otomatik yazdır",
            Location = new Point(10, yPos),
            AutoSize = true,
            Checked = true
        };
        panel.Controls.Add(chkAutoPrint);
        yPos += 45;

        // Butonlar
        btnCancel = new Button
        {
            Text = "İptal",
            Location = new Point(10, yPos),
            Width = 200,
            Height = 35,
            DialogResult = DialogResult.Cancel
        };
        panel.Controls.Add(btnCancel);

        btnSave = new Button
        {
            Text = "Kaydet",
            Location = new Point(230, yPos),
            Width = 200,
            Height = 35,
            BackColor = Color.Green,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10, FontStyle.Bold)
        };
        btnSave.Click += BtnSave_Click;
        panel.Controls.Add(btnSave);

        this.Controls.Add(panel);
    }

    private void LoadCurrentSettings()
    {
        txtServerUrl.Text = _config.ServerUrl;
        numRestaurantId.Value = _config.RestaurantId;
        txtRestaurantName.Text = _config.RestaurantName;
        chkAutoStart.Checked = _config.AutoStart;
        chkAutoPrint.Checked = _config.AutoPrint;
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

        // Mevcut yazıcıyı seç
        if (!string.IsNullOrEmpty(_config.PrinterName) && cboPrinter.Items.Contains(_config.PrinterName))
        {
            cboPrinter.SelectedItem = _config.PrinterName;
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
            CustomerAddress = "Test Adres, Test Mahalle, No: 123, Test İlçesi",
            Notes = "Bu bir test yazdırmasıdır.",
            Subtotal = 100m,
            TotalAmount = 100m,
            Items = new List<OrderItem>
            {
                new() { ProductName = "Test Ürün 1", Quantity = 2, Price = 30m, Subtotal = 60m },
                new() { ProductName = "Test Ürün 2", VariantName = "Büyük", Quantity = 1, Price = 40m, Subtotal = 40m }
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

        // Değişiklikleri kontrol et
        bool changed = 
            _config.ServerUrl != txtServerUrl.Text.Trim() ||
            _config.RestaurantId != (int)numRestaurantId.Value ||
            _config.RestaurantName != txtRestaurantName.Text.Trim() ||
            _config.PrinterName != cboPrinter.SelectedItem.ToString() ||
            _config.AutoStart != chkAutoStart.Checked ||
            _config.AutoPrint != chkAutoPrint.Checked;

        if (!changed)
        {
            MessageBox.Show("Değişiklik yapılmadı.", "Bilgi", MessageBoxButtons.OK, MessageBoxIcon.Information);
            this.DialogResult = DialogResult.Cancel;
            this.Close();
            return;
        }

        // Config güncelle
        _config.ServerUrl = txtServerUrl.Text.Trim();
        _config.RestaurantId = (int)numRestaurantId.Value;
        _config.RestaurantName = txtRestaurantName.Text.Trim();
        _config.PrinterName = cboPrinter.SelectedItem.ToString()!;
        _config.AutoStart = chkAutoStart.Checked;
        _config.AutoPrint = chkAutoPrint.Checked;

        // Kaydet
        if (ConfigService.SaveConfig(_config))
        {
            ConfigChanged = true;

            var result = MessageBox.Show(
                "Ayarlar kaydedildi!\n\n" +
                "Değişikliklerin geçerli olması için uygulamayı yeniden başlatmanız gerekiyor.\n\n" +
                "Şimdi yeniden başlatmak ister misiniz?",
                "Başarılı",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (result == DialogResult.Yes)
            {
                this.DialogResult = DialogResult.OK;
                this.Close();
                
                // Uygulamayı yeniden başlat
                Application.Restart();
            }
            else
            {
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
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

