'use client';

import React, { useState, useEffect } from 'react';
import {
  useBudgetPlan,
  useServiceRequirements,
  useEventCreationStore,
} from '@/stores/event-creation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Target,
  Lightbulb,
} from 'lucide-react';
import { BudgetPlan, BudgetRecommendation } from '@/types/events';

export function BudgetPlanningStep() {
  const budgetPlan = useBudgetPlan();
  const serviceRequirements = useServiceRequirements();
  const { updateBudgetPlan } = useEventCreationStore();

  const [totalBudget, setTotalBudget] = useState(budgetPlan.totalBudget || 0);
  const [breakdown, setBreakdown] = useState(budgetPlan.breakdown || {});
  const [recommendations, setRecommendations] = useState<
    BudgetRecommendation[]
  >([]);

  // Generate budget recommendations based on service requirements
  useEffect(() => {
    if (serviceRequirements.length > 0 && totalBudget > 0) {
      const newRecommendations = generateBudgetRecommendations(
        serviceRequirements,
        totalBudget
      );
      setRecommendations(newRecommendations);
    }
  }, [serviceRequirements, totalBudget]);

  // Update budget plan when values change
  useEffect(() => {
    updateBudgetPlan({
      totalBudget,
      breakdown,
      recommendations,
    });
  }, [totalBudget, breakdown, recommendations, updateBudgetPlan]);

  const generateBudgetRecommendations = (
    requirements: any[],
    totalBudget: number
  ): BudgetRecommendation[] => {
    const categoryBudgets: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: number } = {};

    // Count requirements by category
    requirements.forEach(req => {
      if (req.category) {
        categoryCounts[req.category] = (categoryCounts[req.category] || 0) + 1;
      }
    });

    // Generate recommendations based on typical budget allocations
    const typicalAllocations: { [key: string]: number } = {
      catering: 0.35,
      venue: 0.25,
      photography: 0.15,
      music: 0.1,
      decorations: 0.1,
      entertainment: 0.08,
      transportation: 0.05,
      av_equipment: 0.05,
      security: 0.03,
      cleaning: 0.02,
      flowers: 0.08,
      cake: 0.05,
      other: 0.05,
    };

    const recommendations: BudgetRecommendation[] = [];

    Object.entries(categoryCounts).forEach(([category, count]) => {
      const allocation = typicalAllocations[category] || 0.05;
      const suggestedAmount = Math.round(totalBudget * allocation);

      if (suggestedAmount > 0) {
        recommendations.push({
          category,
          suggestedAmount,
          reason: getRecommendationReason(category, count, suggestedAmount),
          confidence: getConfidenceLevel(category, count),
        });
      }
    });

    return recommendations.sort(
      (a, b) => b.suggestedAmount - a.suggestedAmount
    );
  };

  const getRecommendationReason = (
    category: string,
    count: number,
    amount: number
  ): string => {
    const reasons: { [key: string]: string } = {
      catering: `Based on typical catering costs for ${count} service${count > 1 ? 's' : ''}`,
      venue: 'Venue rental typically represents 20-30% of total budget',
      photography:
        'Professional photography is essential for capturing memories',
      music: 'Music and entertainment create the right atmosphere',
      decorations: 'Decorations enhance the visual appeal of your event',
      entertainment: 'Entertainment keeps guests engaged and entertained',
      transportation: 'Transportation ensures smooth logistics',
      av_equipment: 'Audio-visual equipment is crucial for presentations',
      security: 'Security provides peace of mind for large events',
      cleaning: 'Cleaning services ensure venue is spotless',
      flowers: 'Floral arrangements add beauty and elegance',
      cake: 'Special desserts are a memorable part of celebrations',
      other: 'Additional services to enhance your event',
    };

    return reasons[category] || 'Recommended based on industry standards';
  };

  const getConfidenceLevel = (category: string, count: number): number => {
    // Higher confidence for categories with more requirements
    const baseConfidence = 0.7;
    const countBonus = Math.min(count * 0.1, 0.3);
    return Math.min(baseConfidence + countBonus, 1.0);
  };

  const handleTotalBudgetChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setTotalBudget(numValue);

    // Auto-generate breakdown based on recommendations
    if (numValue > 0 && recommendations.length > 0) {
      const newBreakdown: {
        [key: string]: { amount: number; percentage: number };
      } = {};

      recommendations.forEach(rec => {
        const percentage = (rec.suggestedAmount / numValue) * 100;
        newBreakdown[rec.category] = {
          amount: rec.suggestedAmount,
          percentage: Math.round(percentage * 100) / 100,
        };
      });

      setBreakdown(newBreakdown);
    }
  };

  const handleBreakdownChange = (category: string, amount: number) => {
    const newBreakdown = { ...breakdown };
    const percentage = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;

    newBreakdown[category] = {
      amount,
      percentage: Math.round(percentage * 100) / 100,
    };

    setBreakdown(newBreakdown);
  };

  const getTotalAllocated = () => {
    return Object.values(breakdown).reduce((sum, item) => sum + item.amount, 0);
  };

  const getRemainingBudget = () => {
    return totalBudget - getTotalAllocated();
  };

  const getBudgetStatus = () => {
    const allocated = getTotalAllocated();
    const remaining = getRemainingBudget();

    if (remaining < 0) {
      return {
        status: 'over',
        message: 'Budget exceeded',
        color: 'text-red-600',
      };
    } else if (remaining === 0) {
      return {
        status: 'exact',
        message: 'Budget fully allocated',
        color: 'text-green-600',
      };
    } else {
      return {
        status: 'under',
        message: `${remaining.toLocaleString()} remaining`,
        color: 'text-blue-600',
      };
    }
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Set Your Budget</h3>
        <p className="text-sm text-muted-foreground">
          Plan your budget and get intelligent recommendations based on your
          service requirements.
        </p>
      </div>

      {/* Total Budget Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Event Budget
          </CardTitle>
          <CardDescription>
            Enter your total budget for the event in NZD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter total budget"
                value={totalBudget || ''}
                onChange={e => handleTotalBudgetChange(e.target.value)}
                className="pl-10 text-lg"
                min="0"
              />
            </div>

            {totalBudget > 0 && (
              <div className="text-sm text-muted-foreground">
                Budget: ${totalBudget.toLocaleString()} NZD
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Budget Recommendations
            </CardTitle>
            <CardDescription>
              Based on your service requirements and industry standards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {rec.category.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(rec.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm mt-1">{rec.reason}</p>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    ${rec.suggestedAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round((rec.suggestedAmount / totalBudget) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Budget Breakdown */}
      {totalBudget > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Budget Breakdown
            </CardTitle>
            <CardDescription>
              Allocate your budget across different service categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(breakdown).map(([category, item]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="capitalize">
                    {category.replace('_', ' ')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.percentage}%
                    </span>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={e =>
                        handleBreakdownChange(
                          category,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-24 text-right"
                      min="0"
                    />
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}

            {/* Budget Status */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Allocated:</span>
                <span className="font-medium">
                  ${getTotalAllocated().toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Remaining:</span>
                <span className={`font-medium ${budgetStatus.color}`}>
                  ${getRemainingBudget().toLocaleString()}
                </span>
              </div>

              {budgetStatus.status === 'over' && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your budget allocation exceeds your total budget. Please
                    adjust the amounts.
                  </AlertDescription>
                </Alert>
              )}

              {budgetStatus.status === 'exact' && (
                <Alert className="mt-2">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Perfect! Your budget is fully allocated.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Tips */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Budget Tips:</strong> Consider setting aside 10-15% of your
          total budget for unexpected expenses. Get quotes from multiple
          contractors to ensure you&apos;re getting the best value.
        </AlertDescription>
      </Alert>
    </div>
  );
}
