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
import { TrendingUp, Search, Users, Calendar } from 'lucide-react';

interface TrendingTerm {
  query: string;
  search_count: number;
  unique_users: number;
  avg_results: number;
  date: string;
}

interface TrendingService {
  service_category: string;
  search_count: number;
  unique_users: number;
  date: string;
}

interface TrendingTermsProps {
  timePeriod: string;
  className?: string;
}

export default function TrendingTerms({
  timePeriod,
  className,
}: TrendingTermsProps) {
  const [trendingTerms, setTrendingTerms] = useState<TrendingTerm[]>([]);
  const [trendingServices, setTrendingServices] = useState<TrendingService[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrendingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/search/trending?period=${timePeriod}&limit=20`
      );
      const data = await response.json();

      if (data.trending_terms) {
        setTrendingTerms(data.trending_terms);
      }
      if (data.trending_services) {
        setTrendingServices(data.trending_services);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData();
  }, [timePeriod]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendLevel = (count: number, maxCount: number) => {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };

  const getTrendColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (category: string) => {
    const icons: Record<string, string> = {
      photography: '📸',
      catering: '🍽️',
      music: '🎵',
      decorations: '🎨',
      venue: '🏢',
      transportation: '🚗',
      planning: '📋',
      entertainment: '🎭',
      florist: '🌸',
      lighting: '💡',
    };
    return icons[category.toLowerCase()] || '🔧';
  };

  const maxTermCount = Math.max(...trendingTerms.map(t => t.search_count), 1);
  const maxServiceCount = Math.max(
    ...trendingServices.map(s => s.search_count),
    1
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Search Terms
            </CardTitle>
            <CardDescription>
              Most popular search queries and service categories
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrendingData}
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
            {/* Trending Search Terms */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                Popular Search Queries
              </h4>
              {trendingTerms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trending search terms found for the selected period.
                </div>
              ) : (
                <div className="space-y-3">
                  {trendingTerms.slice(0, 10).map((term, index) => {
                    const trendLevel = getTrendLevel(
                      term.search_count,
                      maxTermCount
                    );
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{term.query}</span>
                              <Badge
                                variant="outline"
                                className={getTrendColor(trendLevel)}
                              >
                                {trendLevel} trend
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Search className="h-3 w-3" />
                                {formatNumber(term.search_count)} searches
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {formatNumber(term.unique_users)} users
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {term.avg_results.toFixed(1)} avg results
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trending Service Categories */}
            {trendingServices.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Popular Service Categories
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {trendingServices.slice(0, 8).map((service, index) => {
                    const trendLevel = getTrendLevel(
                      service.search_count,
                      maxServiceCount
                    );
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getServiceIcon(service.service_category)}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {service.service_category.replace('_', ' ')}
                              </span>
                              <Badge
                                variant="outline"
                                className={getTrendColor(trendLevel)}
                              >
                                {trendLevel}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatNumber(service.search_count)} searches •{' '}
                              {formatNumber(service.unique_users)} users
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trending Insights */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Trending Insights</h4>
              <div className="space-y-2 text-sm">
                {trendingTerms.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">📈</span>
                    <span>
                      Top trending term:{' '}
                      <strong>&ldquo;{trendingTerms[0]?.query}&rdquo;</strong>{' '}
                      with {formatNumber(trendingTerms[0]?.search_count)}{' '}
                      searches
                    </span>
                  </div>
                )}
                {trendingServices.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">🏆</span>
                    <span>
                      Most popular service:{' '}
                      <strong>
                        {trendingServices[0]?.service_category.replace(
                          '_',
                          ' '
                        )}
                      </strong>
                    </span>
                  </div>
                )}
                {trendingTerms.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600">💡</span>
                    <span>
                      Consider featuring trending services in search suggestions
                      and recommendations
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
