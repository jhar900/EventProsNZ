/**
 * Bank Transfer Service
 * Handles bank transfer fallback payments
 */

import { createClient } from '@/lib/supabase/server';

export interface BankTransferCreateData {
  subscription_id: string;
  amount: number;
  reference: string;
  user_id: string;
}

export interface BankTransfer {
  id: string;
  subscription_id: string;
  amount: number;
  reference: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class BankTransferService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Create bank transfer request
   */
  async createBankTransfer(
    data: BankTransferCreateData
  ): Promise<BankTransfer> {
    try {
      const { data: bankTransfer, error } = await this.supabase
        .from('bank_transfers')
        .insert({
          subscription_id: data.subscription_id,
          amount: data.amount,
          reference: data.reference,
          status: 'pending',
          user_id: data.user_id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create bank transfer: ${error.message}`);
      }

      return bankTransfer;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create bank transfer');
    }
  }

  /**
   * Get bank transfer by ID
   */
  async getBankTransfer(bankTransferId: string): Promise<BankTransfer | null> {
    try {
      const { data: bankTransfer, error } = await this.supabase
        .from('bank_transfers')
        .select('*')
        .eq('id', bankTransferId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get bank transfer: ${error.message}`);
      }

      return bankTransfer;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get bank transfer');
    }
  }

  /**
   * Get bank transfer status
   */
  async getBankTransferStatus(
    bankTransferId: string
  ): Promise<{ status: string; payment?: any }> {
    try {
      const bankTransfer = await this.getBankTransfer(bankTransferId);

      if (!bankTransfer) {
        throw new Error('Bank transfer not found');
      }

      // Check if payment has been created for this bank transfer
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select('*')
        .eq('bank_transfer_id', bankTransferId)
        .single();

      if (paymentError && paymentError.code !== 'PGRST116') {
        throw new Error(`Failed to get payment: ${paymentError.message}`);
      }

      return {
        status: bankTransfer.status,
        payment: payment || null,
      };
    } catch (error) {
      throw new Error('Failed to get bank transfer status');
    }
  }

  /**
   * Update bank transfer status
   */
  async updateBankTransferStatus(
    bankTransferId: string,
    status: string,
    adminNotes?: string
  ): Promise<BankTransfer> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }

      const { data: bankTransfer, error } = await this.supabase
        .from('bank_transfers')
        .update(updateData)
        .eq('id', bankTransferId)
        .select()
        .single();

      if (error) {
        throw new Error(
          `Failed to update bank transfer status: ${error.message}`
        );
      }

      return bankTransfer;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update bank transfer status');
    }
  }

  /**
   * Process bank transfer payment
   */
  async processBankTransferPayment(bankTransferId: string): Promise<void> {
    try {
      const bankTransfer = await this.getBankTransfer(bankTransferId);

      if (!bankTransfer) {
        throw new Error('Bank transfer not found');
      }

      if (bankTransfer.status !== 'pending') {
        throw new Error('Bank transfer is not in pending status');
      }

      // Create payment record
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .insert({
          subscription_id: bankTransfer.subscription_id,
          amount: bankTransfer.amount,
          currency: 'NZD',
          status: 'succeeded',
          payment_method: 'bank_transfer',
          bank_transfer_id: bankTransferId,
        })
        .select()
        .single();

      if (paymentError) {
        throw new Error(`Failed to create payment: ${paymentError.message}`);
      }

      // Update bank transfer status
      await this.updateBankTransferStatus(bankTransferId, 'completed');

      // Update subscription status
      await this.supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankTransfer.subscription_id);

      // Log successful bank transfer
      await this.supabase.from('payment_analytics').insert({
        event_type: 'bank_transfer_completed',
        event_data: {
          bank_transfer_id: bankTransferId,
          payment_id: payment.id,
          amount: bankTransfer.amount,
          reference: bankTransfer.reference,
        },
        user_id: bankTransfer.user_id,
      });
    } catch (error) {
      throw new Error('Failed to process bank transfer payment');
    }
  }

  /**
   * Get user bank transfers
   */
  async getUserBankTransfers(userId: string): Promise<BankTransfer[]> {
    try {
      const { data: bankTransfers, error } = await this.supabase
        .from('bank_transfers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user bank transfers: ${error.message}`);
      }

      return bankTransfers || [];
    } catch (error) {
      throw new Error('Failed to get user bank transfers');
    }
  }

  /**
   * Get bank transfer instructions
   */
  async getBankTransferInstructions(): Promise<any> {
    try {
      // In a real implementation, this would return actual bank transfer instructions
      return {
        bank_name: 'EventProsNZ Bank',
        account_number: '12-3456-7890123-00',
        account_name: 'EventProsNZ Limited',
        reference_format: 'EventProsNZ-{reference}',
        instructions: [
          'Use the reference number provided when making your payment',
          'Payment must be made in NZD',
          'Allow 1-2 business days for processing',
          'Contact support if you have any questions',
        ],
      };
    } catch (error) {
      throw new Error('Failed to get bank transfer instructions');
    }
  }

  /**
   * Get bank transfer analytics
   */
  async getBankTransferAnalytics(userId?: string): Promise<any> {
    try {
      let query = this.supabase.from('bank_transfers').select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: bankTransfers, error } = await query;

      if (error) {
        throw new Error(
          `Failed to get bank transfer analytics: ${error.message}`
        );
      }

      // Calculate analytics
      const totalTransfers = bankTransfers?.length || 0;
      const pendingTransfers =
        bankTransfers?.filter(bt => bt.status === 'pending').length || 0;
      const completedTransfers =
        bankTransfers?.filter(bt => bt.status === 'completed').length || 0;
      const totalAmount =
        bankTransfers?.reduce((sum, bt) => sum + bt.amount, 0) || 0;

      return {
        total_transfers: totalTransfers,
        pending_transfers: pendingTransfers,
        completed_transfers: completedTransfers,
        total_amount: totalAmount,
        bank_transfers: bankTransfers || [],
      };
    } catch (error) {
      throw new Error('Failed to get bank transfer analytics');
    }
  }

  /**
   * Validate bank transfer ownership
   */
  async validateBankTransferOwnership(
    bankTransferId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data: bankTransfer, error } = await this.supabase
        .from('bank_transfers')
        .select('user_id')
        .eq('id', bankTransferId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to validate ownership: ${error.message}`);
      }

      return bankTransfer?.user_id === userId;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to validate bank transfer ownership');
    }
  }

  /**
   * Delete bank transfer
   */
  async deleteBankTransfer(bankTransferId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('bank_transfers')
        .delete()
        .eq('id', bankTransferId);

      if (error) {
        throw new Error(`Failed to delete bank transfer: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete bank transfer');
    }
  }

  /**
   * Get bank transfer statistics
   */
  async getBankTransferStatistics(userId: string): Promise<any> {
    try {
      const { data: stats, error } = await this.supabase
        .from('bank_transfers')
        .select('status, amount, created_at')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to get statistics: ${error.message}`);
      }

      const total = stats?.length || 0;
      const pending = stats?.filter(s => s.status === 'pending').length || 0;
      const completed =
        stats?.filter(s => s.status === 'completed').length || 0;
      const totalAmount = stats?.reduce((sum, s) => sum + s.amount, 0) || 0;

      return {
        total_transfers: total,
        pending_transfers: pending,
        completed_transfers: completed,
        total_amount: totalAmount,
        average_amount: total > 0 ? totalAmount / total : 0,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to retrieve bank transfer statistics');
    }
  }

  /**
   * Generate unique reference
   */
  async generateReference(subscriptionId: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `EventProsNZ-${timestamp}`;
    } catch (error) {
      throw new Error('Failed to generate reference');
    }
  }

  /**
   * Get bank transfers by user
   */
  async getBankTransfersByUser(userId: string): Promise<BankTransfer[]> {
    try {
      const { data: bankTransfers, error } = await this.supabase
        .from('bank_transfers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve bank transfers: ${error.message}`);
      }

      return bankTransfers || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to retrieve bank transfers');
    }
  }

  /**
   * Get pending bank transfers
   */
  async getPendingBankTransfers(): Promise<BankTransfer[]> {
    try {
      const { data: bankTransfers, error } = await this.supabase
        .from('bank_transfers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to retrieve pending bank transfers: ${error.message}`
        );
      }

      return bankTransfers || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to retrieve pending bank transfers');
    }
  }

  /**
   * Get bank transfer instructions with validation
   */
  async getBankTransferInstructions(bankTransferId?: string): Promise<any> {
    try {
      if (bankTransferId) {
        // Validate bank transfer exists
        const { data: bankTransfer, error } = await this.supabase
          .from('bank_transfers')
          .select('*')
          .eq('id', bankTransferId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw new Error(`Failed to get bank transfer: ${error.message}`);
        }

        if (!bankTransfer) {
          throw new Error('Bank transfer not found');
        }
      }

      // Return bank transfer instructions
      return {
        bank_name: 'EventProsNZ Bank',
        account_number: '12-3456-7890123-00',
        account_name: 'EventProsNZ Limited',
        reference_format: 'EventProsNZ-{reference}',
        instructions: [
          'Use the reference number provided when making your payment',
          'Payment must be made in NZD',
          'Allow 1-2 business days for processing',
          'Contact support if you have any questions',
        ],
      };
    } catch (error) {
      throw new Error('Failed to get bank transfer instructions');
    }
  }
}
