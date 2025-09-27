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
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  Star,
  Zap,
} from 'lucide-react';

interface Subscription {
  id: string;
  tier: 'essential' | 'showcase' | 'spotlight';
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial';
  billing_cycle: 'monthly' | 'yearly' | '2year';
  price: number;
  start_date: string;
  end_date?: string;
  trial_end_date?: string;
  promotional_code?: string;
}

interface TrialInfo {
  subscription_id: string;
  tier: 'essential' | 'showcase' | 'spotlight';
  start_date: string;
  end_date: string;
  days_remaining: number;
  is_active: boolean;
}

interface TrialManagementProps {
  currentSubscription?: Subscription | null;
  onTrialChange: () => void;
}

export function TrialManagement({
  currentSubscription,
  onTrialChange,
}: TrialManagementProps) {
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTrial, setStartingTrial] = useState<string | null>(null);

  useEffect(() => {
    loadTrialStatus();
  }, [currentSubscription]);

  const loadTrialStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/trial/status');
      if (!response.ok) {
        throw new Error('Failed to load trial status');
      }

      const data = await response.json();
      setTrial(data.trial);
    } catch (err) {
      setError('Failed to load trial status');
      } finally {
      setLoading(false);
    }
  };

  const startTrial = async (tier: 'showcase' | 'spotlight') => {
    setStartingTrial(tier);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/trial/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start trial');
      }

      onTrialChange();
      await loadTrialStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start trial');
    } finally {
      setStartingTrial(null);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'showcase':
        return <Crown className="h-5 w-5 text-blue-500" />;
      case 'spotlight':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTierDisplayName = (tier: string) => {
    const names = {
      showcase: 'Showcase',
      spotlight: 'Spotlight',
    };
    return names[tier as keyof typeof names] || tier;
  };

  const getTrialProgress = () => {
    if (!trial) return 0;

    const totalDays = 14;
    const remainingDays = trial.days_remaining;
    return ((totalDays - remainingDays) / totalDays) * 100;
  };

  const getTrialStatusColor = () => {
    if (!trial) return 'text-gray-500';

    if (trial.days_remaining > 7) return 'text-green-500';
    if (trial.days_remaining > 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Free Trial Management</h2>
        <p className="text-muted-foreground">
          Start your free trial and explore premium features
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {trial ? (
        <div className="space-y-6">
          {/* Current Trial Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Trial
              </CardTitle>
              <CardDescription>Your free trial is active</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tier</span>
                <div className="flex items-center gap-2">
                  {getTierIcon(trial.tier)}
                  <span>{getTierDisplayName(trial.tier)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Days Remaining</span>
                <span className={`font-semibold ${getTrialStatusColor()}`}>
                  {trial.days_remaining} days
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Trial Progress</span>
                  <span>{Math.round(getTrialProgress())}%</span>
                </div>
                <Progress value={getTrialProgress()} className="h-2" />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Trial Ends</span>
                <span>{new Date(trial.end_date).toLocaleDateString()}</span>
              </div>

              {trial.days_remaining <= 3 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your trial ends soon! Consider upgrading to continue using
                    premium features.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Trial Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Trial Actions</CardTitle>
              <CardDescription>Manage your trial subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">Upgrade to Full Subscription</Button>
              <Button className="w-full" variant="outline">
                Extend Trial
              </Button>
              <Button className="w-full" variant="outline">
                View Trial Features
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* No Trial Available */}
          {currentSubscription?.status === 'trial' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Trial Already Active
                </CardTitle>
                <CardDescription>
                  You already have an active trial subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={loadTrialStatus}>Refresh Trial Status</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Start Your Free Trial</CardTitle>
                  <CardDescription>
                    Try premium features for 14 days, no credit card required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Crown className="h-5 w-5 text-blue-500" />
                          Showcase Trial
                        </CardTitle>
                        <CardDescription>
                          Perfect for growing businesses
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-1 text-sm">
                          <li>• Enhanced profile features</li>
                          <li>• Priority search visibility</li>
                          <li>• Advanced analytics</li>
                          <li>• Featured badge</li>
                        </ul>
                        <Button
                          className="w-full"
                          onClick={() => startTrial('showcase')}
                          disabled={startingTrial === 'showcase'}
                        >
                          {startingTrial === 'showcase' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Start Showcase Trial'
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-yellow-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          Spotlight Trial
                        </CardTitle>
                        <CardDescription>
                          Maximum visibility and features
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-1 text-sm">
                          <li>• Premium profile features</li>
                          <li>• Top search visibility</li>
                          <li>• Premium analytics</li>
                          <li>• Priority support</li>
                        </ul>
                        <Button
                          className="w-full"
                          onClick={() => startTrial('spotlight')}
                          disabled={startingTrial === 'spotlight'}
                        >
                          {startingTrial === 'spotlight' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Start Spotlight Trial'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Trial Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Trial Benefits</CardTitle>
                  <CardDescription>
                    What you get with your free trial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium">Showcase Trial</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• 20 portfolio uploads</li>
                        <li>• Priority search ranking</li>
                        <li>• Direct contact information</li>
                        <li>• Advanced analytics dashboard</li>
                        <li>• Featured contractor badge</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Spotlight Trial</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Unlimited portfolio uploads</li>
                        <li>• Top search visibility</li>
                        <li>• Premium analytics insights</li>
                        <li>• Priority customer support</li>
                        <li>• Custom branding options</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
