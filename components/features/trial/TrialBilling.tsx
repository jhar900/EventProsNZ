'use client';

import { useState } from 'react';
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
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Star,
  Crown,
  Zap,
} from 'lucide-react';

interface TrialBillingProps {
  userId: string;
  onBilling?: () => void;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

export default function TrialBilling({ userId, onBilling }: TrialBillingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState('');

  const subscriptionTiers: SubscriptionTier[] = [
    {
      id: 'essential',
      name: 'Essential',
      price: 0,
      billing_cycle: 'monthly',
      features: [
        'Basic Profile',
        'Up to 5 Portfolio Items',
        'Basic Search Visibility',
        'Contact Form',
        'Basic Analytics',
      ],
      icon: <Info className="h-5 w-5" />,
      color: 'text-gray-600',
    },
    {
      id: 'showcase',
      name: 'Showcase',
      price: 29,
      billing_cycle: 'monthly',
      features: [
        'Enhanced Profile',
        'Up to 20 Portfolio Items',
        'Priority Search Visibility',
        'Direct Contact Information',
        'Advanced Analytics',
        'Featured Badge',
        'Social Media Integration',
        'Video Portfolio (5 items)',
      ],
      icon: <Star className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      id: 'spotlight',
      name: 'Spotlight',
      price: 69,
      billing_cycle: 'monthly',
      features: [
        'Premium Profile',
        'Unlimited Portfolio Items',
        'Top Search Visibility',
        'Direct Contact Information',
        'Premium Analytics',
        'Premium Badge',
        'Social Media Integration',
        'Unlimited Video Portfolio',
        'Priority Support',
        'Custom Branding',
        'Advanced Matching',
      ],
      icon: <Crown className="h-5 w-5" />,
      color: 'text-purple-600',
    },
  ];

  const handleBilling = async () => {
    if (!selectedTier || !paymentMethodId) {
      setError('Please select a tier and provide payment method');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/trial/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          tier: selectedTier,
          payment_method_id: paymentMethodId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess(true);
      if (onBilling) {
        onBilling();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to process billing'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <div className="text-lg font-medium text-green-600 mb-2">
            Trial Successfully Converted
          </div>
          <div className="text-sm text-gray-600">
            Your trial has been converted to a paid subscription. Welcome to
            EventProsNZ!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Trial Billing Conversion
          </CardTitle>
          <CardDescription>Convert trial to paid subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>What happens when you convert:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    User&apos;s subscription status changes to
                    &apos;active&apos;
                  </li>
                  <li>Tier changes to selected paid tier</li>
                  <li>Payment processed through Stripe</li>
                  <li>
                    Trial conversion status marked as &apos;converted&apos;
                  </li>
                  <li>User gains access to premium features</li>
                  <li>Billing cycle starts immediately</li>
                </ul>
              </div>
            </div>

            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Select Subscription Tier</CardTitle>
          <CardDescription>
            Choose the tier that best fits the user&apos;s needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionTiers.map(tier => (
              <div
                key={tier.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTier === tier.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTier(tier.id)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={tier.color}>{tier.icon}</div>
                  <div className="font-medium">{tier.name}</div>
                  {selectedTier === tier.id && (
                    <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                  )}
                </div>

                <div className="text-2xl font-bold mb-2">
                  ${tier.price}
                  <span className="text-sm font-normal text-gray-500">
                    /{tier.billing_cycle}
                  </span>
                </div>

                <div className="space-y-1">
                  {tier.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Enter payment method ID for billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Payment Method ID
              </label>
              <input
                id="paymentMethod"
                type="text"
                value={paymentMethodId}
                onChange={e => setPaymentMethodId(e.target.value)}
                placeholder="Enter Stripe payment method ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                This should be a valid Stripe payment method ID (e.g.,
                pm_1234567890)
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleBilling}
                disabled={loading || !selectedTier || !paymentMethodId}
                className="flex-1"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {loading ? 'Processing...' : 'Convert Trial'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Billing Information
          </CardTitle>
          <CardDescription>
            Important information about the billing process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <strong>Immediate Activation:</strong> The subscription will be
                activated immediately upon successful payment.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <strong>Payment Processing:</strong> Payment will be processed
                through Stripe&apos;s secure payment system.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5" />
              <div>
                <strong>Feature Access:</strong> User will immediately gain
                access to all premium features for the selected tier.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <strong>Billing Cycle:</strong> The billing cycle will start
                immediately and recur based on the selected plan.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
