import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface OrderNotification {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Use free email service - Gmail SMTP (free up to 100 emails/day per account)
    // In production, you can create multiple Gmail accounts or use other free services
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'uzpharm.notifications@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password' // App password for Gmail
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"UzPharm Digital" <${process.env.EMAIL_USER || 'uzpharm.notifications@gmail.com'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0; font-size: 24px;">🏥 UzPharm Digital</h1>
            <p style="color: #64748b; margin: 5px 0 0 0;">Verification Code</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="color: white; margin: 0; font-size: 36px; letter-spacing: 2px;">${code}</h2>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">This code expires in 5 minutes</p>
          </div>
          
          <div style="text-align: center; color: #64748b; font-size: 14px;">
            <p>Enter this code to verify your account</p>
            <p>If you didn't request this code, please ignore this email</p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>UzPharm Digital - AI-Powered Healthcare Platform</p>
            <p>🌐 www.uzpharm.digital | 📱 +998 71 123-45-67</p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'UzPharm - Your Verification Code',
      html: html
    });
  }

  async sendOrderConfirmation(order: OrderNotification, language: string = 'en'): Promise<boolean> {
    const translations = {
      uz: {
        subject: `Buyurtma tasdiqlandi - ${order.orderNumber}`,
        greeting: `Hurmatli ${order.customerName},`,
        orderConfirmed: 'Sizning buyurtmangiz muvaffaqiyatli qabul qilindi.',
        orderDetails: 'Buyurtma tafsilotlari:',
        orderNumber: 'Buyurtma raqami',
        total: 'Jami summa',
        status: 'Holat',
        items: 'Mahsulotlar',
        quantity: 'Miqdor',
        price: 'Narx',
        thankYou: "UzPharm Digital xizmatidan foydalanganingiz uchun rahmat!",
        support: "Savollaringiz bo'lsa, biz bilan bog'laning: support@uzpharm.uz"
      },
      ru: {
        subject: `Заказ подтвержден - ${order.orderNumber}`,
        greeting: `Уважаемый ${order.customerName},`,
        orderConfirmed: 'Ваш заказ успешно принят.',
        orderDetails: 'Детали заказа:',
        orderNumber: 'Номер заказа',
        total: 'Общая сумма',
        status: 'Статус',
        items: 'Товары',
        quantity: 'Количество',
        price: 'Цена',
        thankYou: "Спасибо за использование UzPharm Digital!",
        support: "Если у вас есть вопросы, свяжитесь с нами: support@uzpharm.uz"
      },
      en: {
        subject: `Order Confirmed - ${order.orderNumber}`,
        greeting: `Dear ${order.customerName},`,
        orderConfirmed: 'Your order has been successfully received.',
        orderDetails: 'Order Details:',
        orderNumber: 'Order Number',
        total: 'Total Amount',
        status: 'Status',
        items: 'Items',
        quantity: 'Quantity',
        price: 'Price',
        thankYou: "Thank you for using UzPharm Digital!",
        support: "If you have any questions, contact us: support@uzpharm.uz"
      }
    };

    const t = translations[language as keyof typeof translations] || translations.en;

    const itemsHtml = order.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px; text-align: left;">${item.name}</td>
        <td style="padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; text-align: right;">${item.price.toLocaleString()} UZS</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .order-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #667eea; color: white; padding: 12px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          .total { font-size: 18px; font-weight: bold; color: #667eea; text-align: right; margin-top: 10px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 UzPharm Digital</h1>
            <p>AI-Powered Healthcare Platform</p>
          </div>
          
          <div class="content">
            <h2>${t.greeting}</h2>
            <p>${t.orderConfirmed}</p>
            
            <div class="order-info">
              <h3>${t.orderDetails}</h3>
              <p><strong>${t.orderNumber}:</strong> ${order.orderNumber}</p>
              <p><strong>${t.status}:</strong> ${order.status}</p>
            </div>

            <h3>${t.items}:</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">${t.quantity}</th>
                  <th style="text-align: right;">${t.price}</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              ${t.total}: ${order.totalAmount.toLocaleString()} UZS
            </div>

            <p style="margin-top: 30px;">${t.thankYou}</p>
          </div>
          
          <div class="footer">
            <p>${t.support}</p>
            <p>🌐 www.uzpharm.digital | 📱 +998 71 123-45-67</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: order.customerEmail,
      subject: t.subject,
      html: html
    });
  }

  async sendConsultationSummary(userEmail: string, consultationData: any, language: string = 'en'): Promise<boolean> {
    const translations = {
      uz: {
        subject: 'AI Konsultatsiya Xulosasi',
        greeting: 'Hurmatli mijoz,',
        summary: 'AI konsultatsiyangiz xulosasi:',
        recommendations: 'Tavsiyalar',
        disclaimer: 'Eslatma: Bu AI tomonidan yaratilgan maslahhat bo\'lib, haqiqiy shifokor konsultatsiyasini almashtirmaydi.'
      },
      ru: {
        subject: 'Сводка ИИ Консультации',
        greeting: 'Уважаемый клиент,',
        summary: 'Сводка вашей ИИ консультации:',
        recommendations: 'Рекомендации',
        disclaimer: 'Примечание: Это совет, созданный ИИ, и не заменяет консультацию реального врача.'
      },
      en: {
        subject: 'AI Consultation Summary',
        greeting: 'Dear client,',
        summary: 'Here is your AI consultation summary:',
        recommendations: 'Recommendations',
        disclaimer: 'Note: This is AI-generated advice and does not replace consultation with a real doctor.'
      }
    };

    const t = translations[language as keyof typeof translations] || translations.en;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .consultation-summary { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .disclaimer { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤖 MedAssist AI</h1>
            <p>Medical Consultation Summary</p>
          </div>
          
          <div class="content">
            <h2>${t.greeting}</h2>
            <p>${t.summary}</p>
            
            <div class="consultation-summary">
              <h3>📝 Consultation Details</h3>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Symptoms:</strong> ${consultationData.symptoms || 'N/A'}</p>
              <p><strong>AI Response:</strong> ${consultationData.response || 'N/A'}</p>
              
              ${consultationData.recommendations ? `
                <h4>${t.recommendations}:</h4>
                <ul>
                  ${consultationData.recommendations.map((rec: any) => `<li>${rec.description}</li>`).join('')}
                </ul>
              ` : ''}
            </div>

            <div class="disclaimer">
              <p><strong>⚠️ ${t.disclaimer}</strong></p>
            </div>
          </div>
          
          <div class="footer">
            <p>🌐 www.uzpharm.digital | 📱 +998 71 123-45-67</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: t.subject,
      html: html
    });
  }

  async sendPasswordReset(userEmail: string, resetToken: string, language: string = 'en'): Promise<boolean> {
    const translations = {
      uz: {
        subject: 'Parolni tiklash',
        greeting: 'Hurmatli foydalanuvchi,',
        resetRequest: 'Parolni tiklash so\'rovi olindi.',
        resetLink: 'Parolni tiklash uchun quyidagi havola ustiga bosing:',
        expiry: 'Bu havola 1 soat davomida amal qiladi.',
        ignore: 'Agar bu so\'rovni siz yubormagan bo\'lsangiz, bu xabarni e\'tiborsiz qoldiring.'
      },
      ru: {
        subject: 'Сброс пароля',
        greeting: 'Уважаемый пользователь,',
        resetRequest: 'Получен запрос на сброс пароля.',
        resetLink: 'Нажмите на ссылку ниже, чтобы сбросить пароль:',
        expiry: 'Эта ссылка действительна в течение 1 часа.',
        ignore: 'Если вы не отправляли этот запрос, проигнорируйте это письмо.'
      },
      en: {
        subject: 'Password Reset',
        greeting: 'Dear user,',
        resetRequest: 'A password reset request was received.',
        resetLink: 'Click the link below to reset your password:',
        expiry: 'This link is valid for 1 hour.',
        ignore: 'If you didn\'t make this request, please ignore this email.'
      }
    };

    const t = translations[language as keyof typeof translations] || translations.en;
    const resetUrl = `${process.env.BASE_URL || 'https://uzpharm.digital'}/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .reset-button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 UzPharm Digital</h1>
            <p>Password Reset</p>
          </div>
          
          <div class="content">
            <h2>${t.greeting}</h2>
            <p>${t.resetRequest}</p>
            <p>${t.resetLink}</p>
            
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
            
            <p style="color: #666; font-size: 14px;">${t.expiry}</p>
            <p style="color: #666; font-size: 14px;">${t.ignore}</p>
          </div>
          
          <div class="footer">
            <p>🌐 www.uzpharm.digital | 📱 +998 71 123-45-67</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: t.subject,
      html: html
    });
  }
}

export const emailService = new EmailService();
export default EmailService;