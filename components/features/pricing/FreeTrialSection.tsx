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
import { Check, Clock, Star, Crown, Zap, ArrowRight, Gift } from 'lucide-react';

interface SubscriptionTierInfo {
  id: string;
  name: string;
  price: number;
  price_annual: number;
  billing_cycle: string;
  features: string[];
  limits: Record<string, number>;
  is_trial_eligible: boolean;
  is_popular?: boolean;
}

interface FreeTrialSectionProps {
  tiers?: SubscriptionTierInfo[];
}

export function FreeTrialSection({ tiers = [] }: FreeTrialSectionProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 14,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const trialFeatures = [
    'Full access to all premium features',
    'Create unlimited event listings',
    'Upload unlimited portfolio images',
    'Access to analytics dashboard',
    'Priority customer support',
    'No credit card required',
    'Cancel anytime during trial',
    'Easy upgrade to paid plan',
  ];

  const trialBenefits = [
    {
      icon: <Gift className="h-6 w-6 text-green-500" />,
      title: '14 Days Free',
      description: 'Full access to all features for 14 days',
    },
    {
      icon: <Check className="h-6 w-6 text-blue-500" />,
      title: 'No Commitment',
      description: 'Cancel anytime, no questions asked',
    },
    {
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      title: 'Premium Support',
      description: 'Get priority support during your trial',
    },
  ];

  const handleStartTrial = (tierId: string) => {
    console.log('Starting trial for tier:', tierId);
    // This would integrate with the trial system
  };

  const handleSignUp = () => {
    console.log('Sign up for free account');
    // This would redirect to signup
  };

  return (
    <section
      className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/5"
      data-testid="free-trial-section"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge
            variant="secondary"
            className="mb-4"
            data-testid="trial-duration"
          >
            <Gift className="h-4 w-4 mr-2" />
            Limited Time Offer
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Start Your <span className="text-primary">Free Trial</span> Today
          </h2>
          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            data-testid="trial-no-card"
          >
            Experience all premium features for 14 days. No credit card
            required, cancel anytime.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Trial Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  Trial Details
                </CardTitle>
                <CardDescription>
                  Everything you need to know about your free trial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <div>
                    <div className="font-medium">Trial Duration</div>
                    <div className="text-sm text-muted-foreground">14 days</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">14</div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">What&apos;s Included:</h4>
                  <ul className="space-y-2">
                    {trialFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Trial Benefits */}
            <div className="grid gap-4">
              {trialBenefits.map((benefit, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {benefit.icon}
                      <div>
                        <h4 className="font-medium">{benefit.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Trial Signup */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Start Your Free Trial</CardTitle>
                <CardDescription>
                  Choose a plan to start your 14-day free trial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tiers
                  .filter(tier => tier.is_trial_eligible)
                  .map(tier => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {tier.id === 'showcase' && (
                          <Crown className="h-5 w-5 text-blue-500" />
                        )}
                        {tier.id === 'spotlight' && (
                          <Zap className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <div className="font-medium">{tier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {tier.id === 'showcase' &&
                              'Perfect for growing businesses'}
                            {tier.id === 'spotlight' &&
                              'Maximum visibility and features'}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartTrial(tier.id)}
                        size="sm"
                      >
                        Start Trial
                      </Button>
                    </div>
                  ))}

                <div className="pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Or start with our free plan
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleSignUp}
                      className="w-full"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trial Terms */}
            <Alert>
              <AlertDescription>
                <strong>Free Trial Terms:</strong> 14-day free trial available
                for Showcase and Spotlight plans. No credit card required.
                Cancel anytime during the trial period. After 14 days,
                you&apos;ll be automatically charged unless you cancel.
              </AlertDescription>
            </Alert>

            {/* Trust Indicators */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span>✓ No setup fees</span>
                <span>✓ Cancel anytime</span>
                <span>✓ 30-day money-back guarantee</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Join 500+ event planners who trust EventProsNZ
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
