/**
 * Failed Payment Handler Component
 * Handles failed payment management and retry functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  Mail,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

interface FailedPayment {
  id: string;
  payment_id: string;
  failure_count: number;
  grace_period_end: string;
  notification_sent_days?: number[];
  retry_attempts?: number;
  created_at: string;
  updated_at?: string;
  status?: string;
  failure_reason?: string;
  amount?: number;
  currency?: string;
  // Nested structure (if available)
  payments?: {
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

interface FailedPaymentHandlerProps {
  userId?: string;
  onRetrySuccess?: (payment: any) => void;
  onRetryError?: (error: string) => void;
}

export function FailedPaymentHandler({
  userId,
  onRetrySuccess,
  onRetryError,
}: FailedPaymentHandlerProps) {
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { getFailedPayments, retryFailedPayment } = usePayment();

  useEffect(() => {
    loadFailedPayments();
  }, [userId]);

  const loadFailedPayments = async () => {
    try {
      setIsLoading(true);
      const failed = await getFailedPayments(userId);
      setFailedPayments(failed);
    } catch (error: any) {
      setError(error.message || 'Failed to load failed payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryPayment = async (failedPayment: FailedPayment) => {
    if (!confirm('Are you sure you want to retry this payment?')) {
      return;
    }

    try {
      setRetryingId(failedPayment.payment_id);
      const result = await retryFailedPayment(failedPayment.payment_id);

      if (result.success) {
        // Remove from failed payments list
        setFailedPayments(prev =>
          prev.filter(fp => fp.payment_id !== failedPayment.payment_id)
        );
        onRetrySuccess?.(result.payment);
      } else {
        throw new Error(result.error || 'Payment retry failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to retry payment';
      setError(errorMessage);
      onRetryError?.(errorMessage);
    } finally {
      setRetryingId(null);
    }
  };

  const getGracePeriodStatus = (gracePeriodEnd: string) => {
    const endDate = new Date(gracePeriodEnd);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining <= 0) {
      return { status: 'expired', days: 0, color: 'red' };
    } else if (daysRemaining <= 2) {
      return { status: 'urgent', days: daysRemaining, color: 'orange' };
    } else {
      return { status: 'active', days: daysRemaining, color: 'green' };
    }
  };

  const getNotificationStatus = (sentDays: number[] | undefined | null) => {
    const now = new Date();
    const createdDate = new Date();
    const daysSinceFailure = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Handle undefined or null sentDays
    if (!sentDays || !Array.isArray(sentDays)) {
      return { status: 'none', color: 'gray' };
    }

    if (sentDays.includes(3) && sentDays.includes(6) && sentDays.includes(7)) {
      return { status: 'complete', color: 'green' };
    } else if (sentDays.length > 0) {
      return { status: 'partial', color: 'orange' };
    } else {
      return { status: 'none', color: 'gray' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return `$${amount.toFixed(2)} ${currency.toUpperCase()}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading failed payments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className="space-y-6 mobile-optimized"
      data-testid="failed-payment-handler-container"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Failed Payments</h2>
        <Button onClick={loadFailedPayments} variant="outline">
          Refresh
        </Button>
      </div>

      {failedPayments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Failed Payments
            </h3>
            <p className="text-gray-600">All your payments are up to date.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {failedPayments.map(failedPayment => {
            const graceStatus = getGracePeriodStatus(
              failedPayment.grace_period_end
            );
            const notificationStatus = getNotificationStatus(
              failedPayment.notification_sent_days
            );

            return (
              <Card
                key={failedPayment.id}
                className="border-l-4 border-l-red-500"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">
                            Payment #{failedPayment.payment_id.slice(-8)}
                          </span>
                          <Badge
                            variant={
                              graceStatus.color === 'red'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {graceStatus.status === 'expired'
                              ? 'Expired'
                              : graceStatus.status === 'urgent'
                                ? 'Urgent'
                                : 'Active'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Amount</p>
                            <p className="text-lg font-semibold">
                              {formatAmount(
                                failedPayment.payments?.amount ||
                                  failedPayment.amount ||
                                  0,
                                failedPayment.payments?.currency ||
                                  failedPayment.currency ||
                                  'NZD'
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Failure Count
                            </p>
                            <p className="text-lg font-semibold">
                              {failedPayment.failure_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Retry Attempts
                            </p>
                            <p className="text-lg font-semibold">
                              {failedPayment.retry_attempts || 0}/3
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Grace Period
                            </p>
                            <p className="text-lg font-semibold">
                              {graceStatus.days} days left
                            </p>
                          </div>
                        </div>

                        {(failedPayment.payments?.failure_reason ||
                          failedPayment.failure_reason) && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              Failure Reason
                            </p>
                            <p className="text-sm text-red-600">
                              {failedPayment.payments?.failure_reason ||
                                failedPayment.failure_reason}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              Failed: {formatDate(failedPayment.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>
                              Notifications:{' '}
                              {notificationStatus.status === 'complete'
                                ? 'notifications sent'
                                : notificationStatus.status}
                              {failedPayment.notification_sent_days &&
                                failedPayment.notification_sent_days.length >
                                  0 && (
                                  <span className="ml-1">
                                    (day{' '}
                                    {failedPayment.notification_sent_days.join(
                                      ', day '
                                    )}
                                    )
                                  </span>
                                )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {graceStatus.status !== 'expired' &&
                        (failedPayment.retry_attempts || 0) < 3 && (
                          <Button
                            onClick={() => handleRetryPayment(failedPayment)}
                            disabled={retryingId === failedPayment.payment_id}
                            className="flex items-center gap-2"
                          >
                            {retryingId === failedPayment.payment_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            Retry Payment
                          </Button>
                        )}

                      {graceStatus.status === 'expired' && (
                        <div className="space-y-2">
                          <Badge variant="destructive">
                            Grace Period Expired
                          </Badge>
                          <p className="text-sm text-red-600">
                            Grace period has expired
                          </p>
                        </div>
                      )}

                      {(failedPayment.retry_attempts || 0) >= 3 && (
                        <Badge variant="secondary">Max Retries Reached</Badge>
                      )}

                      {(failedPayment.retry_attempts || 0) < 3 &&
                        graceStatus.status !== 'expired' && (
                          <p className="text-sm text-gray-600">
                            {3 - (failedPayment.retry_attempts || 0)} retry
                            attempt
                            {3 - (failedPayment.retry_attempts || 0) === 1
                              ? ''
                              : 's'}{' '}
                            remaining
                          </p>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {failedPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {failedPayments.length}
                </p>
                <p className="text-sm text-gray-600">Total Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {
                    failedPayments.filter(
                      fp =>
                        getGracePeriodStatus(fp.grace_period_end).status ===
                        'urgent'
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-600">Urgent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">
                  {
                    failedPayments.filter(
                      fp =>
                        getGracePeriodStatus(fp.grace_period_end).status ===
                        'expired'
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-600">Expired</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {failedPayments.reduce(
                    (sum, fp) => sum + (fp.retry_attempts || 0),
                    0
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Retries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
