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
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Users, BarChart3 } from 'lucide-react';

interface QueryData {
  query: string;
  search_count: number;
  unique_users: number;
  avg_results: number;
  date: string;
}

interface QueryAnalyticsProps {
  timePeriod: string;
  className?: string;
}

export default function QueryAnalytics({
  timePeriod,
  className,
}: QueryAnalyticsProps) {
  const [queries, setQueries] = useState<QueryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQueries, setFilteredQueries] = useState<QueryData[]>([]);

  const fetchQueryAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/search/queries?period=${timePeriod}&limit=50`
      );
      const data = await response.json();

      if (data.queries) {
        setQueries(data.queries);
        setFilteredQueries(data.queries);
      }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueryAnalytics();
  }, [timePeriod]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = queries.filter(query =>
        query.query.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQueries(filtered);
    } else {
      setFilteredQueries(queries);
    }
  }, [searchTerm, queries]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getQueryTrend = (query: QueryData) => {
    // Simple trend calculation based on search count
    if (query.search_count > 100) return 'high';
    if (query.search_count > 50) return 'medium';
    return 'low';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Queries
            </CardTitle>
            <CardDescription>
              Most popular search terms and their performance
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueryAnalytics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQueries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No search queries found for the selected period.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueries.slice(0, 20).map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {query.query}
                        </span>
                        <Badge
                          variant="outline"
                          className={getTrendColor(getQueryTrend(query))}
                        >
                          {getQueryTrend(query)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {formatNumber(query.search_count)} searches
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatNumber(query.unique_users)} users
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {query.avg_results.toFixed(1)} avg results
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredQueries.length > 20 && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All {filteredQueries.length} Queries
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
