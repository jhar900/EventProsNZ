/**
 * Failed Payments Page
 * Manages failed payment handling and retry functionality
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { FailedPaymentHandler } from '@/components/features/payments/FailedPaymentHandler';

export default function FailedPaymentsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetrySuccess = (payment: any) => {
    console.log('Payment retry successful:', payment);
    // Handle successful retry
  };

  const handleRetryError = (error: string) => {
    console.log('Payment retry failed:', error);
    setError(error);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Failed Payments
              </h1>
              <p className="text-gray-600">
                Manage and retry failed payment attempts.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FailedPaymentHandler
          onRetrySuccess={handleRetrySuccess}
          onRetryError={handleRetryError}
        />

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Failed Payment Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Why Payments Fail</h3>
              <p className="text-sm text-gray-600">
                Payments can fail for various reasons including insufficient
                funds, expired cards, or bank restrictions. Check the failure
                reason for each payment to understand what went wrong.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Grace Period</h3>
              <p className="text-sm text-gray-600">
                You have a 7-day grace period to resolve failed payments. During
                this time, you&apos;ll receive email notifications on days 3, 6, and
                7 to remind you to update your payment method.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Retry Payments</h3>
              <p className="text-sm text-gray-600">
                You can retry failed payments up to 3 times. Make sure to update
                your payment method if needed before retrying. Contact support
                if you continue to experience issues.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Update Payment Method</h3>
              <p className="text-sm text-gray-600">
                If your payment method has changed, update it in your account
                settings before retrying the payment. This will help prevent
                future payment failures.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
