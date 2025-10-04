/**
 * Receipt Service
 * Handles payment receipt generation and management
 */

import { createClient } from '@/lib/supabase/server';

export interface ReceiptInfo {
  id: string;
  payment_id: string;
  receipt_url: string;
  receipt_number: string;
  amount: number;
  currency: string;
  payment_method: string;
  created_at: string;
}

export interface ReceiptCreateData {
  payment_id: string;
  receipt_url: string;
  receipt_number: string;
}

export class ReceiptService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Get receipt information
   */
  async getReceiptInfo(paymentId: string): Promise<ReceiptInfo | null> {
    try {
      const { data: receipt, error } = await this.supabase
        .from('receipts')
        .select(
          `
          *,
          payments!inner(
            amount,
            currency,
            payment_method
          )
        `
        )
        .eq('payment_id', paymentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get receipt: ${error.message}`);
      }

      if (!receipt) {
        return null;
      }

      return {
        id: receipt.id,
        payment_id: receipt.payment_id,
        receipt_url: receipt.receipt_url,
        receipt_number: receipt.receipt_number,
        amount: receipt.payments?.amount || receipt.amount || 0,
        currency: receipt.payments?.currency || receipt.currency || 'NZD',
        payment_method:
          receipt.payments?.payment_method || receipt.payment_method || 'card',
        created_at: receipt.created_at,
      };
    } catch (error) {
      throw new Error('Failed to get receipt information');
    }
  }

  /**
   * Create receipt
   */
  async createReceipt(data: ReceiptCreateData): Promise<ReceiptInfo> {
    try {
      const { data: receipt, error } = await this.supabase
        .from('receipts')
        .insert({
          payment_id: data.payment_id,
          receipt_url: data.receipt_url,
          receipt_number: data.receipt_number,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create receipt: ${error.message}`);
      }

      return receipt;
    } catch (error) {
      throw new Error('Failed to create receipt');
    }
  }

  /**
   * Send receipt via email
   */
  async sendReceipt(paymentId: string, email: string): Promise<string> {
    try {
      // Get payment information
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select(
          `
          *,
          subscriptions!inner(
            user_id,
            tier,
            billing_cycle
          )
        `
        )
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      // Generate receipt number if not exists
      let receiptNumber = await this.generateReceiptNumber();

      // Check if receipt already exists
      const { data: existingReceipt } = await this.supabase
        .from('receipts')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      let receiptUrl: string;

      if (existingReceipt) {
        receiptUrl = existingReceipt.receipt_url;
      } else {
        // Create receipt
        receiptUrl = await this.generateReceiptUrl(payment);

        await this.createReceipt({
          payment_id: paymentId,
          receipt_url: receiptUrl,
          receipt_number: receiptNumber,
        });
      }

      // Send email with receipt
      await this.sendReceiptEmail(email, payment, receiptUrl, receiptNumber);

      return receiptUrl;
    } catch (error) {
      throw new Error('Failed to send receipt');
    }
  }

  /**
   * Generate receipt number
   */
  private async generateReceiptNumber(): Promise<string> {
    try {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `RCP-${timestamp.slice(-6)}-${random}`;
    } catch (error) {
      throw new Error('Failed to generate receipt number');
    }
  }

  /**
   * Generate receipt URL
   */
  private async generateReceiptUrl(payment: any): Promise<string> {
    try {
      // In a real implementation, this would generate a PDF receipt
      // For now, we'll return a placeholder URL
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://eventprosnz.com';
      return `${baseUrl}/receipts/${payment.id}`;
    } catch (error) {
      throw new Error('Failed to generate receipt URL');
    }
  }

  /**
   * Send receipt email
   */
  private async sendReceiptEmail(
    email: string,
    payment: any,
    receiptUrl: string,
    receiptNumber: string
  ): Promise<void> {
    try {
      // In a real implementation, this would use SendGrid or similar
      // For now, we'll just log the receipt information
      console.log('Receipt email would be sent to:', email);
      console.log('Receipt URL:', receiptUrl);
      console.log('Receipt Number:', receiptNumber);
      console.log('Payment Amount:', payment.amount);
      console.log('Payment Currency:', payment.currency);
    } catch (error) {
      throw new Error('Failed to send receipt email');
    }
  }

  /**
   * Get user receipts
   */
  async getUserReceipts(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<ReceiptInfo[]> {
    try {
      const { data: receipts, error } = await this.supabase
        .from('receipts')
        .select(
          `
          *,
          payments!inner(
            amount,
            currency,
            payment_method,
            subscriptions!inner(user_id)
          )
        `
        )
        .eq('payments.subscriptions.user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get user receipts: ${error.message}`);
      }

      return receipts || [];
    } catch (error) {
      throw new Error('Failed to get user receipts');
    }
  }

  /**
   * Get receipt analytics
   */
  async getReceiptAnalytics(userId?: string): Promise<any> {
    try {
      let query = this.supabase.from('receipts').select(`
          *,
          payments!inner(
            amount,
            currency,
            subscriptions!inner(user_id)
          )
        `);

      if (userId) {
        query = query.eq('payments.subscriptions.user_id', userId);
      }

      const { data: receipts, error } = await query;

      if (error) {
        throw new Error(`Failed to get receipt analytics: ${error.message}`);
      }

      // Calculate analytics
      const totalReceipts = receipts?.length || 0;
      const totalAmount =
        receipts?.reduce((sum, receipt) => sum + receipt.payments.amount, 0) ||
        0;

      return {
        total_receipts: totalReceipts,
        total_amount: totalAmount,
        receipts: receipts || [],
      };
    } catch (error) {
      throw new Error('Failed to get receipt analytics');
    }
  }

  /**
   * Get receipts by user
   */
  async getReceiptsByUser(userId: string): Promise<ReceiptInfo[]> {
    try {
      const { data: receipts, error } = await this.supabase
        .from('receipts')
        .select(
          `
          *,
          payments!inner(
            amount,
            currency,
            payment_method,
            subscriptions!inner(user_id)
          )
        `
        )
        .eq('payments.subscriptions.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve receipts: ${error.message}`);
      }

      return receipts || [];
    } catch (error) {
      throw new Error('Failed to retrieve user receipts');
    }
  }

  /**
   * Download receipt
   */
  async downloadReceipt(receiptId: string): Promise<ReceiptInfo> {
    try {
      const { data: receipt, error } = await this.supabase
        .from('receipts')
        .select(
          `
          *,
          payments!inner(
            amount,
            currency,
            payment_method
          )
        `
        )
        .eq('id', receiptId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to retrieve receipt: ${error.message}`);
      }

      if (!receipt) {
        throw new Error('Receipt not found');
      }

      return {
        id: receipt.id,
        payment_id: receipt.payment_id,
        receipt_url: receipt.receipt_url,
        receipt_number: receipt.receipt_number,
        amount: receipt.payments?.amount || receipt.amount || 0,
        currency: receipt.payments?.currency || receipt.currency || 'NZD',
        payment_method:
          receipt.payments?.payment_method || receipt.payment_method || 'card',
        created_at: receipt.created_at,
      };
    } catch (error) {
      throw new Error('Failed to download receipt');
    }
  }

  /**
   * Update receipt status
   */
  async updateReceiptStatus(
    receiptId: string,
    status: string,
    metadata?: any
  ): Promise<ReceiptInfo> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (metadata) {
        updateData.metadata = metadata;
      }

      const { data: receipt, error } = await this.supabase
        .from('receipts')
        .update(updateData)
        .eq('id', receiptId)
        .select(
          `
          *,
          payments!inner(
            amount,
            currency,
            payment_method
          )
        `
        )
        .single();

      if (error) {
        throw new Error(`Failed to update receipt status: ${error.message}`);
      }

      return {
        id: receipt.id,
        payment_id: receipt.payment_id,
        receipt_url: receipt.receipt_url,
        receipt_number: receipt.receipt_number,
        amount: receipt.payments?.amount || receipt.amount || 0,
        currency: receipt.payments?.currency || receipt.currency || 'NZD',
        payment_method:
          receipt.payments?.payment_method || receipt.payment_method || 'card',
        created_at: receipt.created_at,
      };
    } catch (error) {
      throw new Error('Failed to update receipt status');
    }
  }

  /**
   * Delete receipt
   */
  async deleteReceipt(receiptId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('receipts')
        .delete()
        .eq('id', receiptId);

      if (error) {
        throw new Error(`Failed to delete receipt: ${error.message}`);
      }
    } catch (error) {
      throw new Error('Failed to delete receipt');
    }
  }

  /**
   * Send receipt email (public method for testing)
   */
  async sendReceiptEmail(paymentId: string, email?: string): Promise<void> {
    try {
      const emailAddress = email || 'user@example.com';
      await this.sendReceipt(paymentId, emailAddress);
    } catch (error) {
      throw new Error('Failed to send receipt email');
    }
  }
}
