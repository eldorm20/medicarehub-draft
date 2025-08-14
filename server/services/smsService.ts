// SMS Service for Uzbekistan providers (Ucell, Beeline, UzMobile)
export class SMSService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly sender: string;

  constructor() {
    // Using Eskiz.uz SMS gateway which is popular in Uzbekistan
    this.apiKey = process.env.SMS_API_KEY || '';
    this.apiUrl = process.env.SMS_API_URL || 'https://notify.eskiz.uz/api';
    this.sender = process.env.SMS_SENDER || 'UzPharm';
  }

  async sendOTP(phone: string, code: string): Promise<void> {
    try {
      if (!this.apiKey) {
        console.log(`SMS OTP (dev mode): ${code} to ${phone}`);
        return;
      }

      const message = `UzPharm verification code: ${code}. Do not share this code with anyone.`;
      
      const response = await fetch(`${this.apiUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          mobile_phone: this.formatPhoneNumber(phone),
          message,
          from: this.sender,
          callback_url: `${process.env.BASE_URL}/api/webhooks/sms-status`
        })
      });

      if (!response.ok) {
        throw new Error(`SMS API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('SMS sent successfully:', result);
    } catch (error) {
      console.error('SMS sending error:', error);
      // In development, log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`SMS OTP (dev mode): ${code} to ${phone}`);
      }
    }
  }

  async sendOrderNotification(phone: string, orderNumber: string, status: string): Promise<void> {
    try {
      if (!this.apiKey) {
        console.log(`SMS notification (dev mode): Order ${orderNumber} status: ${status} to ${phone}`);
        return;
      }

      const message = this.getOrderStatusMessage(orderNumber, status);
      
      const response = await fetch(`${this.apiUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          mobile_phone: this.formatPhoneNumber(phone),
          message,
          from: this.sender
        })
      });

      if (!response.ok) {
        throw new Error(`SMS API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('SMS notification error:', error);
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Format for Uzbekistan numbers
    let formatted = phone.replace(/\D/g, '');
    
    // Add country code if missing
    if (!formatted.startsWith('998')) {
      formatted = '998' + formatted;
    }
    
    return '+' + formatted;
  }

  private getOrderStatusMessage(orderNumber: string, status: string): string {
    const messages = {
      confirmed: `Your order ${orderNumber} has been confirmed. We'll prepare it for you soon.`,
      preparing: `Your order ${orderNumber} is being prepared.`,
      ready_for_pickup: `Your order ${orderNumber} is ready for pickup. Please bring your ID.`,
      out_for_delivery: `Your order ${orderNumber} is out for delivery. Expected arrival in 30-60 minutes.`,
      delivered: `Your order ${orderNumber} has been delivered. Thank you for choosing UzPharm!`,
      cancelled: `Your order ${orderNumber} has been cancelled. If you have questions, please contact support.`
    };

    return messages[status as keyof typeof messages] || `Order ${orderNumber} status updated to: ${status}`;
  }

  async getDeliveryStatus(): Promise<{ balance: number; status: string }> {
    try {
      if (!this.apiKey) {
        return { balance: 1000, status: 'active' };
      }

      const response = await fetch(`${this.apiUrl}/user/get-limit`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`SMS API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        balance: result.data.remaining_balance || 0,
        status: result.data.status || 'unknown'
      };
    } catch (error) {
      console.error('SMS status check error:', error);
      return { balance: 0, status: 'error' };
    }
  }
}

export const smsService = new SMSService();