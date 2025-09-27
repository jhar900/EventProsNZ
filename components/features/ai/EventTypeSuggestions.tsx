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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  EventTypeSuggestionEngine,
  EventTypeContext,
  EventTypeSuggestion,
} from '@/lib/ai/event-type-suggestions';
import { ServiceRecommendation } from '@/components/features/ai/ServiceRecommendations';
import { ServicePriorityIndicator } from '@/components/features/ai/ServicePriorityIndicator';
import {
  Loader2,
  Lightbulb,
  Users,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
} from 'lucide-react';

interface EventTypeSuggestionsProps {
  onEventTypeSelect?: (suggestion: EventTypeSuggestion) => void;
  onServiceSelect?: (service: ServiceRecommendation) => void;
  initialContext?: Partial<EventTypeContext>;
}

export function EventTypeSuggestions({
  onEventTypeSelect,
  onServiceSelect,
  initialContext = {},
}: EventTypeSuggestionsProps) {
  const [context, setContext] = useState<EventTypeContext>({
    description: '',
    guestCount: undefined,
    budget: undefined,
    location: '',
    date: '',
    timeOfDay: undefined,
    season: undefined,
    formality: undefined,
    indoorOutdoor: undefined,
    ...initialContext,
  });

  const [suggestions, setSuggestions] = useState<EventTypeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<EventTypeSuggestion | null>(null);

  // Generate suggestions when context changes
  useEffect(() => {
    if (context.description || context.guestCount || context.budget) {
      generateSuggestions();
    }
  }, [context]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const newSuggestions =
        await EventTypeSuggestionEngine.suggestEventType(context);
      setSuggestions(newSuggestions);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const handleContextChange = (field: keyof EventTypeContext, value: any) => {
    setContext(prev => ({ ...prev, [field]: value }));
  };

  const handleSuggestionSelect = (suggestion: EventTypeSuggestion) => {
    setSelectedSuggestion(suggestion);
    onEventTypeSelect?.(suggestion);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-100 text-green-800';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.7) return 'High Confidence';
    if (confidence >= 0.4) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="space-y-6">
      {/* Context Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Tell Us About Your Event
          </CardTitle>
          <CardDescription>
            Provide some details about your event to get personalized
            recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Event Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your event (e.g., 'Wedding ceremony and reception for 100 guests')"
                value={context.description || ''}
                onChange={e =>
                  handleContextChange('description', e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestCount">Guest Count</Label>
              <Input
                id="guestCount"
                type="number"
                placeholder="Number of guests"
                value={context.guestCount || ''}
                onChange={e =>
                  handleContextChange(
                    'guestCount',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (NZD)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Your budget"
                value={context.budget || ''}
                onChange={e =>
                  handleContextChange(
                    'budget',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City or region"
                value={context.location || ''}
                onChange={e => handleContextChange('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeOfDay">Time of Day</Label>
              <Select
                value={context.timeOfDay || ''}
                onValueChange={value => handleContextChange('timeOfDay', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time of day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formality">Formality Level</Label>
              <Select
                value={context.formality || ''}
                onValueChange={value => handleContextChange('formality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select formality level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="semi-formal">Semi-Formal</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="black-tie">Black Tie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateSuggestions}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Get Event Type Suggestions'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Event Type Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Event Type Suggestions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <Card
                key={suggestion.eventType}
                data-testid="suggestion-card"
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedSuggestion?.eventType === suggestion.eventType
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">
                      {suggestion.eventType}
                    </CardTitle>
                    <Badge
                      className={getConfidenceColor(suggestion.confidence)}
                    >
                      {Math.round(suggestion.confidence * 100)}%{' '}
                      {getConfidenceText(suggestion.confidence)}
                    </Badge>
                  </div>
                  <CardDescription>{suggestion.reasoning}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>
                        {suggestion.guestCountRange.min}-
                        {suggestion.guestCountRange.max} guests
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>
                        {suggestion.duration.min}-{suggestion.duration.max}h
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>
                        ${suggestion.estimatedBudget.min.toLocaleString()}-$
                        {suggestion.estimatedBudget.max.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{suggestion.estimatedBudget.currency}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="font-medium text-sm mb-2">
                      Recommended Services:
                    </h4>
                    <div className="space-y-1">
                      {suggestion.suggestedServices.slice(0, 3).map(service => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{service.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {service.priority}
                          </Badge>
                        </div>
                      ))}
                      {suggestion.suggestedServices.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{suggestion.suggestedServices.length - 3} more
                          services
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Selected Event Type Details */}
      {selectedSuggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">
              {selectedSuggestion.eventType} Event Details
            </CardTitle>
            <CardDescription>
              Complete service recommendations for your{' '}
              {selectedSuggestion.eventType} event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedSuggestion.guestCountRange.min}-
                  {selectedSuggestion.guestCountRange.max}
                </div>
                <div className="text-sm text-gray-600">Expected Guests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${selectedSuggestion.estimatedBudget.min.toLocaleString()}-$
                  {selectedSuggestion.estimatedBudget.max.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Estimated Budget</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedSuggestion.duration.min}-
                  {selectedSuggestion.duration.max}h
                </div>
                <div className="text-sm text-gray-600">Event Duration</div>
              </div>
            </div>

            {/* Service Recommendations */}
            <div>
              <h4 className="font-semibold mb-3">Recommended Services</h4>
              <div className="space-y-2">
                {selectedSuggestion.suggestedServices.map(service => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <ServicePriorityIndicator
                        service={service}
                        variant="compact"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onServiceSelect?.(service)}
                    >
                      Add Service
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Type Tips */}
            <div>
              <h4 className="font-semibold mb-3">Planning Tips</h4>
              <ul className="space-y-2">
                {EventTypeSuggestionEngine.getEventTypeTips(
                  selectedSuggestion.eventType
                ).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
