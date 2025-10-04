/**
 * Payment Receipts Page
 * Displays and manages payment receipts
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Mail, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { PaymentReceipts } from '@/components/features/payments/PaymentReceipts';

export default function PaymentReceiptsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadReceipt = (receiptUrl: string) => {
    console.log('Downloading receipt:', receiptUrl);
    // Handle receipt download
    window.open(receiptUrl, '_blank');
  };

  const handleSendReceipt = (receiptId: string, email: string) => {
    console.log('Sending receipt:', receiptId, 'to:', email);
    // Handle receipt sending
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Receipts
          </h1>
          <p className="text-gray-600">
            View and download your payment receipts and invoices.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <PaymentReceipts
          onDownloadReceipt={handleDownloadReceipt}
          onSendReceipt={handleSendReceipt}
        />

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Receipt Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Downloading Receipts</h3>
              <p className="text-sm text-gray-600">
                Click the &quot;Download&quot; button next to any receipt to download a
                PDF copy to your device. Receipts are available for all
                successful payments.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Email Receipts</h3>
              <p className="text-sm text-gray-600">
                Use the &quot;Send&quot; button to email a receipt to any email address.
                This is useful for business expense tracking or sharing with
                your accountant.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Receipt Numbers</h3>
              <p className="text-sm text-gray-600">
                Each receipt has a unique receipt number that you can use for
                reference when contacting support or for accounting purposes.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Tax Information</h3>
              <p className="text-sm text-gray-600">
                All receipts include the necessary information for tax purposes,
                including GST details where applicable.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
