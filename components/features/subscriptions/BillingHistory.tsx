'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Download,
  Eye,
  Receipt,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface BillingHistoryProps {
  subscriptionId: string;
}

interface BillingRecord {
  id: string;
  subscription_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  payment_date: string;
  invoice_url?: string;
  description: string;
}

export function BillingHistory({ subscriptionId }: BillingHistoryProps) {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingHistory();
  }, [subscriptionId, loadBillingHistory]);

  const loadBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - in a real implementation, this would fetch from an API
      const mockData: BillingRecord[] = [
        {
          id: '1',
          subscription_id: subscriptionId,
          amount: 29.0,
          status: 'paid',
          payment_date: '2024-01-15T00:00:00Z',
          invoice_url: '/invoices/1.pdf',
          description: 'Showcase Plan - Monthly',
        },
        {
          id: '2',
          subscription_id: subscriptionId,
          amount: 29.0,
          status: 'paid',
          payment_date: '2023-12-15T00:00:00Z',
          invoice_url: '/invoices/2.pdf',
          description: 'Showcase Plan - Monthly',
        },
        {
          id: '3',
          subscription_id: subscriptionId,
          amount: 29.0,
          status: 'paid',
          payment_date: '2023-11-15T00:00:00Z',
          invoice_url: '/invoices/3.pdf',
          description: 'Showcase Plan - Monthly',
        },
      ];

      setBillingRecords(mockData);
    } catch (err) {
      setError('Failed to load billing history');
      } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Paid
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const downloadInvoice = (invoiceUrl: string) => {
    // In a real implementation, this would download the invoice
    };

  const viewInvoice = (invoiceUrl: string) => {
    // In a real implementation, this would open the invoice in a new tab
    window.open(invoiceUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Billing History</h3>
          <p className="text-sm text-muted-foreground">
            View your past invoices and payments
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      {billingRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Billing History</h3>
            <p className="text-muted-foreground text-center">
              You don&apos;t have any billing records yet. Your first invoice will
              appear here after your first payment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {billingRecords.map(record => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{record.description}</h4>
                      {getStatusIcon(record.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(record.payment_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(record.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.invoice_url && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewInvoice(record.invoice_url!)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadInvoice(record.invoice_url!)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Billing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Summary</CardTitle>
          <CardDescription>Overview of your billing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{billingRecords.length}</div>
              <div className="text-sm text-muted-foreground">
                Total Invoices
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {billingRecords.filter(r => r.status === 'paid').length}
              </div>
              <div className="text-sm text-muted-foreground">Paid Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(
                  billingRecords
                    .filter(r => r.status === 'paid')
                    .reduce((sum, r) => sum + r.amount, 0)
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Paid</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
