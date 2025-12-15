import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  productName: string;
  packageName: string;
  total: number;
  paymentDeadline: string;
  invoiceUrl: string;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(data.total);

  const formattedDeadline = new Date(data.paymentDeadline).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'LinkWedding <noreply@linkwedding.id>',
      to: data.customerEmail,
      subject: `Pesanan Anda - ${data.invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LinkWedding</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Pesanan Berhasil Dibuat</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 30px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">
                  Halo <strong>${data.customerName}</strong>,
                </p>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 25px;">
                  Terima kasih telah memesan di LinkWedding. Berikut detail pesanan Anda:
                </p>
                
                <!-- Order Details -->
                <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">No. Invoice</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Produk</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${data.productName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Paket</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${data.packageName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Total Pembayaran</td>
                      <td style="padding: 12px 0; color: #0891b2; font-size: 18px; font-weight: 700; text-align: right; border-top: 1px solid #e5e7eb;">${formattedTotal}</td>
                    </tr>
                  </table>
                </div>
                
                <!-- Deadline Warning -->
                <div style="background-color: #fef3c7; border-radius: 12px; padding: 15px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
                  <p style="color: #92400e; font-size: 14px; margin: 0;">
                    <strong>⏰ Batas Waktu Pembayaran:</strong><br>
                    ${formattedDeadline}
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center;">
                  <a href="${data.invoiceUrl}" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                    Lihat Invoice
                  </a>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  © 2025 LinkWedding. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }

}

interface PaymentProofEmailData {
  invoiceNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  proofUrl: string;
}

export async function sendPaymentProofNotification(data: PaymentProofEmailData) {
  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(data.total);

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'LinkWedding <notification@linkwedding.id>',
      to: 'linkweddinng@gmail.com',
      subject: `[Bukti Bayar] Invoice #${data.invoiceNumber} - ${data.customerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>Konfirmasi Pembayaran Baru</h2>
          <p>Ada bukti pembayaran baru yang diupload oleh customer.</p>
          
          <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">No. Invoice</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Customer</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedTotal}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Metode</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.paymentMethod}</td>
            </tr>
          </table>

          <p>
            <a href="${data.proofUrl}" style="background-color: #0891b2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Lihat Bukti Pembayaran</a>
          </p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Email ini dikirim otomatis oleh sistem LinkWedding.
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending notification email:', error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error };
  }
}
