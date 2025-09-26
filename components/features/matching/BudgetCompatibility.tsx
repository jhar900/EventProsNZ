'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { BudgetCompatibility } from '@/types/matching';

interface BudgetCompatibilityProps {
  eventId: string;
  contractorId: string;
}

export function BudgetCompatibilityComponent({
  eventId,
  contractorId,
}: BudgetCompatibilityProps) {
  const [budgetCompatibility, setBudgetCompatibility] =
    useState<BudgetCompatibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId && contractorId) {
      fetchBudgetCompatibility();
    }
  }, [eventId, contractorId]);

  const fetchBudgetCompatibility = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/matching/budget?event_id=${eventId}&contractor_id=${contractorId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch budget compatibility');
      }

      const data = await response.json();
      setBudgetCompatibility(data.budget_compatibility);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch budget compatibility'
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

  const getBudgetRangeMatchColor = (match: boolean) => {
    return match ? 'text-green-600' : 'text-red-600';
  };

  const getBudgetRangeMatchIcon = (match: boolean) => {
    return match ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Calculating budget compatibility...</span>
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

  if (!budgetCompatibility) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No budget compatibility data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const compatibilityItems = [
    {
      label: 'Budget Range Match',
      value: budgetCompatibility.budget_range_match,
      score: budgetCompatibility.budget_range_match ? 1 : 0,
      description: 'Contractor pricing fits within your budget range',
    },
    {
      label: 'Price Affordability',
      value: `${Math.round(budgetCompatibility.price_affordability * 100)}%`,
      score: budgetCompatibility.price_affordability,
      description: "How affordable the contractor's pricing is for your budget",
    },
    {
      label: 'Value Score',
      value: `${Math.round(budgetCompatibility.value_score * 100)}%`,
      score: budgetCompatibility.value_score,
      description: 'Value proposition based on pricing and quality',
    },
    {
      label: 'Budget Flexibility',
      value: `${Math.round(budgetCompatibility.budget_flexibility * 100)}%`,
      score: budgetCompatibility.budget_flexibility,
      description: "Contractor's flexibility with pricing and payment terms",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Budget Compatibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="h-5 w-5" />
            <span className="text-2xl font-bold">
              {Math.round(budgetCompatibility.overall_score * 100)}%
            </span>
          </div>
          <p
            className={`text-lg font-medium ${getScoreColor(budgetCompatibility.overall_score)}`}
          >
            {getScoreLabel(budgetCompatibility.overall_score)}
          </p>
          <Progress
            value={budgetCompatibility.overall_score * 100}
            className="h-3"
          />
        </div>

        {/* Budget Range Match */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getBudgetRangeMatchIcon(budgetCompatibility.budget_range_match)}
              <span className="font-medium">Budget Range Match</span>
            </div>
            <Badge
              variant={
                budgetCompatibility.budget_range_match
                  ? 'default'
                  : 'destructive'
              }
            >
              {budgetCompatibility.budget_range_match ? 'Match' : 'No Match'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {budgetCompatibility.budget_range_match
              ? 'Contractor pricing fits within your budget range'
              : 'Contractor pricing is outside your budget range'}
          </p>
        </div>

        {/* Compatibility Breakdown */}
        <div className="space-y-4">
          <h3 className="font-semibold">Compatibility Breakdown</h3>
          {compatibilityItems.slice(1).map((item, index) => (
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

        {/* Recommendations */}
        <div className="space-y-2">
          <h3 className="font-semibold">Budget Recommendations</h3>
          <div className="space-y-1">
            {budgetCompatibility.budget_range_match ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm text-green-600">
                    ✓ Contractor pricing fits within your budget range
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm text-red-600">
                    ✗ Contractor pricing is outside your budget range
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {budgetCompatibility.price_affordability < 0.7 && (
              <p className="text-sm text-amber-600">
                • Consider negotiating pricing or looking for alternatives
              </p>
            )}

            {budgetCompatibility.value_score < 0.7 && (
              <p className="text-sm text-amber-600">
                • Evaluate if the pricing provides good value for the services
                offered
              </p>
            )}

            {budgetCompatibility.budget_flexibility < 0.7 && (
              <p className="text-sm text-amber-600">
                • Discuss payment terms and flexibility with the contractor
              </p>
            )}

            {budgetCompatibility.overall_score >= 0.8 && (
              <p className="text-sm text-green-600">
                • Excellent budget compatibility! This contractor fits well
                within your budget
              </p>
            )}
          </div>
        </div>

        {/* Budget Tips */}
        <div className="space-y-2">
          <h3 className="font-semibold">Budget Tips</h3>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              • Consider the total value, not just the price
            </p>
            <p className="text-sm text-muted-foreground">
              • Factor in additional costs like travel and materials
            </p>
            <p className="text-sm text-muted-foreground">
              • Discuss payment terms and schedule upfront
            </p>
            <p className="text-sm text-muted-foreground">
              • Ask about package deals or discounts for multiple services
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
