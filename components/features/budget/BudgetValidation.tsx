'use client';

import React, { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  MapPin,
} from 'lucide-react';

interface BudgetValidation {
  is_valid: boolean;
  warnings: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    impact: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    potential_impact: number;
    priority: 'low' | 'medium' | 'high';
  }>;
  budget_health: {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    factors: Array<{
      factor: string;
      score: number;
      weight: number;
    }>;
  };
  compliance: {
    industry_standards: boolean;
    best_practices: boolean;
    risk_factors: string[];
  };
}

interface BudgetPlan {
  totalBudget: number;
  serviceBreakdown: any[];
  recommendations: any[];
  packages: any[];
  tracking: any[];
  adjustments: any[];
}

interface BudgetValidationProps {
  budgetPlan: BudgetPlan;
  onValidationUpdate?: (budget: any) => void;
}

export function BudgetValidation({
  budgetPlan,
  onValidationUpdate,
}: BudgetValidationProps) {
  const [validation, setValidation] = useState<BudgetValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Generate budget validation based on budget plan
  const generateValidation = (): BudgetValidation => {
    const warnings = [];
    const recommendations = [];
    const factors = [];

    // Budget size validation
    if (budgetPlan.totalBudget < 1000) {
      warnings.push({
        type: 'warning',
        message: 'Budget may be too low for a quality event',
        impact: 'high',
        suggestion: 'Consider increasing budget or reducing scope',
      });
    } else if (budgetPlan.totalBudget > 50000) {
      warnings.push({
        type: 'info',
        message: 'High budget detected - ensure proper planning',
        impact: 'medium',
        suggestion: 'Consider professional event planning services',
      });
    }

    // Service breakdown validation
    if (budgetPlan.serviceBreakdown.length === 0) {
      warnings.push({
        type: 'error',
        message: 'No service breakdown provided',
        impact: 'high',
        suggestion: 'Add service categories and estimated costs',
      });
    }

    // Budget distribution validation
    if (budgetPlan.serviceBreakdown.length > 0) {
      const totalBreakdown = budgetPlan.serviceBreakdown.reduce(
        (sum, item) => sum + item.estimated_cost,
        0
      );
      const variance = Math.abs(totalBreakdown - budgetPlan.totalBudget);

      if (variance > budgetPlan.totalBudget * 0.1) {
        warnings.push({
          type: 'warning',
          message: "Service breakdown doesn't match total budget",
          impact: 'medium',
          suggestion: 'Review and adjust service costs to match total budget',
        });
      }
    }

    // Package deals validation
    if (budgetPlan.packages.length > 0) {
      const totalPackageSavings = budgetPlan.packages.reduce(
        (sum, pkg) => sum + pkg.savings,
        0
      );
      if (totalPackageSavings > budgetPlan.totalBudget * 0.3) {
        warnings.push({
          type: 'info',
          message: 'High package savings detected',
          impact: 'low',
          suggestion: 'Verify package quality and vendor reliability',
        });
      }
    }

    // Budget tracking validation
    if (budgetPlan.tracking.length > 0) {
      const overBudgetItems = budgetPlan.tracking.filter(
        item => item.variance > 0
      );
      if (overBudgetItems.length > budgetPlan.tracking.length * 0.5) {
        warnings.push({
          type: 'warning',
          message: 'Multiple categories are over budget',
          impact: 'high',
          suggestion: 'Review estimates and adjust budget or scope',
        });
      }
    }

    // Generate recommendations
    if (budgetPlan.totalBudget > 5000 && budgetPlan.packages.length === 0) {
      recommendations.push({
        category: 'packages',
        title: 'Consider Package Deals',
        description: 'Look for bundled service packages to save money',
        potential_impact: Math.round(budgetPlan.totalBudget * 0.15),
        priority: 'medium',
      });
    }

    if (budgetPlan.serviceBreakdown.length < 3) {
      recommendations.push({
        category: 'planning',
        title: 'Expand Service Categories',
        description: 'Add more service categories for better budget planning',
        potential_impact: 0,
        priority: 'high',
      });
    }

    if (budgetPlan.tracking.length === 0) {
      recommendations.push({
        category: 'tracking',
        title: 'Start Budget Tracking',
        description: 'Begin tracking actual costs to improve future estimates',
        potential_impact: 0,
        priority: 'high',
      });
    }

    // Calculate budget health score
    let healthScore = 100;

    // Deduct points for warnings
    warnings.forEach(warning => {
      if (warning.type === 'error') healthScore -= 20;
      if (warning.type === 'warning') healthScore -= 10;
      if (warning.type === 'info') healthScore -= 5;
    });

    // Deduct points for missing elements
    if (budgetPlan.serviceBreakdown.length === 0) healthScore -= 30;
    if (budgetPlan.tracking.length === 0) healthScore -= 20;
    if (budgetPlan.packages.length === 0 && budgetPlan.totalBudget > 5000)
      healthScore -= 10;

    healthScore = Math.max(0, healthScore);

    const getHealthStatus = (score: number) => {
      if (score >= 90) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'fair';
      return 'poor';
    };

    const getHealthColor = (status: string) => {
      switch (status) {
        case 'excellent':
          return 'text-green-600';
        case 'good':
          return 'text-blue-600';
        case 'fair':
          return 'text-yellow-600';
        case 'poor':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    const getHealthIcon = (status: string) => {
      switch (status) {
        case 'excellent':
          return <CheckCircle className="h-4 w-4" />;
        case 'good':
          return <CheckCircle className="h-4 w-4" />;
        case 'fair':
          return <AlertTriangle className="h-4 w-4" />;
        case 'poor':
          return <AlertTriangle className="h-4 w-4" />;
        default:
          return <Info className="h-4 w-4" />;
      }
    };

    const healthStatus = getHealthStatus(healthScore);

    return {
      is_valid: warnings.filter(w => w.type === 'error').length === 0,
      warnings,
      recommendations,
      budget_health: {
        score: healthScore,
        status: healthStatus,
        factors: [
          {
            factor: 'Budget Completeness',
            score: budgetPlan.serviceBreakdown.length > 0 ? 100 : 0,
            weight: 0.3,
          },
          {
            factor: 'Cost Tracking',
            score: budgetPlan.tracking.length > 0 ? 100 : 0,
            weight: 0.2,
          },
          {
            factor: 'Package Optimization',
            score: budgetPlan.packages.length > 0 ? 100 : 0,
            weight: 0.2,
          },
          {
            factor: 'Budget Accuracy',
            score: Math.max(0, 100 - warnings.length * 10),
            weight: 0.3,
          },
        ],
      },
      compliance: {
        industry_standards: healthScore >= 70,
        best_practices: healthScore >= 80,
        risk_factors: warnings
          .filter(w => w.impact === 'high')
          .map(w => w.message),
      },
    };
  };

  React.useEffect(() => {
    const validationResult = generateValidation();
    setValidation(validationResult);
  }, [budgetPlan]);

  const getWarningColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  if (!validation) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>Generating budget validation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Budget Validation
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your budget plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  validation.budget_health.status === 'excellent'
                    ? 'text-green-600'
                    : validation.budget_health.status === 'good'
                      ? 'text-blue-600'
                      : validation.budget_health.status === 'fair'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                }`}
              >
                {validation.budget_health.score}
              </div>
              <div className="text-sm text-muted-foreground">Health Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {validation.warnings.length}
              </div>
              <div className="text-sm text-muted-foreground">Issues Found</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {validation.recommendations.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Recommendations
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Health Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Overall Health</span>
            </div>
            <Badge
              variant="outline"
              className={`${
                validation.budget_health.status === 'excellent'
                  ? 'text-green-600 border-green-600'
                  : validation.budget_health.status === 'good'
                    ? 'text-blue-600 border-blue-600'
                    : validation.budget_health.status === 'fair'
                      ? 'text-yellow-600 border-yellow-600'
                      : 'text-red-600 border-red-600'
              }`}
            >
              {validation.budget_health.status.charAt(0).toUpperCase() +
                validation.budget_health.status.slice(1)}
            </Badge>
          </div>

          <Progress value={validation.budget_health.score} className="h-3" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validation.budget_health.factors.map((factor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{factor.factor}</span>
                  <span className="text-sm text-muted-foreground">
                    {factor.score}%
                  </span>
                </div>
                <Progress value={factor.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warnings and Issues */}
      {validation.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Issues & Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation.warnings.map((warning, index) => (
              <Alert
                key={index}
                variant={warning.type === 'error' ? 'destructive' : 'default'}
              >
                {getWarningIcon(warning.type)}
                <AlertDescription>
                  <div className="font-medium">{warning.message}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {warning.suggestion}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {warning.impact} impact
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {warning.type}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {validation.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="space-y-2">
                  <div className="font-medium">{rec.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {rec.description}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Category:{' '}
                    {rec.category.charAt(0).toUpperCase() +
                      rec.category.slice(1)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority} priority
                  </Badge>
                  {rec.potential_impact > 0 && (
                    <Badge variant="outline" className="text-green-600">
                      ${rec.potential_impact.toLocaleString()} impact
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Industry Standards</span>
                <Badge
                  variant={
                    validation.compliance.industry_standards
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {validation.compliance.industry_standards
                    ? 'Compliant'
                    : 'Non-compliant'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Best Practices</span>
                <Badge
                  variant={
                    validation.compliance.best_practices
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {validation.compliance.best_practices
                    ? 'Following'
                    : 'Needs Improvement'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Risk Factors</div>
              <div className="space-y-1">
                {validation.compliance.risk_factors.length > 0 ? (
                  validation.compliance.risk_factors.map((risk, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {risk}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-green-600">
                    No high-risk factors identified
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Budget Status</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Budget</span>
                  <span className="font-medium">
                    ${budgetPlan.totalBudget.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Service Categories</span>
                  <span className="font-medium">
                    {budgetPlan.serviceBreakdown.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Package Deals</span>
                  <span className="font-medium">
                    {budgetPlan.packages.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tracking Items</span>
                  <span className="font-medium">
                    {budgetPlan.tracking.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Health Factors</h4>
              <div className="space-y-1">
                {validation.budget_health.factors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{factor.factor}</span>
                    <span className="font-medium">{factor.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
