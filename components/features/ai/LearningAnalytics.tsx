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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Star,
  BarChart3,
  Lightbulb,
  Target,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { AILearningEngine, LearningInsight } from '@/lib/ai/learning-engine';

interface LearningAnalyticsProps {
  eventType?: string;
  userId?: string;
  onClose?: () => void;
}

export function LearningAnalytics({
  eventType,
  userId,
  onClose,
}: LearningAnalyticsProps) {
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadLearningData();
  }, [eventType, userId]);

  const loadLearningData = async () => {
    setLoading(true);
    try {
      const learningEngine = AILearningEngine.getInstance();

      // Get insights
      const learningInsights = learningEngine.getInsights(
        undefined,
        eventType,
        userId
      );
      setInsights(learningInsights);

      // Get statistics
      const learningStats = learningEngine.getLearningStats();
      setStats(learningStats);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'service_popularity':
        return <TrendingUp className="h-4 w-4" />;
      case 'user_preference':
        return <Users className="h-4 w-4" />;
      case 'event_pattern':
        return <Calendar className="h-4 w-4" />;
      case 'seasonal_trend':
        return <Calendar className="h-4 w-4" />;
      case 'location_preference':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'service_popularity':
        return 'bg-blue-100 text-blue-800';
      case 'user_preference':
        return 'bg-green-100 text-green-800';
      case 'event_pattern':
        return 'bg-purple-100 text-purple-800';
      case 'seasonal_trend':
        return 'bg-orange-100 text-orange-800';
      case 'location_preference':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatInsightData = (insight: LearningInsight) => {
    switch (insight.type) {
      case 'service_popularity':
        return {
          title: 'Service Popularity',
          description: `${insight.data.serviceId} has ${Math.round(insight.data.popularityScore * 100)}% positive feedback`,
          details: [
            `Total interactions: ${insight.data.totalInteractions}`,
            `Positive interactions: ${insight.data.positiveInteractions}`,
            `Confidence: ${Math.round(insight.confidence * 100)}%`,
          ],
        };
      case 'user_preference':
        return {
          title: 'User Preferences',
          description: `User shows preferences for specific service categories`,
          details: Object.entries(insight.data.categoryPreferences || {}).map(
            ([category, count]) => `${category}: ${count} selections`
          ),
        };
      case 'event_pattern':
        return {
          title: 'Event Patterns',
          description: `Common service combinations for ${insight.data.eventType} events`,
          details: Object.entries(insight.data.serviceCombinations || {})
            .slice(0, 5)
            .map(([combination, count]) => `${combination}: ${count} times`),
        };
      case 'seasonal_trend':
        return {
          title: 'Seasonal Trends',
          description: `Popular services during ${insight.data.season}`,
          details: Object.entries(insight.data.serviceData || {})
            .slice(0, 5)
            .map(([service, count]) => `${service}: ${count} selections`),
        };
      case 'location_preference':
        return {
          title: 'Location Preferences',
          description: `Popular services in ${insight.data.location}`,
          details: Object.entries(insight.data.serviceData || {})
            .slice(0, 5)
            .map(([service, count]) => `${service}: ${count} selections`),
        };
      default:
        return {
          title: 'Unknown Insight',
          description: 'No description available',
          details: [],
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Learning Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading learning data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Learning Analytics
            </CardTitle>
            <CardDescription>
              Insights from user interactions and behavior patterns
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadLearningData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Learning Statistics */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold">
                          {stats.totalInteractions}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Interactions
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold">
                          {stats.totalInsights}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Learning Insights
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold">
                          {Math.round(stats.averageConfidence * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg Confidence
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold">
                          {Object.keys(stats.insightsByType).length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Insight Types
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Insight Types Distribution */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Insight Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.insightsByType).map(
                      ([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {getInsightIcon(type)}
                            <span className="capitalize">
                              {type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={
                                ((count as number) / stats.totalInsights) * 100
                              }
                              className="w-20"
                            />
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4">
              {insights.map(insight => {
                const formatted = formatInsightData(insight);
                return (
                  <Card key={insight.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.type)}
                          <CardTitle className="text-lg">
                            {formatted.title}
                          </CardTitle>
                        </div>
                        <Badge className={getInsightColor(insight.type)}>
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <CardDescription>{formatted.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {formatted.details.map((detail, index) => (
                          <div
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            • {detail}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-xs text-muted-foreground">
                        Last updated:{' '}
                        {new Date(insight.updatedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Patterns</CardTitle>
                <CardDescription>
                  Discovered patterns from user behavior analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights
                    .filter(i => i.type === 'event_pattern')
                    .map(insight => (
                      <div key={insight.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">
                          {insight.data.eventType} Event Patterns
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(
                            insight.data.serviceCombinations || {}
                          )
                            .sort(
                              ([, a], [, b]) => (b as number) - (a as number)
                            )
                            .slice(0, 6)
                            .map(([combination, count]) => (
                              <div
                                key={combination}
                                className="flex justify-between text-sm"
                              >
                                <span>{combination}</span>
                                <Badge variant="outline">{count} times</Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Performance</CardTitle>
                <CardDescription>
                  How well the AI is learning from user interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Learning Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={stats?.averageConfidence * 100 || 0}
                        className="w-32"
                      />
                      <span className="text-sm font-medium">
                        {Math.round((stats?.averageConfidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Data Quality</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(
                          ((stats?.totalInteractions || 0) / 1000) * 100,
                          100
                        )}
                        className="w-32"
                      />
                      <span className="text-sm font-medium">
                        {Math.round(
                          Math.min(
                            ((stats?.totalInteractions || 0) / 1000) * 100,
                            100
                          )
                        )}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Insight Diversity</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(
                          (Object.keys(stats?.insightsByType || {}).length /
                            5) *
                            100,
                          100
                        )}
                        className="w-32"
                      />
                      <span className="text-sm font-medium">
                        {Math.round(
                          Math.min(
                            (Object.keys(stats?.insightsByType || {}).length /
                              5) *
                              100,
                            100
                          )
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
