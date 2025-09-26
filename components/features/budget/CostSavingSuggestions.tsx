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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Star,
  Clock,
  Users,
  MapPin,
} from 'lucide-react';

interface CostSavingSuggestion {
  id: string;
  category: string;
  title: string;
  description: string;
  potential_savings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  time_to_implement: string;
  requirements: string[];
  risks: string[];
  alternatives: string[];
}

interface BudgetPlan {
  totalBudget: number;
  serviceBreakdown: any[];
  recommendations: any[];
  packages: any[];
  tracking: any[];
  adjustments: any[];
}

interface CostSavingSuggestionsProps {
  budgetPlan: BudgetPlan;
  onSuggestionApply?: (budget: any) => void;
}

export function CostSavingSuggestions({
  budgetPlan,
  onSuggestionApply,
}: CostSavingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CostSavingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(
    new Set()
  );

  // Generate cost-saving suggestions based on budget plan
  const generateSuggestions = (): CostSavingSuggestion[] => {
    const suggestions: CostSavingSuggestion[] = [];

    // Analyze budget plan to generate suggestions
    if (budgetPlan.totalBudget > 10000) {
      suggestions.push({
        id: 'package-deals',
        category: 'packages',
        title: 'Consider Package Deals',
        description:
          'Bundle multiple services together for significant savings. Many vendors offer package deals for weddings and corporate events.',
        potential_savings: Math.round(budgetPlan.totalBudget * 0.15),
        difficulty: 'easy',
        impact: 'high',
        time_to_implement: '1-2 weeks',
        requirements: [
          'Multiple service categories',
          'Flexible vendor selection',
        ],
        risks: ['Limited vendor choice', 'Potential quality compromise'],
        alternatives: ['Individual vendor negotiations', 'Seasonal discounts'],
      });
    }

    if (budgetPlan.serviceBreakdown.some(item => item.estimated_cost > 2000)) {
      suggestions.push({
        id: 'vendor-negotiation',
        category: 'negotiation',
        title: 'Negotiate with Vendors',
        description:
          'Contact vendors directly to negotiate better rates, especially for high-cost services like catering or photography.',
        potential_savings: Math.round(budgetPlan.totalBudget * 0.08),
        difficulty: 'medium',
        impact: 'medium',
        time_to_implement: '2-3 weeks',
        requirements: ['Direct vendor contact', 'Flexible timeline'],
        risks: ['Vendor availability', 'Quality concerns'],
        alternatives: ['Multiple vendor quotes', 'Off-season booking'],
      });
    }

    if (budgetPlan.totalBudget > 5000) {
      suggestions.push({
        id: 'off-season',
        category: 'timing',
        title: 'Consider Off-Season Booking',
        description:
          'Book during off-peak seasons (winter, weekdays) for significant savings on venues and services.',
        potential_savings: Math.round(budgetPlan.totalBudget * 0.2),
        difficulty: 'easy',
        impact: 'high',
        time_to_implement: 'Immediate',
        requirements: ['Flexible event date', 'Weather considerations'],
        risks: ['Weather dependency', 'Guest availability'],
        alternatives: ['Weekday events', 'Indoor venues'],
      });
    }

    if (budgetPlan.serviceBreakdown.length > 3) {
      suggestions.push({
        id: 'service-consolidation',
        category: 'optimization',
        title: 'Consolidate Services',
        description:
          'Combine similar services or use multi-service vendors to reduce costs and simplify coordination.',
        potential_savings: Math.round(budgetPlan.totalBudget * 0.1),
        difficulty: 'medium',
        impact: 'medium',
        time_to_implement: '1-2 weeks',
        requirements: ['Service analysis', 'Vendor research'],
        risks: ['Quality variation', 'Coordination complexity'],
        alternatives: ['Service prioritization', 'DIY options'],
      });
    }

    if (budgetPlan.totalBudget > 3000) {
      suggestions.push({
        id: 'guest-reduction',
        category: 'scale',
        title: 'Optimize Guest List',
        description:
          'Review guest list to focus on essential attendees. Each guest adds to catering, venue, and other costs.',
        potential_savings: Math.round(budgetPlan.totalBudget * 0.12),
        difficulty: 'hard',
        impact: 'high',
        time_to_implement: '1 week',
        requirements: ['Guest list review', 'Family discussions'],
        risks: ['Relationship impact', 'Event atmosphere'],
        alternatives: ['Tiered guest lists', 'Virtual components'],
      });
    }

    if (
      budgetPlan.serviceBreakdown.some(
        item => item.service_category === 'decorations'
      )
    ) {
      suggestions.push({
        id: 'diy-decorations',
        category: 'diy',
        title: 'DIY Decorations',
        description:
          'Create your own decorations or enlist help from crafty friends and family to save on decoration costs.',
        potential_savings: Math.round(budgetPlan.totalBudget * 0.05),
        difficulty: 'medium',
        impact: 'low',
        time_to_implement: '2-4 weeks',
        requirements: ['Craft skills', 'Time investment'],
        risks: ['Quality control', 'Time constraints'],
        alternatives: ['Rental decorations', 'Simple arrangements'],
      });
    }

    return suggestions;
  };

  const handleApplySuggestion = (suggestionId: string) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestionId]));
    // Here you would implement the actual suggestion application logic
    onSuggestionApply?.(budgetPlan);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'packages':
        return <DollarSign className="h-4 w-4" />;
      case 'negotiation':
        return <Users className="h-4 w-4" />;
      case 'timing':
        return <Clock className="h-4 w-4" />;
      case 'optimization':
        return <Star className="h-4 w-4" />;
      case 'scale':
        return <Users className="h-4 w-4" />;
      case 'diy':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  React.useEffect(() => {
    const generatedSuggestions = generateSuggestions();
    setSuggestions(generatedSuggestions);
  }, [budgetPlan]);

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No cost-saving suggestions available. Add more budget details to
              get personalized recommendations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cost Saving Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Cost-Saving Suggestions
          </CardTitle>
          <CardDescription>
            Personalized recommendations to help you save money on your event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {suggestions.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Available Suggestions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                $
                {suggestions
                  .reduce((sum, s) => sum + s.potential_savings, 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Potential Savings
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {suggestions.filter(s => s.difficulty === 'easy').length}
              </div>
              <div className="text-sm text-muted-foreground">
                Easy to Implement
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      <div className="grid gap-4">
        {suggestions.map(suggestion => (
          <Card
            key={suggestion.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(suggestion.difficulty)}>
                    {suggestion.difficulty.charAt(0).toUpperCase() +
                      suggestion.difficulty.slice(1)}
                  </Badge>
                  <Badge className={getImpactColor(suggestion.impact)}>
                    {suggestion.impact.charAt(0).toUpperCase() +
                      suggestion.impact.slice(1)}{' '}
                    Impact
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div className="text-sm text-muted-foreground">
                {suggestion.description}
              </div>

              {/* Savings Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${suggestion.potential_savings.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Potential Savings
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {suggestion.time_to_implement}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Time to Implement
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {suggestion.category.charAt(0).toUpperCase() +
                      suggestion.category.slice(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Category</div>
                </div>
              </div>

              {/* Requirements and Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {suggestion.requirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Risks</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {suggestion.risks.map((risk, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Alternatives */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Alternatives</h4>
                <div className="flex flex-wrap gap-2">
                  {suggestion.alternatives.map((alt, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {alt}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => handleApplySuggestion(suggestion.id)}
                  disabled={appliedSuggestions.has(suggestion.id)}
                  className="w-full md:w-auto"
                >
                  {appliedSuggestions.has(suggestion.id) ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Lightbulb className="h-4 w-4 mr-2" />
                  )}
                  {appliedSuggestions.has(suggestion.id)
                    ? 'Applied'
                    : 'Apply Suggestion'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Top Savings Opportunities</h4>
              <div className="space-y-1">
                {suggestions
                  .sort((a, b) => b.potential_savings - a.potential_savings)
                  .slice(0, 3)
                  .map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">
                        {index + 1}. {suggestion.title}
                      </span>
                      <span className="font-medium text-green-600">
                        ${suggestion.potential_savings.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Easy to Implement</h4>
              <div className="space-y-1">
                {suggestions
                  .filter(s => s.difficulty === 'easy')
                  .slice(0, 3)
                  .map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">
                        {index + 1}. {suggestion.title}
                      </span>
                      <span className="font-medium text-blue-600">
                        {suggestion.time_to_implement}
                      </span>
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
