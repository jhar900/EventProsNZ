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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Filter,
  Star,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Plus,
  Minus,
  Info,
  Lightbulb,
} from 'lucide-react';
import { ServicePriorityIndicator } from './ServicePriorityIndicator';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  priority: number;
  confidence: number;
  is_required: boolean;
  estimated_cost_percentage: number;
  typical_duration_hours: number;
  best_practices: string[];
  related_categories: string[];
  industry_insights: string;
}

interface ServiceCategorySuggestionsProps {
  eventType: string;
  onCategorySelect?: (category: ServiceCategory) => void;
  selectedCategories?: string[];
  className?: string;
}

// Pre-defined service categories with industry insights
const SERVICE_CATEGORIES = {
  wedding: [
    {
      id: 'photography',
      name: 'Photography & Videography',
      description:
        'Professional photography and videography services to capture your special day',
      priority: 5,
      confidence: 0.95,
      is_required: true,
      estimated_cost_percentage: 0.15,
      typical_duration_hours: 8,
      best_practices: [
        'Book 6-12 months in advance',
        'Review portfolio and style preferences',
        'Discuss shot list and timeline',
        'Consider engagement session',
      ],
      related_categories: ['venue', 'catering', 'flowers'],
      industry_insights:
        'Photography is consistently rated as the most important service by couples, with 95% including it in their wedding budget.',
    },
    {
      id: 'catering',
      name: 'Catering',
      description: 'Food and beverage services for your wedding reception',
      priority: 5,
      confidence: 0.95,
      is_required: true,
      estimated_cost_percentage: 0.3,
      typical_duration_hours: 4,
      best_practices: [
        'Taste test before booking',
        'Consider dietary restrictions',
        'Plan for 10-15% more guests than expected',
        'Discuss service style (buffet vs plated)',
      ],
      related_categories: ['venue', 'photography', 'music'],
      industry_insights:
        'Catering typically accounts for 30% of wedding budgets and is often the largest single expense.',
    },
    {
      id: 'venue',
      name: 'Venue',
      description: 'Wedding ceremony and reception venue',
      priority: 5,
      confidence: 0.95,
      is_required: true,
      estimated_cost_percentage: 0.4,
      typical_duration_hours: 12,
      best_practices: [
        'Book 9-12 months in advance',
        'Visit venue during same season as wedding',
        'Check capacity and layout options',
        'Understand included services and restrictions',
      ],
      related_categories: ['catering', 'photography', 'decorations'],
      industry_insights:
        'Venue selection often determines the overall style and budget for the entire wedding.',
    },
    {
      id: 'music',
      name: 'Music & Entertainment',
      description:
        'DJ, live music, or entertainment for ceremony and reception',
      priority: 4,
      confidence: 0.9,
      is_required: true,
      estimated_cost_percentage: 0.05,
      typical_duration_hours: 6,
      best_practices: [
        'Listen to samples or attend events',
        'Discuss music preferences and do-not-play list',
        'Coordinate with venue for setup requirements',
        'Plan ceremony music separately from reception',
      ],
      related_categories: ['venue', 'catering', 'photography'],
      industry_insights:
        'Music sets the tone for the entire event and is crucial for guest engagement.',
    },
    {
      id: 'flowers',
      name: 'Flowers & Decorations',
      description: 'Floral arrangements and decorative elements',
      priority: 4,
      confidence: 0.85,
      is_required: true,
      estimated_cost_percentage: 0.05,
      typical_duration_hours: 2,
      best_practices: [
        'Choose seasonal flowers for cost savings',
        'Consider venue decoration needs',
        'Plan for ceremony and reception flowers',
        'Discuss preservation options',
      ],
      related_categories: ['venue', 'photography', 'catering'],
      industry_insights:
        'Flowers can transform any space and are essential for creating the desired atmosphere.',
    },
    {
      id: 'wedding_planner',
      name: 'Wedding Planner',
      description: 'Full-service wedding planning and coordination',
      priority: 3,
      confidence: 0.8,
      is_required: false,
      estimated_cost_percentage: 0.1,
      typical_duration_hours: 200,
      best_practices: [
        'Hire early in planning process',
        'Discuss services and responsibilities',
        'Check references and portfolio',
        'Understand fee structure',
      ],
      related_categories: ['venue', 'catering', 'photography', 'music'],
      industry_insights:
        'Wedding planners can save couples 10-15 hours per week and often negotiate better vendor rates.',
    },
  ],
  corporate: [
    {
      id: 'venue',
      name: 'Event Venue',
      description: 'Professional venue for corporate events and meetings',
      priority: 5,
      confidence: 0.95,
      is_required: true,
      estimated_cost_percentage: 0.35,
      typical_duration_hours: 8,
      best_practices: [
        'Book 3-6 months in advance',
        'Consider accessibility and parking',
        'Check AV capabilities',
        'Review catering options',
      ],
      related_categories: ['catering', 'av_equipment', 'event_management'],
      industry_insights:
        'Venue selection is critical for corporate events as it sets the professional tone and accommodates business needs.',
    },
    {
      id: 'catering',
      name: 'Corporate Catering',
      description: 'Professional catering services for business events',
      priority: 4,
      confidence: 0.9,
      is_required: true,
      estimated_cost_percentage: 0.25,
      typical_duration_hours: 4,
      best_practices: [
        'Consider dietary restrictions',
        'Plan for networking breaks',
        'Choose professional presentation',
        'Coordinate with event timeline',
      ],
      related_categories: ['venue', 'av_equipment', 'event_management'],
      industry_insights:
        'Corporate catering should support networking and maintain professional standards throughout the event.',
    },
    {
      id: 'av_equipment',
      name: 'AV Equipment & Technology',
      description: 'Audio-visual equipment and technical support',
      priority: 5,
      confidence: 0.95,
      is_required: true,
      estimated_cost_percentage: 0.15,
      typical_duration_hours: 8,
      best_practices: [
        'Test all equipment beforehand',
        'Have backup plans for technical issues',
        'Consider hybrid/virtual components',
        'Ensure professional presentation quality',
      ],
      related_categories: ['venue', 'event_management', 'catering'],
      industry_insights:
        'AV equipment is essential for modern corporate events and can make or break the professional presentation.',
    },
    {
      id: 'event_management',
      name: 'Event Management',
      description: 'Full-service event coordination and management',
      priority: 4,
      confidence: 0.9,
      is_required: true,
      estimated_cost_percentage: 0.15,
      typical_duration_hours: 100,
      best_practices: [
        'Hire experienced corporate event planners',
        'Establish clear communication protocols',
        'Plan for contingencies',
        'Coordinate with all vendors',
      ],
      related_categories: ['venue', 'catering', 'av_equipment'],
      industry_insights:
        'Professional event management ensures smooth execution and reflects well on the company brand.',
    },
  ],
  birthday: [
    {
      id: 'venue',
      name: 'Party Venue',
      description: 'Location for birthday celebration',
      priority: 4,
      confidence: 0.85,
      is_required: true,
      estimated_cost_percentage: 0.3,
      typical_duration_hours: 4,
      best_practices: [
        'Consider age-appropriate venues',
        'Check capacity and amenities',
        'Plan for decorations and setup',
        'Consider weather alternatives',
      ],
      related_categories: ['catering', 'entertainment', 'decorations'],
      industry_insights:
        'Venue choice depends heavily on the age of the birthday person and party style preferences.',
    },
    {
      id: 'catering',
      name: 'Party Catering',
      description: 'Food and drinks for birthday celebration',
      priority: 4,
      confidence: 0.9,
      is_required: true,
      estimated_cost_percentage: 0.25,
      typical_duration_hours: 3,
      best_practices: [
        'Consider age-appropriate food',
        'Plan for dietary restrictions',
        'Include birthday cake',
        'Consider themed food options',
      ],
      related_categories: ['venue', 'entertainment', 'decorations'],
      industry_insights:
        'Food is a central element of birthday celebrations and should match the party theme and age group.',
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      description: 'Activities and entertainment for the party',
      priority: 4,
      confidence: 0.85,
      is_required: true,
      estimated_cost_percentage: 0.2,
      typical_duration_hours: 3,
      best_practices: [
        'Choose age-appropriate entertainment',
        'Plan for different activity levels',
        'Consider party games and activities',
        'Have backup plans for weather',
      ],
      related_categories: ['venue', 'catering', 'decorations'],
      industry_insights:
        'Entertainment is crucial for keeping guests engaged and creating memorable experiences.',
    },
    {
      id: 'decorations',
      name: 'Decorations & Theming',
      description: 'Party decorations and themed elements',
      priority: 3,
      confidence: 0.8,
      is_required: true,
      estimated_cost_percentage: 0.15,
      typical_duration_hours: 2,
      best_practices: [
        'Choose cohesive theme',
        'Consider age-appropriate decorations',
        'Plan for photo opportunities',
        'Coordinate with venue restrictions',
      ],
      related_categories: ['venue', 'catering', 'entertainment'],
      industry_insights:
        'Decorations set the mood and create the perfect backdrop for birthday photos and memories.',
    },
  ],
};

export function ServiceCategorySuggestions({
  eventType,
  onCategorySelect,
  selectedCategories = [],
  className = '',
}: ServiceCategorySuggestionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    const eventCategories =
      SERVICE_CATEGORIES[eventType as keyof typeof SERVICE_CATEGORIES] || [];
    setCategories(eventCategories);
  }, [eventType]);

  const filteredCategories = categories.filter(category => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      filterPriority === null || category.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const handleCategorySelect = (category: ServiceCategory) => {
    onCategorySelect?.(category);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return 'bg-red-100 text-red-800 border-red-200';
      case 4:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 1:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Service Categories</h3>
          <p className="text-muted-foreground">
            Industry-standard service categories for {eventType} events
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInsights(!showInsights)}
        >
          <Info className="h-4 w-4 mr-2" />
          {showInsights ? 'Hide' : 'Show'} Insights
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Categories</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search service categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <Label htmlFor="priority">Filter by Priority</Label>
          <select
            id="priority"
            value={filterPriority || ''}
            onChange={e =>
              setFilterPriority(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">All Priorities</option>
            <option value="5">Priority 5 (Critical)</option>
            <option value="4">Priority 4 (High)</option>
            <option value="3">Priority 3 (Medium)</option>
            <option value="2">Priority 2 (Low)</option>
            <option value="1">Priority 1 (Optional)</option>
          </select>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map(category => (
          <Card
            key={category.id}
            className={`transition-all duration-200 hover:shadow-md ${
              selectedCategories.includes(category.id)
                ? 'ring-2 ring-primary'
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getPriorityColor(category.priority)}>
                    Priority {category.priority}
                  </Badge>
                  {category.is_required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Confidence Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Confidence
                </span>
                <span
                  className={`text-sm font-medium ${getConfidenceColor(category.confidence)}`}
                >
                  {Math.round(category.confidence * 100)}%
                </span>
              </div>

              {/* Cost Percentage */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Typical Budget
                </span>
                <span className="text-sm font-medium">
                  {Math.round(category.estimated_cost_percentage * 100)}%
                </span>
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {category.typical_duration_hours}h
                </span>
              </div>

              {/* Best Practices Preview */}
              {category.best_practices.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Best Practices</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {category.best_practices
                      .slice(0, 2)
                      .map((practice, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {practice}
                        </li>
                      ))}
                    {category.best_practices.length > 2 && (
                      <li className="text-primary text-xs">
                        +{category.best_practices.length - 2} more practices
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Industry Insights */}
              {showInsights && category.industry_insights && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">
                      Industry Insight
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {category.industry_insights}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!selectedCategories.includes(category.id) ? (
                  <Button
                    size="sm"
                    onClick={() => handleCategorySelect(category)}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Handle category removal
                      console.log('Remove category:', category.id);
                    }}
                    className="flex-1"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      {filteredCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {filteredCategories.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Categories
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredCategories.filter(c => c.is_required).length}
                </div>
                <div className="text-sm text-muted-foreground">Required</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(
                    (filteredCategories.reduce(
                      (sum, c) => sum + c.confidence,
                      0
                    ) /
                      filteredCategories.length) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Confidence
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    filteredCategories.reduce(
                      (sum, c) => sum + c.estimated_cost_percentage,
                      0
                    ) * 100
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Budget
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {filteredCategories.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No service categories found matching your search criteria.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
