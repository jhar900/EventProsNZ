/**
 * Stripe Validation Service
 * Handles Stripe payment validation and security measures
 */

import Stripe from 'stripe';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentValidationData {
  amount: number;
  currency: string;
  paymentMethodId?: string;
  customerId?: string;
}

export class StripeValidationService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });
  }

  /**
   * Validate payment intent data
   */
  async validatePaymentIntent(
    data: PaymentValidationData
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate amount
      if (data.amount <= 0) {
        errors.push('Amount must be greater than 0');
      }

      if (data.amount < 50) {
        errors.push('Amount must be at least 50 cents');
      }

      if (data.amount > 999999) {
        errors.push('Amount exceeds maximum limit');
      }

      // Validate currency
      const supportedCurrencies = ['nzd', 'usd', 'aud', 'eur', 'gbp'];
      if (!supportedCurrencies.includes(data.currency.toLowerCase())) {
        errors.push('Unsupported currency');
      }

      // Validate payment method if provided
      if (data.paymentMethodId) {
        const paymentMethodValidation = await this.validatePaymentMethod(
          data.paymentMethodId
        );
        if (!paymentMethodValidation.isValid) {
          errors.push(...paymentMethodValidation.errors);
        }
        warnings.push(...paymentMethodValidation.warnings);
      }

      // Validate customer if provided
      if (data.customerId) {
        const customerValidation = await this.validateCustomer(data.customerId);
        if (!customerValidation.isValid) {
          errors.push(...customerValidation.errors);
        }
        warnings.push(...customerValidation.warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation failed: ' + (error as Error).message],
        warnings: [],
      };
    }
  }

  /**
   * Validate payment method
   */
  async validatePaymentMethod(
    paymentMethodId: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const paymentMethod =
        await this.stripe.paymentMethods.retrieve(paymentMethodId);

      // Check if payment method is valid
      if (!paymentMethod) {
        errors.push('Payment method not found');
        return { isValid: false, errors, warnings };
      }

      // Check if payment method is attached to a customer
      if (!paymentMethod.customer) {
        errors.push('Payment method must be attached to a customer');
      }

      // Validate card details if it's a card payment method
      if (paymentMethod.type === 'card' && paymentMethod.card) {
        const cardValidation = this.validateCardDetails(paymentMethod.card);
        if (!cardValidation.isValid) {
          errors.push(...cardValidation.errors);
        }
        warnings.push(...cardValidation.warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          'Failed to validate payment method: ' + (error as Error).message,
        ],
        warnings: [],
      };
    }
  }

  /**
   * Validate customer
   */
  async validateCustomer(customerId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (!customer || customer.deleted) {
        errors.push('Customer not found or deleted');
        return { isValid: false, errors, warnings };
      }

      // Check if customer has email
      if (!customer.email) {
        warnings.push('Customer does not have an email address');
      }

      // Check if customer has payment methods
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      if (paymentMethods.data.length === 0) {
        warnings.push('Customer has no payment methods');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Failed to validate customer: ' + (error as Error).message],
        warnings: [],
      };
    }
  }

  /**
   * Validate card details
   */
  private validateCardDetails(
    card: Stripe.PaymentMethod.Card
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if card is expired
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (
      card.exp_year < currentYear ||
      (card.exp_year === currentYear && card.exp_month < currentMonth)
    ) {
      errors.push('Card has expired');
    }

    // Check if card expires soon (within 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (
      card.exp_year < threeMonthsFromNow.getFullYear() ||
      (card.exp_year === threeMonthsFromNow.getFullYear() &&
        card.exp_month < threeMonthsFromNow.getMonth() + 1)
    ) {
      warnings.push('Card expires within 3 months');
    }

    // Check card brand
    const supportedBrands = ['visa', 'mastercard', 'amex', 'discover'];
    if (!supportedBrands.includes(card.brand.toLowerCase())) {
      warnings.push('Card brand may not be supported in all regions');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate payment intent for fraud detection
   */
  async validateForFraud(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check for suspicious patterns
      if (paymentIntent.amount > 1000000) {
        // $10,000
        warnings.push('Large payment amount detected');
      }

      // Check for rapid successive payments
      const recentPayments = await this.stripe.paymentIntents.list({
        customer: paymentIntent.customer as string,
        limit: 10,
      });

      const recentCount = recentPayments.data.filter(
        pi => Math.abs(pi.created - paymentIntent.created) < 300 // 5 minutes
      ).length;

      if (recentCount > 3) {
        warnings.push('Multiple rapid payments detected');
      }

      // Check for unusual payment patterns
      const customerPayments = await this.stripe.paymentIntents.list({
        customer: paymentIntent.customer as string,
        limit: 100,
      });

      const totalAmount = customerPayments.data.reduce(
        (sum, pi) => sum + pi.amount,
        0
      );

      if (totalAmount > 5000000) {
        // $50,000
        warnings.push('High total payment volume detected');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Fraud validation failed: ' + (error as Error).message],
        warnings: [],
      };
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate API key
   */
  validateApiKey(): boolean {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || !publishableKey) {
      return false;
    }

    // Check if keys are in correct format
    const secretKeyPattern = /^sk_(test_|live_)[a-zA-Z0-9]{24,}$/;
    const publishableKeyPattern = /^pk_(test_|live_)[a-zA-Z0-9]{24,}$/;

    return (
      secretKeyPattern.test(secretKey) &&
      publishableKeyPattern.test(publishableKey)
    );
  }

  /**
   * Get validation summary
   */
  getValidationSummary(validation: ValidationResult): string {
    if (validation.isValid) {
      if (validation.warnings.length > 0) {
        return `Valid with ${validation.warnings.length} warning(s)`;
      }
      return 'Valid';
    } else {
      return `Invalid: ${validation.errors.join(', ')}`;
    }
  }
}
