/**
 * Payments Page
 * Main payment processing page with subscription payment options
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Building2,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { PaymentForm } from '@/components/features/payments/PaymentForm';
import { StripeIntegration } from '@/components/features/payments/StripeIntegration';
import { BankTransferFallback } from '@/components/features/payments/BankTransferFallback';
import { PaymentSecurity } from '@/components/features/payments/PaymentSecurity';
import { usePayment } from '@/hooks/usePayment';

interface Subscription {
  id: string;
  tier: string;
  billing_cycle: string;
  price: number;
  status: string;
}

function PaymentsContent() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    'stripe' | 'bank_transfer'
  >('stripe');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { getPaymentMethods } = usePayment();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);

      // Get subscription ID from URL params
      const subscriptionId = searchParams.get('subscription_id');
      if (!subscriptionId) {
        setError('No subscription ID provided');
        return;
      }

      // In a real implementation, this would fetch subscription data
      // For now, we'll use mock data
      const mockSubscription: Subscription = {
        id: subscriptionId,
        tier: 'showcase',
        billing_cycle: 'monthly',
        price: 29.0,
        status: 'trial',
      };

      setSubscription(mockSubscription);
    } catch (error: any) {
      setError(error.message || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (payment: any) => {
    setPaymentSuccess(true);
    // Redirect to confirmation page
    window.location.href = `/payments/confirm?payment_intent_id=${payment.stripe_payment_intent_id}`;
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const getTierDisplayName = (tier: string) => {
    const names: Record<string, string> = {
      essential: 'Essential',
      showcase: 'Showcase',
      spotlight: 'Spotlight',
    };
    return names[tier] || tier;
  };

  const getBillingCycleDisplay = (cycle: string) => {
    const cycles: Record<string, string> = {
      monthly: 'Monthly',
      yearly: 'Yearly',
      '2year': '2-Year',
    };
    return cycles[cycle] || cycle;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading payment options...</span>
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

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Subscription not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully. You will be redirected
            to the confirmation page shortly.
          </p>
          <Button asChild>
            <a href="/payments/confirm">View Payment Details</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Payment
          </h1>
          <p className="text-gray-600">
            Choose your preferred payment method to activate your subscription.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Plan</span>
                  <Badge variant="secondary">
                    {getTierDisplayName(subscription.tier)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">Billing Cycle</span>
                  <span>
                    {getBillingCycleDisplay(subscription.billing_cycle)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">Amount</span>
                  <span className="text-lg font-bold">
                    NZD ${subscription.price.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">Status</span>
                  <Badge
                    variant={
                      subscription.status === 'trial' ? 'secondary' : 'default'
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentSecurity showDetails={false} />
              </CardContent>
            </Card>
          </div>

          {/* Payment Options */}
          <div className="lg:col-span-2">
            {/* Payment Method Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Choose Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('stripe')}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <CreditCard className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-sm text-gray-600">
                        Secure payment with Stripe
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant={
                      paymentMethod === 'bank_transfer' ? 'default' : 'outline'
                    }
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Building2 className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-gray-600">
                        Direct bank transfer
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            {paymentMethod === 'stripe' && (
              <StripeIntegration
                subscriptionId={subscription.id}
                amount={subscription.price}
                currency="NZD"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}

            {paymentMethod === 'bank_transfer' && (
              <BankTransferFallback
                subscriptionId={subscription.id}
                amount={subscription.price}
                currency="NZD"
                onTransferCreated={transfer => {
                  console.log('Bank transfer created:', transfer);
                  // Handle bank transfer creation
                }}
                onTransferError={handlePaymentError}
              />
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <h3 className="font-medium mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-600">
                Your payment information is encrypted and secure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <h3 className="font-medium mb-1">Instant Activation</h3>
              <p className="text-sm text-gray-600">
                Your subscription will be activated immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <h3 className="font-medium mb-1">Flexible Billing</h3>
              <p className="text-sm text-gray-600">
                Change or cancel your subscription anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
