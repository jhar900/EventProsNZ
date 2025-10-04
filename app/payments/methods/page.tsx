/**
 * Payment Methods Page
 * Manages user payment methods
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { PaymentMethods } from '@/components/features/payments/PaymentMethods';
import { PaymentForm } from '@/components/features/payments/PaymentForm';
import { StripeIntegration } from '@/components/features/payments/StripeIntegration';

export default function PaymentMethodsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMethod = () => {
    setShowAddForm(true);
    setEditingMethod(null);
  };

  const handleEditMethod = (method: any) => {
    setEditingMethod(method);
    setShowAddForm(true);
  };

  const handleDeleteMethod = (method: any) => {
    console.log('Payment method deleted:', method);
    // Handle payment method deletion
  };

  const handleFormSuccess = (paymentMethod: any) => {
    console.log('Payment method added:', paymentMethod);
    setShowAddForm(false);
    setEditingMethod(null);
  };

  const handleFormError = (error: string) => {
    setError(error);
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingMethod(null);
    setError(null);
  };

  if (showAddForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleFormCancel}
              className="mb-4"
            >
              ← Back to Payment Methods
            </Button>
            <h1 className="text-2xl font-bold">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </h1>
            <p className="text-gray-600">
              {editingMethod
                ? 'Update your payment method details.'
                : 'Add a new payment method to your account.'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {editingMethod
                  ? 'Edit Payment Method'
                  : 'Add New Payment Method'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StripeIntegration
                subscriptionId="demo-subscription"
                amount={0}
                currency="NZD"
                onSuccess={handleFormSuccess}
                onError={handleFormError}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Methods
          </h1>
          <p className="text-gray-600">
            Manage your payment methods for subscriptions and purchases.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <PaymentMethods
          onAddMethod={handleAddMethod}
          onEditMethod={handleEditMethod}
          onDeleteMethod={handleDeleteMethod}
        />

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Payment Method Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Adding a Payment Method</h3>
              <p className="text-sm text-gray-600">
                Click &quot;Add Payment Method&quot; to securely add a new credit or debit
                card. Your payment information is encrypted and stored securely
                with Stripe.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Default Payment Method</h3>
              <p className="text-sm text-gray-600">
                Your default payment method will be used for automatic
                subscription renewals. You can change your default method at any
                time.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Security</h3>
              <p className="text-sm text-gray-600">
                All payment methods are processed securely through Stripe, a PCI
                DSS Level 1 certified payment processor. We never store your
                full card details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
