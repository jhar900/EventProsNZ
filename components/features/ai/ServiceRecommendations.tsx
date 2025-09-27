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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Target,
  Settings,
  BarChart3,
} from 'lucide-react';
import { ServiceCategorySuggestions } from './ServiceCategorySuggestions';
import { ServiceTemplates } from './ServiceTemplates';
import { ServicePriorityIndicator } from './ServicePriorityIndicator';
import { ServiceCustomization } from './ServiceCustomization';
import { AITestingPanel } from './AITestingPanel';
import { UserPreferencesPanel } from './UserPreferencesPanel';
import { RecommendationAnalytics } from './RecommendationAnalytics';
import { EventTypeSuggestions } from './EventTypeSuggestions';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';

interface ServiceRecommendation {
  id: string;
  service_name: string;
  category: string;
  priority: number;
  confidence_score: number;
  is_required: boolean;
  description: string;
  estimated_cost?: number;
  created_at: string;
}

interface ServiceRecommendationsProps {
  eventType?: string;
  eventData?: {
    attendee_count?: number;
    budget?: number;
    location?: string;
    event_date?: string;
  };
  onServiceSelect?: (service: ServiceRecommendation) => void;
  onServiceRemove?: (serviceId: string) => void;
  selectedServices?: string[];
  className?: string;
  showEventTypeSuggestions?: boolean;
}

export function ServiceRecommendations({
  eventType,
  eventData,
  onServiceSelect,
  onServiceRemove,
  selectedServices = [],
  className = '',
  showEventTypeSuggestions = false,
}: ServiceRecommendationsProps) {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showABTesting, setShowABTesting] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    eventType || null
  );

  // Debug logging
  const {
    recommendations,
    templates,
    userPreferences,
    abTests,
    learningData,
    isLoading,
    error,
    getRecommendations,
    learnFromEvent,
    updatePreferences,
    runABTest,
    getConfidenceScores,
    saveTemplate,
    loadTemplates,
  } = useAIRecommendations();

  useEffect(() => {
    if (eventType && eventType !== selectedEventType) {
      setSelectedEventType(eventType);
    }
  }, [eventType]);

  useEffect(() => {
    if (selectedEventType) {
      getRecommendations(selectedEventType, eventData);
    }
  }, [selectedEventType, eventData]);

  const handleServiceFeedback = async (
    serviceId: string,
    feedback: 'positive' | 'negative',
    rating: number
  ) => {
    try {
      const response = await fetch('/api/ai/service-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendation_id: serviceId,
          feedback_type: feedback,
          rating,
        }),
      });

      if (response.ok) {
        // Update local state or trigger refresh
        }
    } catch (error) {
      }
  };

  const handleServiceSelect = (service: ServiceRecommendation) => {
    onServiceSelect?.(service);
  };

  const handleServiceRemove = (serviceId: string) => {
    onServiceRemove?.(serviceId);
  };

  const handleEventTypeSelect = (suggestion: any) => {
    setSelectedEventType(suggestion.eventType);
    setActiveTab('recommendations');
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
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div
        className={`space-y-4 ${className} flex items-center justify-center`}
        data-testid="loading-skeleton"
      >
        <LoadingSpinner />
        <span className="ml-2">Loading recommendations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load service recommendations. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Service Recommendations
          </h2>
          <p className="text-muted-foreground">
            Intelligent suggestions for your {selectedEventType || 'event'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreferences(!showPreferences)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Event Data Summary */}
      {eventData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {eventData.attendee_count && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {eventData.attendee_count} attendees
                  </span>
                </div>
              )}
              {eventData.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    ${eventData.budget.toLocaleString()} budget
                  </span>
                </div>
              )}
              {eventData.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{eventData.location}</span>
                </div>
              )}
              {eventData.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(eventData.event_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Type Suggestions */}
      {showEventTypeSuggestions && !selectedEventType && (
        <EventTypeSuggestions
          onEventTypeSelect={handleEventTypeSelect}
          onServiceSelect={onServiceSelect}
          initialContext={eventData}
        />
      )}

      {/* Main Content Tabs */}
      {}
      {selectedEventType && (
        <div data-testid="tabs-section">
          <p>DEBUG: Tabs should render here</p>
          <div>
            <button>Recommendations</button>
            <button>Categories</button>
            <button>Templates</button>
            <button>Customization</button>
          </div>
          <div>
            {/* Service Recommendation Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map(service => (
                <Card
                  key={service.id}
                  className={`transition-all duration-200 hover:shadow-md ${
                    selectedServices.includes(service.id)
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {service.service_name}
                        </CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getPriorityColor(service.priority)}>
                          Priority {service.priority}
                        </Badge>
                        {service.is_required && (
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
                        className={`text-sm font-medium ${getConfidenceColor(service.confidence_score)}`}
                      >
                        {Math.round(service.confidence_score * 100)}%
                      </span>
                    </div>

                    {/* Estimated Cost */}
                    {service.estimated_cost && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Est. Cost
                        </span>
                        <span className="text-sm font-medium">
                          ${service.estimated_cost.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!selectedServices.includes(service.id) ? (
                        <Button
                          size="sm"
                          onClick={() => handleServiceSelect(service)}
                          className="flex-1"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Service
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleServiceRemove(service.id)}
                          className="flex-1"
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Feedback Buttons */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleServiceFeedback(service.id, 'positive', 5)
                        }
                        className="flex-1"
                        aria-label="thumbs up"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleServiceFeedback(service.id, 'negative', 1)
                        }
                        className="flex-1"
                        aria-label="thumbs down"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Summary */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {recommendations.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Services
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {recommendations.filter(s => s.is_required).length}
                </div>
                <div className="text-sm text-muted-foreground">Required</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(
                    (recommendations.reduce(
                      (sum, s) => sum + s.confidence_score,
                      0
                    ) /
                      recommendations.length) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Confidence
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  $
                  {recommendations
                    .filter(s => s.estimated_cost)
                    .reduce((sum, s) => sum + (s.estimated_cost || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Est. Total Cost
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Panel */}
      {showAnalytics && (
        <RecommendationAnalytics
          eventType={selectedEventType}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Preferences Panel */}
      {showPreferences && (
        <UserPreferencesPanel onClose={() => setShowPreferences(false)} />
      )}

      {/* A/B Testing Panel */}
      {showABTesting && (
        <AITestingPanel onClose={() => setShowABTesting(false)} />
      )}
    </div>
  );
}
