import crypto from 'crypto';

// Payment service interfaces for Uzbekistan payment systems
interface ClickPaymentRequest {
  service_id: string;
  click_trans_id: string;
  merchant_trans_id: string;
  merchant_prepare_id: string;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

interface PaymePaymentRequest {
  method: string;
  params: {
    id?: string;
    time?: number;
    amount?: number;
    account?: {
      order_id: string;
    };
  };
}

interface YandexDeliveryRequest {
  items: Array<{
    title: string;
    cost_value: string;
    cost_currency: string;
    weight: number;
    size: {
      length: number;
      width: number; 
      height: number;
    };
  }>;
  route_points: Array<{
    point_id: number;
    visit_order: number;
    address: {
      fullname: string;
      coordinates: [number, number];
      country: string;
      city: string;
      street: string;
      building: string;
    };
    contact: {
      name: string;
      phone: string;
    };
    type: 'source' | 'destination';
  }>;
}

export class PaymentService {
  private clickServiceId: string;
  private clickMerchantId: string;
  private clickSecretKey: string;
  private paymeMerchantId: string;
  private paymeSecretKey: string;
  private yandexApiKey: string;

  constructor() {
    // Initialize from environment variables
    this.clickServiceId = process.env.CLICK_SERVICE_ID || '';
    this.clickMerchantId = process.env.CLICK_MERCHANT_ID || '';
    this.clickSecretKey = process.env.CLICK_SECRET_KEY || '';
    this.paymeMerchantId = process.env.PAYME_MERCHANT_ID || '';
    this.paymeSecretKey = process.env.PAYME_SECRET_KEY || '';
    this.yandexApiKey = process.env.YANDEX_DELIVERY_API_KEY || '';
  }

  // Click Payment System Integration
  async processClickPayment(request: ClickPaymentRequest): Promise<any> {
    try {
      // Verify Click signature
      if (!this.verifyClickSignature(request)) {
        return {
          click_trans_id: request.click_trans_id,
          merchant_trans_id: request.merchant_trans_id,
          merchant_prepare_id: request.merchant_prepare_id,
          error: -1,
          error_note: 'Invalid signature'
        };
      }

      // Handle different Click actions
      switch (request.action) {
        case 0: // Prepare
          return await this.prepareClickPayment(request);
        case 1: // Complete
          return await this.completeClickPayment(request);
        default:
          return {
            click_trans_id: request.click_trans_id,
            merchant_trans_id: request.merchant_trans_id,
            merchant_prepare_id: request.merchant_prepare_id,
            error: -3,
            error_note: 'Invalid action'
          };
      }
    } catch (error) {
      console.error('Click payment processing error:', error);
      return {
        click_trans_id: request.click_trans_id,
        merchant_trans_id: request.merchant_trans_id,
        merchant_prepare_id: request.merchant_prepare_id,
        error: -9,
        error_note: 'System error'
      };
    }
  }

  private verifyClickSignature(request: ClickPaymentRequest): boolean {
    const signString = request.click_trans_id + 
                      request.service_id + 
                      request.merchant_trans_id + 
                      request.amount + 
                      request.action + 
                      request.sign_time;
    
    const hash = crypto
      .createHash('md5')
      .update(signString + this.clickSecretKey)
      .digest('hex');
    
    return hash === request.sign_string;
  }

  private async prepareClickPayment(request: ClickPaymentRequest): Promise<any> {
    // Validate order and prepare payment
    // In production, check if order exists and amount matches
    return {
      click_trans_id: request.click_trans_id,
      merchant_trans_id: request.merchant_trans_id,
      merchant_prepare_id: Date.now().toString(),
      error: 0,
      error_note: 'Success'
    };
  }

  private async completeClickPayment(request: ClickPaymentRequest): Promise<any> {
    // Complete the payment and update order status
    // In production, mark order as paid and trigger fulfillment
    return {
      click_trans_id: request.click_trans_id,
      merchant_trans_id: request.merchant_trans_id,
      merchant_prepare_id: request.merchant_prepare_id,
      error: 0,
      error_note: 'Success'
    };
  }

  // Payme Payment System Integration
  async processPaymePayment(request: PaymePaymentRequest): Promise<any> {
    try {
      switch (request.method) {
        case 'CheckPerformTransaction':
          return await this.checkPaymeTransaction(request);
        case 'CreateTransaction':
          return await this.createPaymeTransaction(request);
        case 'PerformTransaction':
          return await this.performPaymeTransaction(request);
        case 'CancelTransaction':
          return await this.cancelPaymeTransaction(request);
        case 'CheckTransaction':
          return await this.checkPaymeTransactionStatus(request);
        default:
          return {
            error: {
              code: -32601,
              message: 'Method not found'
            }
          };
      }
    } catch (error) {
      console.error('Payme payment processing error:', error);
      return {
        error: {
          code: -32603,
          message: 'Internal error'
        }
      };
    }
  }

  private async checkPaymeTransaction(request: PaymePaymentRequest): Promise<any> {
    // Validate transaction parameters
    const { account } = request.params || {};
    if (!account?.order_id) {
      return {
        error: {
          code: -31001,
          message: 'Order not found'
        }
      };
    }

    return {
      result: {
        allow: true
      }
    };
  }

  private async createPaymeTransaction(request: PaymePaymentRequest): Promise<any> {
    // Create new transaction
    const transactionId = Date.now().toString();
    
    return {
      result: {
        create_time: Date.now(),
        transaction: transactionId,
        state: 1 // Created
      }
    };
  }

  private async performPaymeTransaction(request: PaymePaymentRequest): Promise<any> {
    // Perform the transaction
    return {
      result: {
        perform_time: Date.now(),
        transaction: request.params?.id,
        state: 2 // Performed
      }
    };
  }

  private async cancelPaymeTransaction(request: PaymePaymentRequest): Promise<any> {
    // Cancel transaction
    return {
      result: {
        cancel_time: Date.now(),
        transaction: request.params?.id,
        state: -1 // Cancelled
      }
    };
  }

  private async checkPaymeTransactionStatus(request: PaymePaymentRequest): Promise<any> {
    // Check transaction status
    return {
      result: {
        create_time: Date.now() - 300000, // 5 minutes ago
        perform_time: Date.now() - 60000,  // 1 minute ago
        cancel_time: 0,
        transaction: request.params?.id,
        state: 2,
        reason: null
      }
    };
  }

  // Yandex Delivery Integration
  async createYandexDelivery(request: YandexDeliveryRequest): Promise<any> {
    try {
      const response = await fetch('https://b2b.taxi.yandex.net/b2b/cargo/integration/v2/claims/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.yandexApiKey}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en'
        },
        body: JSON.stringify({
          items: request.items,
          route_points: request.route_points,
          client_requirements: {
            taxi_class: 'courier'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Yandex API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        claim_id: data.id,
        status: data.status,
        version: data.version
      };
    } catch (error) {
      console.error('Yandex delivery error:', error);
      return {
        success: false,
        error: 'Failed to create delivery order'
      };
    }
  }

  async trackYandexDelivery(claimId: string): Promise<any> {
    try {
      const response = await fetch(`https://b2b.taxi.yandex.net/b2b/cargo/integration/v2/claims/info?claim_id=${claimId}`, {
        headers: {
          'Authorization': `Bearer ${this.yandexApiKey}`,
          'Accept-Language': 'en'
        }
      });

      if (!response.ok) {
        throw new Error(`Yandex API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status,
        eta: data.eta,
        performer_info: data.performer_info
      };
    } catch (error) {
      console.error('Yandex tracking error:', error);
      return {
        success: false,
        error: 'Failed to track delivery'
      };
    }
  }

  // General payment processing method (wrapper for different payment systems)
  async processPayment(paymentData: { amount: number; orderId: string; userId?: string; method: string }): Promise<any> {
    const { amount, orderId, method } = paymentData;
    
    if (!this.validatePaymentAmount(amount)) {
      throw new Error('Invalid payment amount');
    }
    
    switch (method) {
      case 'click':
        // Simulate Click payment processing
        return {
          success: true,
          transactionId: this.generateTransactionId(),
          paymentUrl: `https://my.click.uz/services/pay?service_id=${this.clickServiceId}&merchant_trans_id=${orderId}&amount=${amount}`,
          status: 'pending'
        };
      case 'payme':
        // Simulate Payme payment processing
        return {
          success: true,
          transactionId: this.generateTransactionId(),
          paymentUrl: `https://checkout.paycom.uz/${btoa(JSON.stringify({ m: this.paymeMerchantId, ac: { order_id: orderId }, a: amount }))}`,
          status: 'pending'
        };
      case 'cash':
        return {
          success: true,
          transactionId: this.generateTransactionId(),
          status: 'cash_on_delivery'
        };
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  async verifyPayment(transactionId: string, method: string): Promise<boolean> {
    // Simulate payment verification
    // In production, this would call the actual payment provider APIs
    try {
      switch (method) {
        case 'click':
        case 'payme':
          // Simulate API call to verify transaction
          await new Promise(resolve => setTimeout(resolve, 100));
          return Math.random() > 0.1; // 90% success rate for simulation
        case 'cash':
          return true; // Cash payments are always verified on delivery
        default:
          return false;
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  // General payment utilities
  generateTransactionId(): string {
    return crypto.randomUUID();
  }

  calculateServiceFee(amount: number, paymentMethod: 'click' | 'payme'): number {
    // Standard service fees for Uzbekistan payment systems
    const feeRates = {
      click: 0.005, // 0.5%
      payme: 0.008  // 0.8%
    };
    
    return Math.round(amount * feeRates[paymentMethod]);
  }

  validatePaymentAmount(amount: number): boolean {
    // Validate payment amount constraints
    const minAmount = 1000; // 1,000 UZS
    const maxAmount = 100000000; // 100,000,000 UZS
    
    return amount >= minAmount && amount <= maxAmount;
  }
}

export const paymentService = new PaymentService();
export default PaymentService;