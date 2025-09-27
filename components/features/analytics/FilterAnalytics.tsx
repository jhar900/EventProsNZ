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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Users, BarChart3, TrendingUp } from 'lucide-react';

interface FilterData {
  filter_type: string;
  filter_value: string;
  usage_count: number;
  unique_users: number;
  date: string;
}

interface FilterPattern {
  filter_type: string;
  combination_count: number;
  effectiveness_score: number;
  usage_trend: string;
}

interface FilterAnalyticsProps {
  timePeriod: string;
  className?: string;
}

export default function FilterAnalytics({
  timePeriod,
  className,
}: FilterAnalyticsProps) {
  const [filters, setFilters] = useState<FilterData[]>([]);
  const [patterns, setPatterns] = useState<FilterPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilterType, setSelectedFilterType] = useState('all');

  const fetchFilterAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/search/filters?period=${timePeriod}`
      );
      const data = await response.json();

      if (data.filters) {
        setFilters(data.filters);
      }
      if (data.usage_patterns) {
        setPatterns(data.usage_patterns);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterAnalytics();
  }, [timePeriod]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getFilterTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      service_type: 'bg-blue-100 text-blue-800',
      location: 'bg-green-100 text-green-800',
      price_range: 'bg-yellow-100 text-yellow-800',
      rating: 'bg-purple-100 text-purple-800',
      availability: 'bg-orange-100 text-orange-800',
      portfolio: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getFilterTypeIcon = (type: string) => {
    switch (type) {
      case 'service_type':
        return '🔧';
      case 'location':
        return '📍';
      case 'price_range':
        return '💰';
      case 'rating':
        return '⭐';
      case 'availability':
        return '📅';
      case 'portfolio':
        return '🖼️';
      default:
        return '🔍';
    }
  };

  const filteredFilters =
    selectedFilterType === 'all'
      ? filters
      : filters.filter(filter => filter.filter_type === selectedFilterType);

  const filterTypes = Array.from(new Set(filters.map(f => f.filter_type)));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Usage Analytics
            </CardTitle>
            <CardDescription>
              Most used filters and their effectiveness
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFilterAnalytics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedFilterType}
            onValueChange={setSelectedFilterType}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Filter Types</SelectItem>
              {filterTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getFilterTypeIcon(type)}{' '}
                  {type.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Usage Statistics */}
            <div className="space-y-4">
              <h4 className="font-medium">Most Used Filters</h4>
              {filteredFilters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No filter data found for the selected period.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFilters.slice(0, 15).map((filter, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {getFilterTypeIcon(filter.filter_type)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {filter.filter_value}
                            </span>
                            <Badge
                              variant="outline"
                              className={getFilterTypeColor(filter.filter_type)}
                            >
                              {filter.filter_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {formatNumber(filter.usage_count)} uses
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {formatNumber(filter.unique_users)} users
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Patterns */}
            {patterns.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Filter Usage Patterns</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {patterns.slice(0, 6).map((pattern, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {pattern.filter_type.replace('_', ' ')}
                        </span>
                        <Badge variant="outline">
                          {pattern.effectiveness_score.toFixed(1)}% effective
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {pattern.combination_count} combinations
                        </div>
                        <div className="mt-1">
                          Trend:{' '}
                          <span className="capitalize">
                            {pattern.usage_trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredFilters.length > 15 && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All {filteredFilters.length} Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
