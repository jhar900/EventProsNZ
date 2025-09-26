'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { ContractorPerformanceResult } from '@/types/matching';

interface PerformanceIntegrationProps {
  contractorId: string;
}

export function PerformanceIntegration({
  contractorId,
}: PerformanceIntegrationProps) {
  const [performance, setPerformance] =
    useState<ContractorPerformanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractorId) {
      fetchPerformance();
    }
  }, [contractorId]);

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/matching/performance?contractor_id=${contractorId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const data = await response.json();
      setPerformance(data.performance);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch performance data'
      );
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Poor';
  };

  const getResponseTimeColor = (hours: number) => {
    if (hours < 4) return 'text-green-600';
    if (hours < 12) return 'text-yellow-600';
    if (hours < 24) return 'text-orange-600';
    return 'text-red-600';
  };

  const getResponseTimeLabel = (hours: number) => {
    if (hours < 4) return 'Very Fast';
    if (hours < 12) return 'Fast';
    if (hours < 24) return 'Moderate';
    if (hours < 48) return 'Slow';
    return 'Very Slow';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.9) return 'text-green-600';
    if (rate >= 0.8) return 'text-yellow-600';
    if (rate >= 0.7) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceItems = [
    {
      label: 'Response Time',
      value: `${performance.response_time_hours.toFixed(1)} hours`,
      score: Math.max(0, 1 - performance.response_time_hours / 48),
      description: 'Average time to respond to inquiries',
    },
    {
      label: 'Reliability',
      value: `${Math.round(performance.reliability_score * 100)}%`,
      score: performance.reliability_score,
      description: 'Consistency in meeting commitments',
    },
    {
      label: 'Quality',
      value: `${Math.round(performance.quality_score * 100)}%`,
      score: performance.quality_score,
      description: 'Quality of work and deliverables',
    },
    {
      label: 'Communication',
      value: `${Math.round(performance.communication_score * 100)}%`,
      score: performance.communication_score,
      description: 'Communication effectiveness and clarity',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Performance Score */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Star className="h-5 w-5" />
            <span className="text-2xl font-bold">
              {Math.round(performance.overall_performance_score * 100)}%
            </span>
          </div>
          <p
            className={`text-lg font-medium ${getScoreColor(performance.overall_performance_score)}`}
          >
            {getScoreLabel(performance.overall_performance_score)}
          </p>
          <Progress
            value={performance.overall_performance_score * 100}
            className="h-3"
          />
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold">{performance.total_projects}</p>
            <p className="text-sm text-muted-foreground">Total Projects</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold">
              {performance.successful_projects}
            </p>
            <p className="text-sm text-muted-foreground">Successful</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Success Rate</span>
            <span
              className={`font-bold ${getSuccessRateColor(performance.success_rate)}`}
            >
              {Math.round(performance.success_rate * 100)}%
            </span>
          </div>
          <Progress value={performance.success_rate * 100} className="h-2" />
        </div>

        {/* Performance Breakdown */}
        <div className="space-y-4">
          <h3 className="font-semibold">Performance Breakdown</h3>
          {performanceItems.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.label}</span>
                <span className={`font-medium ${getScoreColor(item.score)}`}>
                  {item.value}
                </span>
              </div>
              <Progress value={item.score * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Response Time Analysis */}
        <div className="space-y-2">
          <h3 className="font-semibold">Response Time Analysis</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Average Response Time</span>
            </div>
            <div className="text-right">
              <p
                className={`font-bold ${getResponseTimeColor(performance.response_time_hours)}`}
              >
                {performance.response_time_hours.toFixed(1)} hours
              </p>
              <p className="text-sm text-muted-foreground">
                {getResponseTimeLabel(performance.response_time_hours)}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <h3 className="font-semibold">Performance Recommendations</h3>
          <div className="space-y-1">
            {performance.overall_performance_score >= 0.8 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm text-green-600">
                    ✓ Excellent performance record! This contractor has a strong
                    track record
                  </p>
                </AlertDescription>
              </Alert>
            ) : performance.overall_performance_score >= 0.6 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm text-yellow-600">
                    ⚠ Good performance record with room for improvement
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm text-red-600">
                    ⚠ Performance record needs improvement
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {performance.response_time_hours > 24 && (
              <p className="text-sm text-amber-600">
                • Consider response time expectations for urgent requests
              </p>
            )}

            {performance.reliability_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Discuss reliability expectations and backup plans
              </p>
            )}

            {performance.quality_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Review quality standards and expectations upfront
              </p>
            )}

            {performance.communication_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Establish clear communication protocols and expectations
              </p>
            )}

            {performance.success_rate < 0.8 && (
              <p className="text-sm text-amber-600">
                • Consider the contractor&apos;s learning curve and improvement
                potential
              </p>
            )}
          </div>
        </div>

        {/* Performance Tips */}
        <div className="space-y-2">
          <h3 className="font-semibold">Performance Tips</h3>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              • Review past project portfolios and case studies
            </p>
            <p className="text-sm text-muted-foreground">
              • Ask for references from similar events
            </p>
            <p className="text-sm text-muted-foreground">
              • Discuss performance metrics and expectations
            </p>
            <p className="text-sm text-muted-foreground">
              • Establish clear success criteria and milestones
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
