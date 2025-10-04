/**
 * Payment Methods Component
 * Manages user payment methods
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

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

interface PaymentMethodsProps {
  onAddMethod?: () => void;
  onEditMethod?: (method: PaymentMethod) => void;
  onDeleteMethod?: (method: PaymentMethod) => void;
}

export function PaymentMethods({
  onAddMethod,
  onEditMethod,
  onDeleteMethod,
}: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { getPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod } =
    usePayment();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error: any) {
      setError(error.message || 'Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMethod = async (method: PaymentMethod) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      setDeletingId(method.id);
      await deletePaymentMethod(method.id);
      setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
      onDeleteMethod?.(method);
    } catch (error: any) {
      setError(error.message || 'Failed to delete payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    try {
      await setDefaultPaymentMethod(method.id);
      setPaymentMethods(prev =>
        prev.map(m => ({
          ...m,
          is_default: m.id === method.id,
        }))
      );
    } catch (error: any) {
      setError(error.message || 'Failed to set default payment method');
    }
  };

  const getBrandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatExpiryDate = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading payment methods...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Methods</h2>
        <Button onClick={onAddMethod} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Payment Methods
            </h3>
            <p className="text-gray-600 mb-4">
              You haven&apos;t added any payment methods yet.
            </p>
            <Button onClick={onAddMethod} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map(method => (
            <Card key={method.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getBrandIcon(method.brand)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {method.brand?.toUpperCase()} •••• {method.last_four}
                        </span>
                        {method.is_default && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.exp_month && method.exp_year && (
                        <p className="text-sm text-gray-600">
                          Expires{' '}
                          {formatExpiryDate(method.exp_month, method.exp_year)}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Added {new Date(method.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method)}
                      >
                        Set as Default
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditMethod?.(method)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMethod(method)}
                      disabled={deletingId === method.id}
                      className="text-red-600 hover:text-red-700"
                      aria-label={`Delete ${method.brand} ending in ${method.last_four}`}
                    >
                      {deletingId === method.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>
          <strong>Security:</strong> All payment methods are encrypted and
          stored securely. We never store your full card details.
        </p>
      </div>
    </div>
  );
}
