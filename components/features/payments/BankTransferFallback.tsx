/**
 * Bank Transfer Fallback Component
 * Handles bank transfer payments as fallback option
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

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

interface BankTransferInstructions {
  bank_name: string;
  account_number: string;
  account_name: string;
  reference_format: string;
  instructions: string[];
}

interface BankTransferFallbackProps {
  subscriptionId: string;
  amount: number;
  currency?: string;
  onTransferCreated?: (transfer: BankTransfer) => void;
  onTransferError?: (error: string) => void;
}

export function BankTransferFallback({
  subscriptionId,
  amount,
  currency = 'NZD',
  onTransferCreated,
  onTransferError,
}: BankTransferFallbackProps) {
  const [instructions, setInstructions] =
    useState<BankTransferInstructions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { getBankTransferInstructions, createBankTransfer } = usePayment();

  useEffect(() => {
    loadInstructions();
  }, []);

  const loadInstructions = async () => {
    try {
      setIsLoading(true);
      const inst = await getBankTransferInstructions();
      setInstructions(inst);
      setReference(`EventProsNZ-${subscriptionId.slice(-8)}`);
    } catch (error: any) {
      setError(error.message || 'Failed to load bank transfer instructions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    if (!reference.trim()) {
      setError('Please enter a reference number');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const transfer = await createBankTransfer({
        subscription_id: subscriptionId,
        amount,
        reference: reference.trim(),
      });

      onTransferCreated?.(transfer);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create bank transfer';
      setError(errorMessage);
      onTransferError?.(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} $${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading bank transfer instructions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !instructions) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bank Transfer Payment
        </h1>
        <p className="text-gray-600">
          Complete your payment via bank transfer using the details below.
        </p>
      </div>

      {/* Payment Amount */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Amount to Transfer</span>
              <span className="text-2xl font-bold">
                {formatAmount(amount, currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Transfer Instructions */}
      {instructions && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Transfer Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={instructions.bank_name}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(instructions.bank_name, 'bank_name')
                    }
                  >
                    {copiedField === 'bank_name' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Number</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={instructions.account_number}
                    readOnly
                    className="bg-gray-50 font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        instructions.account_number,
                        'account_number'
                      )
                    }
                  >
                    {copiedField === 'account_number' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Name</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={instructions.account_name}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(instructions.account_name, 'account_name')
                    }
                  >
                    {copiedField === 'account_name' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reference Number</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Enter reference number"
                    className="font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(reference, 'reference')}
                  >
                    {copiedField === 'reference' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <h3 className="font-medium">Important Instructions:</h3>
              <ul className="space-y-2">
                {instructions.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </span>
                    <span className="text-sm">{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Processing Time */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  Processing Time
                </span>
              </div>
              <p className="text-sm text-yellow-700">
                Bank transfers typically take 1-2 business days to process. Your
                subscription will be activated once the payment is confirmed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleCreateTransfer}
          disabled={isCreating || !reference.trim()}
          className="flex-1"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Transfer...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              Create Bank Transfer
            </>
          )}
        </Button>

        <Button variant="outline" asChild>
          <a href="/subscriptions">
            <ExternalLink className="mr-2 h-4 w-4" />
            Back to Subscriptions
          </a>
        </Button>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-800">Secure Payment</span>
        </div>
        <p className="text-sm text-green-700">
          Bank transfers are a secure payment method. Your payment will be
          processed through your bank&apos;s secure systems and confirmed within 1-2
          business days.
        </p>
      </div>
    </div>
  );
}
