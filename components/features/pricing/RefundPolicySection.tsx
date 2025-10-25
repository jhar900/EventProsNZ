'use client';

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
  Clock,
  Check,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Shield,
  DollarSign,
} from 'lucide-react';

export function RefundPolicySection() {
  const refundPolicy = {
    title: '30-Day Money-Back Guarantee',
    description:
      'We stand behind our service with a full 30-day money-back guarantee.',
    timeframe: '30 days from subscription start',
    process: 'Simple online request',
    processing: '5-7 business days',
    coverage: 'Full refund of subscription fees',
  };

  const refundProcess = [
    {
      step: 1,
      title: 'Request Refund',
      description: 'Contact support or use the cancellation form',
      timeframe: 'Anytime within 30 days',
      icon: Mail,
    },
    {
      step: 2,
      title: 'Review Process',
      description: 'We review your request (usually within 24 hours)',
      timeframe: '1-2 business days',
      icon: Clock,
    },
    {
      step: 3,
      title: 'Refund Processing',
      description: 'Refund is processed to your original payment method',
      timeframe: '5-7 business days',
      icon: DollarSign,
    },
  ];

  const refundConditions = [
    {
      title: 'Eligible for Refund',
      conditions: [
        'Within 30 days of initial subscription',
        'No significant usage of premium features',
        'Valid payment method on file',
        'Account in good standing',
      ],
      eligible: true,
    },
    {
      title: 'Not Eligible for Refund',
      conditions: [
        'After 30 days from subscription start',
        'Excessive usage of premium features',
        'Violation of terms of service',
        'Fraudulent activity detected',
      ],
      eligible: false,
    },
  ];

  const cancellationProcess = [
    {
      title: 'Immediate Cancellation',
      description: 'Cancel anytime from your account dashboard',
      features: [
        'No questions asked',
        'Immediate effect',
        'Access until period end',
      ],
    },
    {
      title: 'End of Billing Cycle',
      description:
        'Cancellation takes effect at the end of your current billing period',
      features: [
        'Keep access until renewal',
        'No prorated refunds',
        'Easy to reactivate',
      ],
    },
  ];

  const supportOptions = [
    {
      method: 'Email Support',
      contact: 'support@eventpros.co.nz',
      response: 'Within 24 hours',
      icon: Mail,
    },
    {
      method: 'Phone Support',
      contact: '+64 9 123 4567',
      response: 'Mon-Fri 9AM-5PM NZST',
      icon: Phone,
    },
    {
      method: 'Live Chat',
      contact: 'Available on website',
      response: 'Mon-Fri 9AM-5PM NZST',
      icon: Shield,
    },
  ];

  return (
    <section className="py-16" data-testid="refund-policy-section">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          Refund & <span className="text-primary">Cancellation Policy</span>
        </h2>
        <p className="text-xl text-muted-foreground">
          We offer a 30-day money-back guarantee and flexible cancellation
          options
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Refund Guarantee */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2 text-green-800 dark:text-green-200"
              data-testid="refund-policy-money-back-guarantee"
            >
              <Shield className="h-6 w-6" />
              {refundPolicy.title}
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              {refundPolicy.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Refund Details</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Timeframe: {refundPolicy.timeframe}</li>
                  <li>• Process: {refundPolicy.process}</li>
                  <li>• Processing: {refundPolicy.processing}</li>
                  <li>• Coverage: {refundPolicy.coverage}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">What&apos;s Included</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Full subscription fee refund</li>
                  <li>• No cancellation fees</li>
                  <li>• Keep access until period end</li>
                  <li>• Easy reactivation anytime</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Process */}
        <div>
          <h3 className="text-2xl font-bold mb-6">How to Request a Refund</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {refundProcess.map(step => (
              <Card key={step.step}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {step.step}
                    </div>
                    {step.title}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <step.icon className="h-4 w-4" />
                    {step.timeframe}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Refund Conditions */}
        <div className="grid gap-6 md:grid-cols-2">
          {refundConditions.map(condition => (
            <Card
              key={condition.title}
              className={
                condition.eligible ? 'border-green-200' : 'border-red-200'
              }
            >
              <CardHeader>
                <CardTitle
                  className={`flex items-center gap-2 ${
                    condition.eligible
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  <Check
                    className={`h-5 w-5 ${
                      condition.eligible ? 'text-green-500' : 'text-red-500'
                    }`}
                  />
                  {condition.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {condition.conditions.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                          condition.eligible ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cancellation Process */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Cancellation Options</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {cancellationProcess.map(option => (
              <Card key={option.title}>
                <CardHeader>
                  <CardTitle>{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {option.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Support Options */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help with Refunds or Cancellations?</CardTitle>
            <CardDescription>
              Our support team is here to help with any questions about refunds
              or cancellations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {supportOptions.map(option => (
                <div key={option.method} className="text-center space-y-3">
                  <div className="flex justify-center">
                    <option.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{option.method}</h4>
                    <p className="text-sm text-muted-foreground">
                      {option.contact}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {option.response}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Refunds are processed to the original
            payment method. Processing times may vary depending on your bank or
            payment provider. If you have any questions about your refund,
            please contact our support team.
          </AlertDescription>
        </Alert>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-medium">Ready to Get Started?</h3>
          <p className="text-muted-foreground">
            Start your free trial today with confidence knowing you&apos;re
            protected by our money-back guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">Start Free Trial</Button>
            <Button variant="outline" size="lg">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
