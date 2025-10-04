/**
 * Payment Confirmation Page
 * Displays payment confirmation and success information
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Download,
  Mail,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PaymentConfirmation } from '@/components/features/payments/PaymentConfirmation';

export default function PaymentConfirmPage() {
  const searchParams = useSearchParams();
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const intentId = searchParams.get('payment_intent_id');
    if (!intentId) {
      setError('No payment intent ID provided');
      setIsLoading(false);
      return;
    }

    setPaymentIntentId(intentId);
    setIsLoading(false);
  }, [searchParams]);

  const handleDownloadReceipt = (receiptUrl: string) => {
    console.log('Downloading receipt:', receiptUrl);
    // Handle receipt download
  };

  const handleSendReceipt = (email: string) => {
    console.log('Sending receipt to:', email);
    // Handle receipt sending
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payment confirmation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!paymentIntentId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Payment intent ID not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <PaymentConfirmation
          paymentIntentId={paymentIntentId}
          onDownloadReceipt={handleDownloadReceipt}
          onSendReceipt={handleSendReceipt}
        />
      </div>
    </div>
  );
}
