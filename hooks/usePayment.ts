/**
 * Payment Hook
 * Custom hook for payment operations
 */

import { useState, useCallback } from 'react';

interface PaymentIntentData {
  subscription_id: string;
  amount: number;
  currency?: string;
}

interface PaymentConfirmationData {
  payment_intent_id: string;
  payment_method_id?: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last_four: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
}

interface Payment {
  id: string;
  subscription_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  failure_reason?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

interface ReceiptInfo {
  id: string;
  payment_id: string;
  receipt_url: string;
  receipt_number: string;
  amount: number;
  currency: string;
  payment_method: string;
  created_at: string;
}

interface FailedPayment {
  id: string;
  payment_id: string;
  failure_count: number;
  grace_period_end: string;
  notification_sent_days: number[];
  retry_attempts: number;
  created_at: string;
  updated_at: string;
  payments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    failure_reason?: string;
    subscriptions: {
      user_id: string;
      tier: string;
    };
  };
}

interface PaymentNotification {
  id: string;
  payment_id: string;
  notification_type: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

interface BankTransferInstructions {
  bank_name: string;
  account_number: string;
  account_name: string;
  reference_format: string;
  instructions: string[];
}

interface BankTransfer {
  id: string;
  subscription_id: string;
  amount: number;
  reference: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create payment intent
  const createPaymentIntent = useCallback(async (data: PaymentIntentData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/payments/stripe/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment intent');
      }

      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Confirm payment
  const confirmPayment = useCallback(async (data: PaymentConfirmationData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/payments/stripe/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment confirmation failed');
      }

      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get payment methods
  const getPaymentMethods = useCallback(
    async (userId?: string): Promise<PaymentMethod[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const url = userId
          ? `/api/payments/methods?user_id=${userId}`
          : '/api/payments/methods';

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to get payment methods');
        }

        return result.payment_methods;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Create payment method
  const createPaymentMethod = useCallback(
    async (data: {
      stripe_payment_method_id: string;
      type: string;
      is_default?: boolean;
    }) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/payments/methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create payment method');
        }

        return result.payment_method;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Delete payment method
  const deletePaymentMethod = useCallback(async (paymentMethodId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/payments/methods/${paymentMethodId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete payment method');
      }

      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set default payment method
  const setDefaultPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/payments/methods/${paymentMethodId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_default: true }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || 'Failed to set default payment method'
          );
        }

        return result.payment_method;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get payment confirmation
  const getPaymentConfirmation = useCallback(
    async (paymentIntentId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/payments/confirm/${paymentIntentId}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to get payment confirmation');
        }

        return result;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Send receipt
  const sendReceipt = useCallback(async (paymentId: string, email?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/payments/confirm/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_id: paymentId, email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send receipt');
      }

      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get failed payments
  const getFailedPayments = useCallback(
    async (userId?: string): Promise<FailedPayment[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const url = userId
          ? `/api/payments/failed?user_id=${userId}`
          : '/api/payments/failed';

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to get failed payments');
        }

        return result.failed_payments;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Retry failed payment
  const retryFailedPayment = useCallback(
    async (paymentId: string, paymentMethodId?: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/payments/failed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_id: paymentId,
            payment_method_id: paymentMethodId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to retry payment');
        }

        return result;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get bank transfer instructions
  const getBankTransferInstructions =
    useCallback(async (): Promise<BankTransferInstructions> => {
      try {
        setIsLoading(true);
        setError(null);

        // This would typically call an API endpoint
        // For now, return mock data
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
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }, []);

  // Create bank transfer
  const createBankTransfer = useCallback(
    async (data: {
      subscription_id: string;
      amount: number;
      reference: string;
    }): Promise<BankTransfer> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/payments/bank-transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create bank transfer');
        }

        return result.bank_transfer;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get notification history
  const getNotificationHistory = useCallback(
    async (
      userId?: string,
      paymentId?: string
    ): Promise<PaymentNotification[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (userId) params.append('user_id', userId);
        if (paymentId) params.append('payment_id', paymentId);

        const response = await fetch(
          `/api/payments/notifications/history?${params}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to get notification history');
        }

        return result.notifications;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Send payment notification
  const sendPaymentNotification = useCallback(
    async (
      paymentId: string,
      notificationType: string
    ): Promise<PaymentNotification> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/payments/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_id: paymentId,
            notification_type: notificationType,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to send notification');
        }

        return result.notification;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get user receipts
  const getUserReceipts = useCallback(
    async (userId?: string): Promise<ReceiptInfo[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const url = userId
          ? `/api/payments/receipts?user_id=${userId}`
          : '/api/payments/receipts';

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to get receipts');
        }

        return result.receipts;
      } catch (error: any) {
        setError(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    createPaymentIntent,
    confirmPayment,
    getPaymentMethods,
    createPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getPaymentConfirmation,
    sendReceipt,
    getFailedPayments,
    retryFailedPayment,
    getBankTransferInstructions,
    createBankTransfer,
    getNotificationHistory,
    sendPaymentNotification,
    getUserReceipts,
  };
}
