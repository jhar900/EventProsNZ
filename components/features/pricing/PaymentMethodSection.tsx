'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, Lock, Check, AlertCircle } from 'lucide-react';

export function PaymentMethodSection() {
  const paymentMethods = [
    {
      name: 'Credit Cards',
      description: 'Visa, Mastercard, American Express',
      icon: CreditCard,
      features: [
        'Instant processing',
        'Secure encryption',
        'Global acceptance',
      ],
      supported: ['Visa', 'Mastercard', 'American Express', 'Discover'],
      testId: 'credit-cards',
    },
    {
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: Shield,
      features: ['Quick checkout', 'Buyer protection', 'No fees for you'],
      supported: ['PayPal Balance', 'Bank Account', 'Credit Cards'],
      testId: 'paypal',
    },
    {
      name: 'Bank Transfer',
      description: 'Direct bank transfer for annual plans',
      icon: Lock,
      features: ['Lower fees', 'Direct from bank', 'Annual billing only'],
      supported: ['NZ Bank Transfer', 'International Wire'],
      testId: 'bank-transfer',
    },
  ];

  const securityFeatures = [
    '256-bit SSL encryption',
    'PCI DSS compliant',
    'Secure tokenization',
    'Fraud protection',
    'Regular security audits',
    'GDPR compliant data handling',
  ];

  const billingInfo = [
    {
      title: 'Billing Cycle',
      description: 'Monthly or annual billing available',
      details: [
        'Monthly: Billed on the same date each month',
        'Annual: Billed once per year with discount',
      ],
    },
    {
      title: 'Payment Processing',
      description: 'Secure payment processing with Stripe',
      details: [
        'Industry-leading security',
        '99.9% uptime',
        'Global payment methods',
      ],
    },
    {
      title: 'Refunds',
      description: '30-day money-back guarantee',
      details: [
        'Full refund within 30 days',
        'No questions asked',
        'Processed within 5-7 business days',
      ],
    },
  ];

  return (
    <section className="py-16" data-testid="payment-methods-section">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          Secure <span className="text-primary">Payment Methods</span>
        </h2>
        <p className="text-xl text-muted-foreground">
          Choose from multiple secure payment options
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Payment Methods */}
        <div className="grid gap-6 md:grid-cols-3">
          {paymentMethods.map((method, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle
                  className="flex items-center gap-2"
                  data-testid={method.testId}
                >
                  <method.icon className="h-6 w-6 text-primary" />
                  {method.name}
                </CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="space-y-1">
                    {method.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Supported</h4>
                  <div className="flex flex-wrap gap-1">
                    {method.supported.map((support, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {support}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Features */}
        <Card data-testid="security-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-500" />
              Security & Compliance
            </CardTitle>
            <CardDescription>
              Your payment information is protected with industry-leading
              security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-4">Security Features</h4>
                <ul className="space-y-2">
                  {securityFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span
                        className="text-sm"
                        data-testid={feature.toLowerCase().replace(/\s+/g, '-')}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-4">Compliance</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" data-testid="pci-dss">
                      PCI DSS
                    </Badge>
                    <span className="text-sm">Level 1 Service Provider</span>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    data-testid="ssl-encryption"
                  >
                    <Badge variant="default">SOC 2</Badge>
                    <span className="text-sm">Type II Certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">GDPR</Badge>
                    <span className="text-sm">EU Data Protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">ISO 27001</Badge>
                    <span className="text-sm">Information Security</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <div className="grid gap-6 md:grid-cols-3">
          {billingInfo.map((info, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{info.title}</CardTitle>
                <CardDescription>{info.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {info.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0 mt-1" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Notes */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                  Important Payment Information
                </h4>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                  <li>• All prices are in New Zealand Dollars (NZD)</li>
                  <li>
                    • International cards are accepted with currency conversion
                  </li>
                  <li>
                    • Bank transfers are only available for annual subscriptions
                  </li>
                  <li>• Failed payments will automatically retry for 3 days</li>
                  <li>
                    • You can update your payment method anytime in your account
                    settings
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium">Trusted by Event Planners</h3>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">$2M+</div>
              <div className="text-sm">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-sm">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">4.9★</div>
              <div className="text-sm">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
