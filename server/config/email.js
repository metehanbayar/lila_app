import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email transporter oluştur
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendOrderEmail(order, orderItems) {
  try {
    const itemsHtml = orderItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.ProductName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.Quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.ProductPrice.toFixed(2)} ₺</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${item.Subtotal.toFixed(2)} ₺</td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EC4899 0%, #1F2937 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
          .total { background: #EC4899; color: white; padding: 15px; text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🍽️ Lila Group</h1>
            <p style="margin: 10px 0 0 0;">Yeni Sipariş Bildirimi</p>
          </div>
          <div class="content">
            <h2 style="color: #EC4899;">Sipariş Detayları</h2>
            <div class="order-info">
              <p><strong>Sipariş No:</strong> ${order.OrderNumber}</p>
              <p><strong>Tarih:</strong> ${new Date(order.CreatedAt).toLocaleString('tr-TR')}</p>
              <p><strong>Müşteri Adı:</strong> ${order.CustomerName}</p>
              <p><strong>Telefon:</strong> ${order.CustomerPhone}</p>
              <p><strong>Adres:</strong> ${order.CustomerAddress}</p>
              ${order.Notes ? `<p><strong>Not:</strong> ${order.Notes}</p>` : ''}
            </div>
            
            <h3>Sipariş Ürünleri</h3>
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th style="text-align: center;">Adet</th>
                  <th style="text-align: right;">Fiyat</th>
                  <th style="text-align: right;">Toplam</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              TOPLAM: ${order.TotalAmount.toFixed(2)} ₺
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Lila Group Menü" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      subject: `🔔 Yeni Sipariş - ${order.OrderNumber}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Sipariş e-postası gönderildi:', order.OrderNumber);
    return true;
  } catch (error) {
    console.error('❌ E-posta gönderim hatası:', error);
    return false;
  }
}

export default transporter;

