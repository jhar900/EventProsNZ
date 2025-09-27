'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  Play,
  Pause,
  Settings,
  Eye,
  Activity,
} from 'lucide-react';

interface ABTest {
  id: string;
  test_name: string;
  variant_a: any;
  variant_b: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metrics?: {
    variant_a: {
      total_participants: number;
      conversion_rate: number;
      average_engagement: number;
      average_rating: number;
    };
    variant_b: {
      total_participants: number;
      conversion_rate: number;
      average_engagement: number;
      average_rating: number;
    };
  };
  winning_variant?: string;
  total_participants: number;
  is_statistically_significant: boolean;
}

interface AITestingPanelProps {
  onClose: () => void;
  className?: string;
}

export function AITestingPanel({
  onClose,
  className = '',
}: AITestingPanelProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadABTests();
  }, []);

  const loadABTests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/ab-testing');
      if (!response.ok) {
        throw new Error('Failed to load A/B tests');
      }
      const data = await response.json();
      setTests(data.tests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load A/B tests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestToggle = async (testId: string, isActive: boolean) => {
    try {
      // This would typically call an API to toggle test status
      setTests(prev =>
        prev.map(test =>
          test.id === testId ? { ...test, is_active: !isActive } : test
        )
      );
    } catch (err) {
      }
  };

  const getVariantColor = (variant: string) => {
    return variant === 'A' ? 'text-blue-600' : 'text-green-600';
  };

  const getVariantBgColor = (variant: string) => {
    return variant === 'A' ? 'bg-blue-100' : 'bg-green-100';
  };

  if (isLoading) {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      >
        <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center">
              <LoadingSpinner />
              <span className="ml-2">Loading A/B tests...</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 w-full bg-gray-100 animate-pulse rounded"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <Card className="w-full max-w-6xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">A/B Testing Dashboard</CardTitle>
              <CardDescription>
                Monitor and analyze AI recommendation algorithm performance
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="active">Active Tests</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {tests.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Tests
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {tests.filter(t => t.is_active).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active Tests
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {tests.filter(t => t.winning_variant).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Completed
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {tests.reduce(
                          (sum, t) => sum + t.total_participants,
                          0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Participants
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recent Tests</h3>
                  {tests.slice(0, 3).map(test => (
                    <Card key={test.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{test.test_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {test.total_participants} participants
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={test.is_active ? 'default' : 'secondary'}
                            >
                              {test.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {test.winning_variant && (
                              <Badge
                                className={getVariantBgColor(
                                  test.winning_variant
                                )}
                              >
                                {test.winning_variant} Wins
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                <div className="space-y-4">
                  {tests
                    .filter(t => t.is_active)
                    .map(test => (
                      <Card key={test.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {test.test_name}
                              </CardTitle>
                              <CardDescription>
                                Testing{' '}
                                {test.variant_a.algorithm ||
                                  test.variant_a.layout ||
                                  test.variant_a.personalization}{' '}
                                vs{' '}
                                {test.variant_b.algorithm ||
                                  test.variant_b.layout ||
                                  test.variant_b.personalization}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Active</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleTestToggle(test.id, test.is_active)
                                }
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-6">
                            {/* Variant A */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${getVariantBgColor('A')}`}
                                ></div>
                                <span className="font-medium">Variant A</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Participants:</span>
                                  <span>
                                    {test.metrics?.variant_a
                                      .total_participants || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Conversion Rate:</span>
                                  <span>
                                    {Math.round(
                                      (test.metrics?.variant_a
                                        .conversion_rate || 0) * 100
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Rating:</span>
                                  <span>
                                    {test.metrics?.variant_a.average_rating?.toFixed(
                                      1
                                    ) || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Variant B */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${getVariantBgColor('B')}`}
                                ></div>
                                <span className="font-medium">Variant B</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Participants:</span>
                                  <span>
                                    {test.metrics?.variant_b
                                      .total_participants || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Conversion Rate:</span>
                                  <span>
                                    {Math.round(
                                      (test.metrics?.variant_b
                                        .conversion_rate || 0) * 100
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Rating:</span>
                                  <span>
                                    {test.metrics?.variant_b.average_rating?.toFixed(
                                      1
                                    ) || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {test.is_statistically_significant && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                              <div className="flex items-center gap-2 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Statistically significant results available
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                  {tests.filter(t => t.is_active).length === 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No active A/B tests running at the moment.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                <div className="space-y-4">
                  {tests
                    .filter(t => t.winning_variant)
                    .map(test => (
                      <Card key={test.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {test.test_name}
                              </CardTitle>
                              <CardDescription>
                                Completed test with {test.total_participants}{' '}
                                participants
                              </CardDescription>
                            </div>
                            <Badge
                              className={getVariantBgColor(
                                test.winning_variant!
                              )}
                            >
                              {test.winning_variant} Wins
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-6">
                            {/* Variant A Results */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${getVariantBgColor('A')}`}
                                ></div>
                                <span className="font-medium">Variant A</span>
                                {test.winning_variant === 'A' && (
                                  <Badge variant="default">Winner</Badge>
                                )}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Participants:</span>
                                  <span>
                                    {test.metrics?.variant_a
                                      .total_participants || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Conversion Rate:</span>
                                  <span>
                                    {Math.round(
                                      (test.metrics?.variant_a
                                        .conversion_rate || 0) * 100
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Engagement:</span>
                                  <span>
                                    {test.metrics?.variant_a.average_engagement?.toFixed(
                                      2
                                    ) || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Rating:</span>
                                  <span>
                                    {test.metrics?.variant_a.average_rating?.toFixed(
                                      1
                                    ) || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Variant B Results */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${getVariantBgColor('B')}`}
                                ></div>
                                <span className="font-medium">Variant B</span>
                                {test.winning_variant === 'B' && (
                                  <Badge variant="default">Winner</Badge>
                                )}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Participants:</span>
                                  <span>
                                    {test.metrics?.variant_b
                                      .total_participants || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Conversion Rate:</span>
                                  <span>
                                    {Math.round(
                                      (test.metrics?.variant_b
                                        .conversion_rate || 0) * 100
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Engagement:</span>
                                  <span>
                                    {test.metrics?.variant_b.average_engagement?.toFixed(
                                      2
                                    ) || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Avg Rating:</span>
                                  <span>
                                    {test.metrics?.variant_b.average_rating?.toFixed(
                                      1
                                    ) || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {tests.filter(t => t.winning_variant).length === 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No completed A/B tests with results yet.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Test Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Success Rate
                          </span>
                          <span className="font-medium">
                            {tests.length > 0
                              ? Math.round(
                                  (tests.filter(t => t.winning_variant).length /
                                    tests.length) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Avg Participants
                          </span>
                          <span className="font-medium">
                            {tests.length > 0
                              ? Math.round(
                                  tests.reduce(
                                    (sum, t) => sum + t.total_participants,
                                    0
                                  ) / tests.length
                                )
                              : 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Statistical Significance
                          </span>
                          <span className="font-medium">
                            {
                              tests.filter(t => t.is_statistically_significant)
                                .length
                            }
                            /{tests.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Variant Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Variant A Wins
                          </span>
                          <span className="font-medium text-blue-600">
                            {
                              tests.filter(t => t.winning_variant === 'A')
                                .length
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Variant B Wins
                          </span>
                          <span className="font-medium text-green-600">
                            {
                              tests.filter(t => t.winning_variant === 'B')
                                .length
                            }
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Ties
                          </span>
                          <span className="font-medium text-gray-600">
                            {
                              tests.filter(
                                t =>
                                  !t.winning_variant && t.total_participants > 0
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
