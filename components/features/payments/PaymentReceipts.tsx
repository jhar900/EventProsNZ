/**
 * Payment Receipts Component
 * Displays and manages payment receipts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Mail,
  Search,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

interface Receipt {
  id: string;
  payment_id: string;
  receipt_url: string;
  receipt_number: string;
  amount: number;
  currency: string;
  payment_method: string;
  created_at: string;
}

interface PaymentReceiptsProps {
  userId?: string;
  onDownloadReceipt?: (receiptUrl: string) => void;
  onSendReceipt?: (receiptId: string, email: string) => void;
}

export function PaymentReceipts({
  userId,
  onDownloadReceipt,
  onSendReceipt,
}: PaymentReceiptsProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null);

  const { getUserReceipts, sendReceipt } = usePayment();

  useEffect(() => {
    loadReceipts();
  }, [userId]);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchTerm]);

  const loadReceipts = async () => {
    try {
      setIsLoading(true);
      const userReceipts = await getUserReceipts(userId);
      setReceipts(userReceipts);
    } catch (error: any) {
      setError(error.message || 'Failed to load receipts');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReceipts = () => {
    if (!searchTerm) {
      setFilteredReceipts(receipts);
      return;
    }

    const filtered = receipts.filter(
      receipt =>
        receipt.receipt_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        receipt.payment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredReceipts(filtered);
  };

  const handleDownloadReceipt = (receipt: Receipt) => {
    onDownloadReceipt?.(receipt.receipt_url);
    window.open(receipt.receipt_url, '_blank');
  };

  const handleSendReceipt = async (receipt: Receipt) => {
    const email = prompt('Enter email address to send receipt to:');
    if (!email) return;

    try {
      setSendingReceipt(receipt.id);
      const result = await sendReceipt(receipt.payment_id, email);
      onSendReceipt?.(receipt.id, email);
    } catch (error: any) {
      setError(error.message || 'Failed to send receipt');
    } finally {
      setSendingReceipt(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            <span className="ml-2">Loading receipts...</span>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Receipts</h2>
        <Button onClick={loadReceipts} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search receipts by number, payment ID, or method..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredReceipts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No Receipts Found' : 'No Receipts'}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'No receipts match your search criteria.'
                : "You haven't made any payments yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReceipts.map(receipt => (
            <Card key={receipt.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          Receipt #{receipt.receipt_number}
                        </span>
                        <Badge variant="secondary">
                          {receipt.payment_method.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Payment ID: {receipt.payment_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(receipt.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatAmount(receipt.amount, receipt.currency)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(receipt)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendReceipt(receipt)}
                      disabled={sendingReceipt === receipt.id}
                      className="flex items-center gap-2"
                    >
                      {sendingReceipt === receipt.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receipt Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {receipts.length}
                </p>
                <p className="text-sm text-gray-600">Total Receipts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {receipts
                    .reduce((sum, receipt) => sum + receipt.amount, 0)
                    .toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(receipts.map(r => r.payment_method)).size}
                </p>
                <p className="text-sm text-gray-600">Payment Methods</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
