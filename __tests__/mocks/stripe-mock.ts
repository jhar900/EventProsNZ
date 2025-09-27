/**
 * Stripe Mock for Testing
 * Mock implementation of Stripe service for testing
 */

export class MockStripeService {
  private customers: Map<string, any> = new Map();
  private subscriptions: Map<string, any> = new Map();
  private prices: Map<string, any> = new Map();
  private paymentMethods: Map<string, any> = new Map();

  async createCustomer(data: any) {
    const customer = {
      id: `cus_${Date.now()}`,
      email: data.email,
      metadata: data.metadata || {},
      created: Math.floor(Date.now() / 1000),
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async getCustomer(customerId: string) {
    return this.customers.get(customerId) || null;
  }

  async listCustomers(params: any) {
    const customers = Array.from(this.customers.values());
    return {
      data: customers,
      has_more: false,
    };
  }

  async createPrice(data: any) {
    const price = {
      id: `price_${Date.now()}`,
      unit_amount: data.unit_amount,
      currency: data.currency,
      recurring: data.recurring,
      product_data: data.product_data,
      metadata: data.metadata || {},
      created: Math.floor(Date.now() / 1000),
    };
    this.prices.set(price.id, price);
    return price;
  }

  async getPrice(priceId: string) {
    return this.prices.get(priceId) || null;
  }

  async createSubscription(data: any) {
    const subscription = {
      id: `sub_${Date.now()}`,
      customer: data.customer,
      status: data.trial_period_days ? 'trialing' : 'incomplete',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end:
        Math.floor(Date.now() / 1000) +
        (data.trial_period_days || 30) * 24 * 60 * 60,
      items: {
        data: [
          {
            id: `si_${Date.now()}`,
            price: {
              id: data.items[0].price,
              unit_amount:
                this.prices.get(data.items[0].price)?.unit_amount || 0,
              currency: this.prices.get(data.items[0].price)?.currency || 'nzd',
            },
          },
        ],
      },
      trial_start: data.trial_period_days
        ? Math.floor(Date.now() / 1000)
        : null,
      trial_end: data.trial_period_days
        ? Math.floor(Date.now() / 1000) + data.trial_period_days * 24 * 60 * 60
        : null,
      created: Math.floor(Date.now() / 1000),
    };
    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async getSubscription(subscriptionId: string) {
    return this.subscriptions.get(subscriptionId) || null;
  }

  async updateSubscription(subscriptionId: string, data: any) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const updatedSubscription = {
      ...subscription,
      ...data,
      id: subscriptionId,
    };
    this.subscriptions.set(subscriptionId, updatedSubscription);
    return updatedSubscription;
  }

  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (immediately) {
      subscription.status = 'canceled';
      subscription.canceled_at = Math.floor(Date.now() / 1000);
    } else {
      subscription.cancel_at_period_end = true;
    }

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  async createPaymentMethod(data: any) {
    const paymentMethod = {
      id: `pm_${Date.now()}`,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      },
      created: Math.floor(Date.now() / 1000),
    };
    this.paymentMethods.set(paymentMethod.id, paymentMethod);
    return paymentMethod;
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    const paymentMethod = this.paymentMethods.get(paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    paymentMethod.customer = customerId;
    this.paymentMethods.set(paymentMethodId, paymentMethod);
    return paymentMethod;
  }

  async updateCustomer(customerId: string, data: any) {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedCustomer = {
      ...customer,
      ...data,
      id: customerId,
    };
    this.customers.set(customerId, updatedCustomer);
    return updatedCustomer;
  }

  async createPaymentIntent(data: any) {
    return {
      id: `pi_${Date.now()}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: data.amount,
      currency: data.currency,
      status: 'requires_payment_method',
      created: Math.floor(Date.now() / 1000),
    };
  }

  async confirmPaymentIntent(paymentIntentId: string) {
    return {
      id: paymentIntentId,
      status: 'succeeded',
      charges: {
        data: [
          {
            id: `ch_${Date.now()}`,
            amount: 1000,
            currency: 'nzd',
            status: 'succeeded',
          },
        ],
      },
    };
  }

  // Webhook simulation
  constructEvent(payload: string, signature: string, secret: string) {
    if (signature === 'invalid') {
      throw new Error('Invalid signature');
    }

    const event = JSON.parse(payload);
    return {
      id: `evt_${Date.now()}`,
      type: event.type,
      data: event.data,
      created: Math.floor(Date.now() / 1000),
    };
  }

  // Test helpers
  clear() {
    this.customers.clear();
    this.subscriptions.clear();
    this.prices.clear();
    this.paymentMethods.clear();
  }

  getCustomerCount() {
    return this.customers.size;
  }

  getSubscriptionCount() {
    return this.subscriptions.size;
  }

  getPriceCount() {
    return this.prices.size;
  }

  getPaymentMethodCount() {
    return this.paymentMethods.size;
  }

  // Simulate webhook events
  simulateWebhookEvent(type: string, data: any) {
    const event = {
      id: `evt_${Date.now()}`,
      type,
      data: { object: data },
      created: Math.floor(Date.now() / 1000),
    };
    return event;
  }

  // Simulate payment failures
  simulatePaymentFailure() {
    return {
      error: {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined.',
        decline_code: 'generic_decline',
      },
    };
  }

  // Simulate network errors
  simulateNetworkError() {
    const error = new Error('Network error');
    (error as any).type = 'StripeConnectionError';
    throw error;
  }

  // Simulate rate limiting
  simulateRateLimit() {
    const error = new Error('Rate limit exceeded');
    (error as any).type = 'StripeRateLimitError';
    throw error;
  }
}

// Mock Stripe class
export class MockStripe {
  customers: any;
  subscriptions: any;
  prices: any;
  paymentMethods: any;
  paymentIntents: any;
  webhooks: any;

  constructor(apiKey: string) {
    const mockService = new MockStripeService();

    this.customers = {
      create: mockService.createCustomer.bind(mockService),
      retrieve: mockService.getCustomer.bind(mockService),
      list: mockService.listCustomers.bind(mockService),
      update: mockService.updateCustomer.bind(mockService),
    };

    this.subscriptions = {
      create: mockService.createSubscription.bind(mockService),
      retrieve: mockService.getSubscription.bind(mockService),
      update: mockService.updateSubscription.bind(mockService),
      cancel: mockService.cancelSubscription.bind(mockService),
    };

    this.prices = {
      create: mockService.createPrice.bind(mockService),
      retrieve: mockService.getPrice.bind(mockService),
    };

    this.paymentMethods = {
      create: mockService.createPaymentMethod.bind(mockService),
      attach: mockService.attachPaymentMethod.bind(mockService),
    };

    this.paymentIntents = {
      create: mockService.createPaymentIntent.bind(mockService),
      confirm: mockService.confirmPaymentIntent.bind(mockService),
    };

    this.webhooks = {
      constructEvent: mockService.constructEvent.bind(mockService),
    };

    // Expose mock service for testing
    (this as any).__mockService = mockService;
  }
}

// Export mock service instance for direct testing
export const mockStripeService = new MockStripeService();
