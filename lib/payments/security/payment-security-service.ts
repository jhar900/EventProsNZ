/**
 * Payment Security Service
 * Handles payment data validation, security checks, and compliance
 */

export interface PaymentData {
  amount: number;
  currency: string;
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  cardholderName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SecurityCheckResult {
  passed: boolean;
  riskScore: number;
  reasons: string[];
  recommendations: string[];
}

export class PaymentSecurityService {
  private readonly maxAmount = 10000; // NZD
  private readonly minAmount = 0.01; // NZD
  private readonly supportedCurrencies = ['NZD', 'USD', 'AUD'];

  /**
   * Validate payment data for security and compliance
   */
  async validatePaymentData(
    paymentData: PaymentData
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Amount validation
    if (paymentData.amount < this.minAmount) {
      errors.push(`Amount must be at least ${this.minAmount}`);
    }
    if (paymentData.amount > this.maxAmount) {
      errors.push(`Amount cannot exceed ${this.maxAmount}`);
    }

    // Currency validation
    if (!this.supportedCurrencies.includes(paymentData.currency)) {
      errors.push(`Currency ${paymentData.currency} is not supported`);
    }

    // Card validation
    if (paymentData.cardNumber) {
      if (!this.validateCardNumber(paymentData.cardNumber)) {
        errors.push('Invalid card number format');
      }
      if (
        paymentData.expiryMonth &&
        (paymentData.expiryMonth < 1 || paymentData.expiryMonth > 12)
      ) {
        errors.push('Invalid expiry month');
      }
      if (
        paymentData.expiryYear &&
        paymentData.expiryYear < new Date().getFullYear()
      ) {
        errors.push('Card has expired');
      }
      if (paymentData.cvv && !this.validateCVV(paymentData.cvv)) {
        errors.push('Invalid CVV format');
      }
    }

    // Bank account validation
    if (
      paymentData.bankAccountNumber &&
      !this.validateBankAccount(paymentData.bankAccountNumber)
    ) {
      errors.push('Invalid bank account number format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Perform security checks on payment data
   */
  async performSecurityChecks(
    paymentData: PaymentData
  ): Promise<SecurityCheckResult> {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // High amount check
    if (paymentData.amount > 1000) {
      riskScore += 20;
      reasons.push('High amount transaction');
      recommendations.push('Consider additional verification');
    }

    // Card number validation
    if (paymentData.cardNumber) {
      if (this.isTestCard(paymentData.cardNumber)) {
        riskScore += 10;
        reasons.push('Test card detected');
      }
      if (this.isSuspiciousCard(paymentData.cardNumber)) {
        riskScore += 30;
        reasons.push('Suspicious card pattern detected');
        recommendations.push('Manual review recommended');
      }
    }

    // Bank account validation
    if (
      paymentData.bankAccountNumber &&
      this.isSuspiciousBankAccount(paymentData.bankAccountNumber)
    ) {
      riskScore += 25;
      reasons.push('Suspicious bank account pattern');
      recommendations.push('Additional verification required');
    }

    return {
      passed: riskScore < 50,
      riskScore,
      reasons,
      recommendations,
    };
  }

  /**
   * Validate card number using Luhn algorithm
   */
  private validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate CVV format
   */
  private validateCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }

  /**
   * Validate bank account number format
   */
  private validateBankAccount(accountNumber: string): boolean {
    const cleaned = accountNumber.replace(/\D/g, '');
    return cleaned.length >= 6 && cleaned.length <= 20;
  }

  /**
   * Check if card is a test card
   */
  private isTestCard(cardNumber: string): boolean {
    const testPatterns = [
      /^4\d{15}$/, // Visa test
      /^5[1-5]\d{14}$/, // Mastercard test
      /^3[47]\d{13}$/, // Amex test
    ];

    return testPatterns.some(pattern => pattern.test(cardNumber));
  }

  /**
   * Check for suspicious card patterns
   */
  private isSuspiciousCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');

    // Check for repeated digits
    if (/(\d)\1{3,}/.test(cleaned)) {
      return true;
    }

    // Check for sequential patterns
    if (this.isSequential(cleaned)) {
      return true;
    }

    return false;
  }

  /**
   * Check for suspicious bank account patterns
   */
  private isSuspiciousBankAccount(accountNumber: string): boolean {
    const cleaned = accountNumber.replace(/\D/g, '');

    // Check for repeated digits
    if (/(\d)\1{4,}/.test(cleaned)) {
      return true;
    }

    // Check for sequential patterns
    if (this.isSequential(cleaned)) {
      return true;
    }

    return false;
  }

  /**
   * Check if string contains sequential digits
   */
  private isSequential(str: string): boolean {
    for (let i = 0; i < str.length - 3; i++) {
      const sequence = str.slice(i, i + 4);
      if (this.isConsecutive(sequence)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if string contains consecutive digits
   */
  private isConsecutive(str: string): boolean {
    for (let i = 0; i < str.length - 1; i++) {
      if (parseInt(str[i + 1]) !== parseInt(str[i]) + 1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Encrypt sensitive payment data
   */
  async encryptPaymentData(paymentData: PaymentData): Promise<string> {
    // In a real implementation, this would use proper encryption
    const sensitiveData = {
      cardNumber: paymentData.cardNumber,
      cvv: paymentData.cvv,
      bankAccountNumber: paymentData.bankAccountNumber,
    };

    return Buffer.from(JSON.stringify(sensitiveData)).toString('base64');
  }

  /**
   * Decrypt sensitive payment data
   */
  async decryptPaymentData(
    encryptedData: string
  ): Promise<Partial<PaymentData>> {
    // In a real implementation, this would use proper decryption
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }

  /**
   * Encrypt sensitive payment data
   */
  async encryptSensitiveData(data: any): Promise<any> {
    // In a real implementation, this would use proper encryption
    const encrypted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        encrypted[key] = Buffer.from(String(value)).toString('base64');
      }
    }
    return encrypted;
  }

  /**
   * Decrypt sensitive payment data
   */
  async decryptSensitiveData(encryptedData: any): Promise<any> {
    // In a real implementation, this would use proper decryption
    const decrypted: any = {};
    for (const [key, value] of Object.entries(encryptedData)) {
      if (value) {
        decrypted[key] = Buffer.from(String(value), 'base64').toString('utf-8');
      }
    }
    return decrypted;
  }

  /**
   * Generate secure payment token
   */
  async generateSecureToken(): Promise<string> {
    // Generate a secure random token
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}
