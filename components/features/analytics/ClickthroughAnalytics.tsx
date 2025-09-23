'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MousePointer, TrendingUp, Target, BarChart3 } from 'lucide-react';

interface CTRMetrics {
  total_searches: number;
  total_clicks: number;
  click_through_rate: number;
  avg_click_position: number;
  date: string;
}

interface ClickData {
  query: string;
  click_position: number;
  click_count: number;
  unique_users: number;
  date: string;
}

interface ClickthroughAnalyticsProps {
  timePeriod: string;
  className?: string;
}

export default function ClickthroughAnalytics({
  timePeriod,
  className,
}: ClickthroughAnalyticsProps) {
  const [ctrMetrics, setCtrMetrics] = useState<CTRMetrics | null>(null);
  const [clickData, setClickData] = useState<ClickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClickthroughAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/search/clickthrough?period=${timePeriod}`
      );
      const data = await response.json();

      if (data.ctr_metrics) {
        setCtrMetrics(data.ctr_metrics);
      }
      if (data.click_analytics) {
        setClickData(data.click_analytics);
      }
    } catch (error) {
      console.error('Error fetching clickthrough analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClickthroughAnalytics();
  }, [timePeriod]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const getCTRColor = (ctr: number) => {
    if (ctr >= 20) return 'text-green-600';
    if (ctr >= 10) return 'text-yellow-600';
    if (ctr >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCTRBadgeVariant = (ctr: number) => {
    if (ctr >= 20) return 'default';
    if (ctr >= 10) return 'secondary';
    if (ctr >= 5) return 'outline';
    return 'destructive';
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'bg-green-100 text-green-800';
    if (position <= 6) return 'bg-yellow-100 text-yellow-800';
    if (position <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Click-Through Rate Analytics
            </CardTitle>
            <CardDescription>
              Search result engagement and click patterns
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchClickthroughAnalytics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CTR Metrics Overview */}
            {ctrMetrics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Click-Through Rate
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${getCTRColor(ctrMetrics.click_through_rate)}`}
                  >
                    {formatPercentage(ctrMetrics.click_through_rate)}
                  </div>
                  <Badge
                    variant={getCTRBadgeVariant(ctrMetrics.click_through_rate)}
                  >
                    {ctrMetrics.click_through_rate >= 20
                      ? 'Excellent'
                      : ctrMetrics.click_through_rate >= 10
                        ? 'Good'
                        : ctrMetrics.click_through_rate >= 5
                          ? 'Average'
                          : 'Needs Improvement'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Searches</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(ctrMetrics.total_searches)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Search queries
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Clicks</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatNumber(ctrMetrics.total_clicks)}
                  </div>
                  <p className="text-xs text-muted-foreground">Result clicks</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Avg Click Position
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {ctrMetrics.avg_click_position.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Position in results
                  </p>
                </div>
              </div>
            )}

            {/* CTR Performance Indicator */}
            {ctrMetrics && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CTR Performance</span>
                  <span className="text-sm text-muted-foreground">
                    {formatPercentage(ctrMetrics.click_through_rate)} / 20%
                    target
                  </span>
                </div>
                <Progress
                  value={Math.min(ctrMetrics.click_through_rate, 20)}
                  max={20}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Industry average CTR is typically 10-15%
                </p>
              </div>
            )}

            {/* Click Position Analysis */}
            {clickData.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Click Position Distribution</h4>
                <div className="space-y-3">
                  {clickData.slice(0, 10).map((click, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          className={getPositionColor(click.click_position)}
                        >
                          Position {click.click_position}
                        </Badge>
                        <div>
                          <div className="font-medium truncate max-w-xs">
                            {click.query || 'Unknown Query'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(click.click_count)} clicks •{' '}
                            {formatNumber(click.unique_users)} users
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(
                            (click.click_count /
                              (ctrMetrics?.total_clicks || 1)) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">
                          of total clicks
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Recommendations */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Optimization Recommendations</h4>
              <div className="space-y-2 text-sm">
                {ctrMetrics && ctrMetrics.click_through_rate < 10 && (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span>
                      Consider improving search result relevance and ranking
                      algorithms
                    </span>
                  </div>
                )}
                {ctrMetrics && ctrMetrics.avg_click_position > 5 && (
                  <div className="flex items-start gap-2">
                    <span className="text-orange-600">📊</span>
                    <span>
                      Users are clicking on lower-ranked results - review
                      ranking criteria
                    </span>
                  </div>
                )}
                {ctrMetrics && ctrMetrics.click_through_rate >= 15 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    <span>
                      Great CTR performance! Consider A/B testing to optimize
                      further
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
