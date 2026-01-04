'use client';

import React, { useState, useEffect } from 'react';
import {
  useEventData,
  useServiceRequirements,
  useBudgetPlan,
  useEventCreationStore,
} from '@/stores/event-creation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Star,
  CheckCircle,
  AlertTriangle,
  Edit,
  Eye,
  Loader2,
} from 'lucide-react';
import { ContractorMatch } from '@/types/events';
import { format } from 'date-fns';

export function EventReviewStep() {
  const eventData = useEventData();
  const serviceRequirements = useServiceRequirements();
  const budgetPlan = useBudgetPlan();
  const { contractorMatches, isLoading } = useEventCreationStore();

  const [matches, setMatches] = useState<ContractorMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Fetch contractor matches from API
  useEffect(() => {
    if (serviceRequirements.length > 0) {
      setIsLoadingMatches(true);

      const fetchMatches = async () => {
        try {
          const response = await fetch('/api/events/match-contractors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              serviceRequirements: serviceRequirements.map(req => ({
                category: req.category,
                priority: req.priority,
                estimatedBudget: req.estimatedBudget,
              })),
              location: eventData.location?.address,
              eventDate: eventData.eventDate,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch contractor matches');
          }

          const data = await response.json();
          if (data.success) {
            setMatches(data.matches || []);
          } else {
            console.error('Error fetching matches:', data.error);
            setMatches([]);
          }
        } catch (error) {
          console.error('Error fetching contractor matches:', error);
          setMatches([]);
        } finally {
          setIsLoadingMatches(false);
        }
      };

      fetchMatches();
    } else {
      setMatches([]);
    }
  }, [serviceRequirements, eventData.location, eventData.eventDate]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return dateString;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Review Your Event</h3>
        <p className="text-sm text-muted-foreground">
          Review all the details before creating your event and finding
          contractors.
        </p>
      </div>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {eventData.eventType?.replace('_', ' ')}
                </Badge>
              </div>
              <h4 className="font-semibold text-lg">{eventData.title}</h4>
              {eventData.description && (
                <p className="text-muted-foreground">{eventData.description}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {eventData.eventDate
                    ? formatDate(eventData.eventDate)
                    : 'No date set'}
                </span>
              </div>

              {eventData.durationHours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {eventData.durationHours} hours
                  </span>
                </div>
              )}

              {eventData.attendeeCount && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {eventData.attendeeCount} attendees
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {eventData.location?.address || 'No location set'}
                </span>
              </div>
            </div>
          </div>

          {eventData.specialRequirements && (
            <div className="pt-4 border-t">
              <h5 className="font-medium mb-2">Special Requirements</h5>
              <p className="text-sm text-muted-foreground">
                {eventData.specialRequirements}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Service Requirements</CardTitle>
          <CardDescription>
            {serviceRequirements.length} service
            {serviceRequirements.length !== 1 ? 's' : ''} needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serviceRequirements.length > 0 ? (
            <div className="space-y-3">
              {serviceRequirements.map((requirement, index) => (
                <div
                  key={requirement.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="capitalize">
                        {requirement.category.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor(requirement.priority)}`}
                      >
                        {getPriorityIcon(requirement.priority)}{' '}
                        {requirement.priority}
                      </Badge>
                      {requirement.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <h5 className="font-medium">{requirement.type}</h5>
                    {requirement.description && (
                      <p className="text-sm text-muted-foreground">
                        {requirement.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {requirement.estimatedBudget && (
                      <div className="font-medium">
                        ${requirement.estimatedBudget.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No service requirements added
            </p>
          )}
        </CardContent>
      </Card>

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total Budget:</span>
              <span>${budgetPlan.totalBudget.toLocaleString()} NZD</span>
            </div>

            {Object.keys(budgetPlan.breakdown).length > 0 && (
              <div className="space-y-2">
                <Separator />
                <h5 className="font-medium">Budget Breakdown:</h5>
                {Object.entries(budgetPlan.breakdown).map(
                  ([category, item]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize">
                        {category.replace('_', ' ')}
                      </span>
                      <span>
                        ${item.amount.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contractor Matches Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Potential Contractor Matches
          </CardTitle>
          <CardDescription>
            We&apos;ve found some contractors that match your requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMatches ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Finding matching contractors...</span>
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-3">
              {matches.slice(0, 3).map(match => (
                <div
                  key={match.contractorId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium">{match.contractorName}</h5>
                      <Badge variant="outline" className="capitalize">
                        {match.serviceCategory.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        {match.rating} ({match.reviewCount} reviews)
                      </div>
                      <div>
                        ${match.estimatedPrice.min.toLocaleString()} - $
                        {match.estimatedPrice.max.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      {Math.round(match.matchScore * 100)}% match
                    </div>
                    {match.availability && (
                      <div className="text-xs text-green-600">Available</div>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Matches
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No contractor matches found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Final Notes */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Ready to create your event?</strong> Once you submit,
          we&apos;ll start matching you with contractors and you&apos;ll be able
          to manage your event from your dashboard.
        </AlertDescription>
      </Alert>
    </div>
  );
}
