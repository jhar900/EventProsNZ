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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  DollarSign,
  Edit,
  Save,
  X,
  BarChart3,
} from 'lucide-react';

interface BudgetTracking {
  id: string;
  service_category: string;
  estimated_cost: number;
  actual_cost: number;
  variance: number;
  tracking_date: string;
}

interface BudgetInsights {
  total_estimated: number;
  total_actual: number;
  total_variance: number;
  variance_percentage: number;
  categories_tracked: number;
  accuracy_score: number;
  cost_savings: Array<{
    category: string;
    savings: number;
    savings_percentage: number;
  }>;
  over_budget_categories: Array<{
    category: string;
    overage: number;
    overage_percentage: number;
  }>;
  recommendations: Array<{
    type: string;
    message: string;
    action: string;
  }>;
}

interface BudgetTrackingProps {
  tracking: BudgetTracking[];
  totalBudget: number;
  onTrackingUpdate?: (budget: any) => void;
}

export function BudgetTracking({
  tracking,
  totalBudget,
  onTrackingUpdate,
}: BudgetTrackingProps) {
  const [trackingData, setTrackingData] = useState<BudgetTracking[]>(tracking);
  const [insights, setInsights] = useState<BudgetInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    if (tracking) {
      setTrackingData(tracking);
      calculateInsights();
    }
  }, [tracking]);

  const calculateInsights = () => {
    if (!trackingData || trackingData.length === 0) return;

    const totalEstimated = trackingData.reduce(
      (sum, item) => sum + item.estimated_cost,
      0
    );
    const totalActual = trackingData.reduce(
      (sum, item) => sum + item.actual_cost,
      0
    );
    const totalVariance = totalActual - totalEstimated;
    const variancePercentage =
      totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

    // Calculate accuracy score
    const accuracyScores = trackingData.map(item => {
      if (!item.estimated_cost || item.estimated_cost === 0) return 0;
      const variance = Math.abs(item.variance);
      const accuracy = Math.max(0, 1 - variance / item.estimated_cost);
      return accuracy;
    });
    const accuracyScore =
      accuracyScores.length > 0
        ? accuracyScores.reduce((sum, score) => sum + score, 0) /
          accuracyScores.length
        : 0;

    // Identify cost savings and over-budget categories
    const costSavings = trackingData
      .filter(item => item.variance < 0)
      .map(item => ({
        category: item.service_category,
        savings: Math.abs(item.variance),
        savings_percentage: item.estimated_cost
          ? Math.abs(item.variance / item.estimated_cost) * 100
          : 0,
      }))
      .sort((a, b) => b.savings - a.savings);

    const overBudgetCategories = trackingData
      .filter(item => item.variance > 0)
      .map(item => ({
        category: item.service_category,
        overage: item.variance,
        overage_percentage: item.estimated_cost
          ? (item.variance / item.estimated_cost) * 100
          : 0,
      }))
      .sort((a, b) => b.overage - a.overage);

    // Generate recommendations
    const recommendations = [];

    if (variancePercentage > 10) {
      recommendations.push({
        type: 'warning',
        message: `Budget is ${variancePercentage.toFixed(1)}% over estimated costs`,
        action: 'Review and adjust future estimates',
      });
    } else if (variancePercentage < -10) {
      recommendations.push({
        type: 'success',
        message: `Budget is ${Math.abs(variancePercentage).toFixed(1)}% under estimated costs`,
        action: 'Consider increasing budget for better quality services',
      });
    }

    if (accuracyScore < 0.7) {
      recommendations.push({
        type: 'improvement',
        message: 'Budget estimates could be more accurate',
        action:
          'Use historical data and contractor quotes for better estimates',
      });
    }

    if (overBudgetCategories.length > 0) {
      recommendations.push({
        type: 'alert',
        message: `${overBudgetCategories.length} categories are over budget`,
        action: 'Review over-budget categories and adjust future estimates',
      });
    }

    setInsights({
      total_estimated: totalEstimated,
      total_actual: totalActual,
      total_variance: totalVariance,
      variance_percentage: variancePercentage,
      categories_tracked: trackingData.length,
      accuracy_score: accuracyScore,
      cost_savings: costSavings,
      over_budget_categories: overBudgetCategories,
      recommendations,
    });
  };

  const handleEditStart = (item: BudgetTracking) => {
    setEditingItem(item.id);
    setEditValue(item.actual_cost);
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditValue(0);
  };

  const handleEditSave = async (item: BudgetTracking) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/budget/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: 'current-event', // This should be passed as a prop
          service_category: item.service_category,
          actual_cost: editValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onTrackingUpdate?.(data);
        setEditingItem(null);
        calculateInsights();
      }
    } catch (error) {
      console.error('Error updating tracking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const getVarianceLabel = (variance: number) => {
    if (variance > 0)
      return `Over budget by $${Math.abs(variance).toLocaleString()}`;
    if (variance < 0)
      return `Under budget by $${Math.abs(variance).toLocaleString()}`;
    return 'On budget';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!trackingData || trackingData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No budget tracking data available. Start tracking actual costs to
              see insights.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Tracking Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Budget Tracking Overview
          </CardTitle>
          <CardDescription>
            Track actual costs against estimated budgets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${insights?.total_estimated.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Estimated
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${insights?.total_actual.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Actual</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getVarianceColor(insights?.total_variance || 0)}`}
              >
                ${Math.abs(insights?.total_variance || 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Variance
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((insights?.accuracy_score || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Accuracy Score
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Health Alerts */}
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <div className="space-y-2">
          {insights.recommendations.map((rec, index) => (
            <Alert
              key={index}
              variant={rec.type === 'warning' ? 'destructive' : 'default'}
            >
              {rec.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : rec.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-medium">{rec.message}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {rec.action}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Tracking Items */}
      <div className="grid gap-4">
        {trackingData.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">
                  {item.service_category.replace('_', ' ')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {formatDate(item.tracking_date)}
                  </Badge>
                  <Badge
                    variant={item.variance > 0 ? 'destructive' : 'default'}
                    className={
                      item.variance < 0 ? 'bg-green-100 text-green-800' : ''
                    }
                  >
                    {item.variance > 0
                      ? 'Over Budget'
                      : item.variance < 0
                        ? 'Under Budget'
                        : 'On Budget'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cost Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Estimated Cost
                  </Label>
                  <div className="text-xl font-bold text-blue-600">
                    ${item.estimated_cost.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Actual Cost
                  </Label>
                  <div className="flex items-center gap-2">
                    {editingItem === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={e =>
                            setEditValue(parseFloat(e.target.value) || 0)
                          }
                          className="w-32"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(item)}
                          disabled={isLoading}
                          aria-label="Save changes"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditCancel}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-green-600">
                          ${item.actual_cost.toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStart(item)}
                          aria-label="Edit actual cost"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Variance
                  </Label>
                  <div
                    className={`flex items-center gap-1 ${getVarianceColor(item.variance)}`}
                  >
                    {getVarianceIcon(item.variance)}
                    <span className="text-xl font-bold">
                      ${Math.abs(item.variance).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getVarianceLabel(item.variance)}
                  </div>
                </div>
              </div>

              {/* Variance Analysis */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Variance Analysis</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.estimated_cost > 0
                        ? `${((item.actual_cost / item.estimated_cost) * 100).toFixed(1)}% of estimated`
                        : 'No estimate'}
                    </span>
                  </div>
                </div>
                <Progress
                  value={
                    item.estimated_cost > 0
                      ? (item.actual_cost / item.estimated_cost) * 100
                      : 0
                  }
                  className="h-2 mt-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Cost Savings</h4>
                <div className="space-y-1">
                  {insights.cost_savings.slice(0, 3).map((saving, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">
                        {saving.category.replace('_', ' ')}
                      </span>
                      <span className="font-medium text-green-600">
                        ${saving.savings.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Over Budget Categories</h4>
                <div className="space-y-1">
                  {insights.over_budget_categories
                    .slice(0, 3)
                    .map((overage, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="capitalize">
                          {overage.category.replace('_', ' ')}
                        </span>
                        <span className="font-medium text-red-600">
                          ${overage.overage.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
