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
import {
  ArrowUp,
  ArrowDown,
  Clock,
  Check,
  Star,
  Crown,
  Zap,
} from 'lucide-react';

export function UpgradeDowngradeSection() {
  const upgradeBenefits = [
    'Immediate access to new features',
    'No downtime during upgrade',
    'Prorated billing for the current month',
    'Keep all your existing data',
    'Priority support during transition',
  ];

  const downgradeInfo = [
    'Downgrade takes effect at next billing cycle',
    'You keep access to current features until renewal',
    'Data is preserved but some features may be limited',
    'No refunds for unused time',
    'Easy to upgrade again anytime',
  ];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'essential':
        return <Star className="h-5 w-5 text-gray-500" />;
      case 'showcase':
        return <Crown className="h-5 w-5 text-blue-500" />;
      case 'spotlight':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <section className="py-16" data-testid="plan-management-section">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          Flexible <span className="text-primary">Plan Management</span>
        </h2>
        <p className="text-xl text-muted-foreground">
          Upgrade or downgrade your plan anytime to match your business needs
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-2">
        {/* Upgrade Information */}
        <Card>
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              data-testid="upgrade-info"
            >
              <ArrowUp className="h-6 w-6 text-green-500" />
              Upgrading Your Plan
            </CardTitle>
            <CardDescription>
              Get immediate access to premium features when you upgrade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Upgrade Process</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Choose your new plan</div>
                    <div className="text-sm text-muted-foreground">
                      Select from Essential, Showcase, or Spotlight
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Immediate activation</div>
                    <div className="text-sm text-muted-foreground">
                      New features are available instantly
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Prorated billing</div>
                    <div className="text-sm text-muted-foreground">
                      You only pay the difference for the remaining billing
                      period
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Upgrade Benefits</h4>
              <ul className="space-y-2">
                {upgradeBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Instant Upgrade
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Upgrades take effect immediately. You&apos;ll have access to all
                new features right away.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Downgrade Information */}
        <Card>
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              data-testid="downgrade-info"
            >
              <ArrowDown className="h-6 w-6 text-orange-500" />
              Downgrading Your Plan
            </CardTitle>
            <CardDescription>
              Downgrade at the end of your current billing cycle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Downgrade Process</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Request downgrade</div>
                    <div className="text-sm text-muted-foreground">
                      Contact support or use the dashboard
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <div className="font-medium">End of cycle</div>
                    <div className="text-sm text-muted-foreground">
                      Changes take effect at your next billing date
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Feature adjustment</div>
                    <div className="text-sm text-muted-foreground">
                      Some features may be limited based on your new plan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Important Information</h4>
              <ul className="space-y-2">
                {downgradeInfo.map((info, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{info}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800 dark:text-orange-200">
                  End of Cycle Downgrade
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Downgrades take effect at the end of your current billing cycle
                to ensure you get full value from your current plan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      <div className="mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
            <CardDescription>
              Compare features across all subscription tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  id: 'essential',
                  name: 'Essential',
                  price: 'Free',
                  icon: Star,
                },
                {
                  id: 'showcase',
                  name: 'Showcase',
                  price: '$29/month',
                  icon: Crown,
                },
                {
                  id: 'spotlight',
                  name: 'Spotlight',
                  price: '$69/month',
                  icon: Zap,
                },
              ].map(plan => (
                <div key={plan.id} className="text-center space-y-4">
                  <div className="flex justify-center">
                    {getTierIcon(plan.id)}
                  </div>
                  <div>
                    <h4 className="font-medium">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.price}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Learn More
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Information */}
      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">
          Need help choosing the right plan?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button>Contact Support</Button>
          <Button variant="outline">Schedule Consultation</Button>
        </div>
      </div>
    </section>
  );
}
