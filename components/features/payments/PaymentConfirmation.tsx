/**
 * Payment Confirmation Component
 * Displays payment confirmation and success information
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Download,
  Mail,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

interface PaymentConfirmationProps {
  paymentId?: string;
  paymentIntentId?: string;
  payment?: Payment;
  receipt?: ReceiptInfo;
  onDownloadReceipt?: (receiptUrl: string) => void;
  onSendReceipt?: (email: string) => void;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  receipt_url?: string;
  created_at: string;
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

export function PaymentConfirmation({
  paymentId,
  paymentIntentId,
  payment: propPayment,
  receipt: propReceipt,
  onDownloadReceipt,
  onSendReceipt,
}: PaymentConfirmationProps) {
  const [payment, setPayment] = useState<Payment | null>(propPayment || null);
  const [receipt, setReceipt] = useState<ReceiptInfo | null>(
    propReceipt || null
  );
  const [isLoading, setIsLoading] = useState(!propPayment && !propReceipt);
  const [error, setError] = useState<string | null>(null);
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    getPaymentConfirmation,
    sendReceipt,
    sendReceiptEmail,
    downloadReceipt,
  } = usePayment();

  useEffect(() => {
    if ((paymentId || paymentIntentId) && !propPayment) {
      loadPaymentConfirmation();
    }
  }, [paymentId, paymentIntentId, propPayment]);

  const loadPaymentConfirmation = async () => {
    try {
      setIsLoading(true);
      const confirmation = await getPaymentConfirmation(
        paymentId || paymentIntentId!
      );
      setPayment(confirmation.payment);
      setReceipt(confirmation.receipt);
    } catch (error: any) {
      setError(error.message || 'Failed to load payment confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (receipt?.receipt_url) {
      try {
        const result = await downloadReceipt(receipt.id);
        onDownloadReceipt?.(result.receipt_url);
        window.open(result.receipt_url, '_blank');
      } catch (error: any) {
        setError(error.message || 'Failed to download receipt');
      }
    }
  };

  const handleSendReceipt = async () => {
    if (!payment?.id) return;

    if (!showEmailForm) {
      setShowEmailForm(true);
      return;
    }

    try {
      setIsSendingReceipt(true);
      setEmailError(null);

      // Validate email if provided
      if (email && !isValidEmail(email)) {
        setEmailError('Invalid email address');
        return;
      }

      const result = await sendReceiptEmail(payment.id, email || undefined);
      setSuccessMessage('Receipt sent successfully');
      onSendReceipt?.(email || 'user email');
      setShowEmailForm(false);
      setEmail('');
    } catch (error: any) {
      setError(error.message || 'Failed to send receipt');
    } finally {
      setIsSendingReceipt(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading payment confirmation...</span>
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

  if (!payment) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Payment information not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className="space-y-6 mobile-optimized"
      data-testid="payment-confirmation-container"
    >
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600">
          Your payment has been processed successfully.
        </p>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Amount
              </label>
              <p className="text-2xl font-bold">
                ${payment.amount.toFixed(2)} {payment.currency}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>
              <div className="mt-1">{getStatusBadge(payment.status)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Payment Method
              </label>
              <p className="text-lg font-medium capitalize">
                {payment.payment_method.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Date</label>
              <p className="text-lg font-medium">
                {formatDate(payment.created_at)}
              </p>
            </div>
          </div>

          {receipt && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Receipt Number
              </label>
              <p className="text-lg font-medium font-mono">
                {receipt.receipt_number}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Actions */}
      {receipt ? (
        <Card>
          <CardHeader>
            <CardTitle>Receipt Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your receipt has been generated and is ready for download.
            </p>

            {successMessage && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {emailError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{emailError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleDownloadReceipt}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </Button>

              <Button
                variant="outline"
                onClick={handleSendReceipt}
                disabled={isSendingReceipt}
                className="flex items-center gap-2"
              >
                {isSendingReceipt ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send to Email
              </Button>
            </div>

            {showEmailForm && (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter email address (optional)"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty to send to your account email
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendReceipt}
                    disabled={isSendingReceipt}
                    className="flex items-center gap-2"
                  >
                    {isSendingReceipt ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending Receipt...
                      </>
                    ) : (
                      'Send'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmail('');
                      setEmailError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Receipt Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Receipt not available</p>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Access Your Subscription</p>
                <p className="text-sm text-gray-600">
                  Your subscription is now active and you can access all premium
                  features.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">Explore Features</p>
                <p className="text-sm text-gray-600">
                  Check out your dashboard to see all the new features available
                  to you.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium">Manage Your Account</p>
                <p className="text-sm text-gray-600">
                  You can update your payment methods and subscription settings
                  anytime.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button asChild className="flex-1">
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <a href="/subscriptions">Manage Subscription</a>
        </Button>
      </div>
    </div>
  );
}
