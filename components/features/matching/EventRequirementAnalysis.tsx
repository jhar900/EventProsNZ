'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Users, DollarSign, Clock, Star } from 'lucide-react';

interface EventRequirementAnalysisProps {
  eventId: string;
}

interface EventDetails {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  budget_total: number;
  event_type: string;
  duration_hours: number;
  attendee_count: number;
  special_requirements: string;
}

export function EventRequirementAnalysis({
  eventId,
}: EventRequirementAnalysisProps) {
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      const data = await response.json();
      setEventDetails(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch event details'
      );
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      wedding: 'bg-pink-100 text-pink-800',
      corporate: 'bg-blue-100 text-blue-800',
      birthday: 'bg-yellow-100 text-yellow-800',
      conference: 'bg-purple-100 text-purple-800',
      party: 'bg-green-100 text-green-800',
    };
    return colors[eventType] || 'bg-gray-100 text-gray-800';
  };

  const getBudgetRange = (budget: number) => {
    if (budget < 1000)
      return { label: 'Small Budget', color: 'bg-green-100 text-green-800' };
    if (budget < 5000)
      return { label: 'Medium Budget', color: 'bg-yellow-100 text-yellow-800' };
    if (budget < 10000)
      return { label: 'Large Budget', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Premium Budget', color: 'bg-red-100 text-red-800' };
  };

  const getAttendeeRange = (attendees: number) => {
    if (attendees < 50)
      return { label: 'Small Event', color: 'bg-green-100 text-green-800' };
    if (attendees < 200)
      return { label: 'Medium Event', color: 'bg-yellow-100 text-yellow-800' };
    if (attendees < 500)
      return { label: 'Large Event', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Mega Event', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading event details...</span>
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

  if (!eventDetails) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>No event details found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const budgetInfo = getBudgetRange(eventDetails.budget_total);
  const attendeeInfo = getAttendeeRange(eventDetails.attendee_count);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Event Requirements Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{eventDetails.title}</h3>
              <p className="text-sm text-muted-foreground">
                {eventDetails.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={getEventTypeColor(eventDetails.event_type)}>
                {eventDetails.event_type}
              </Badge>
              <Badge className={budgetInfo.color}>{budgetInfo.label}</Badge>
              <Badge className={attendeeInfo.color}>{attendeeInfo.label}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Event Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(eventDetails.event_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {eventDetails.duration_hours} hours
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Attendees</p>
                <p className="text-sm text-muted-foreground">
                  {eventDetails.attendee_count} people
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {eventDetails.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Budget</p>
                <p className="text-sm text-muted-foreground">
                  ${eventDetails.budget_total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {eventDetails.special_requirements && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Special Requirements</p>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {eventDetails.special_requirements}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matching Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Service Type Compatibility</span>
                <span>High Priority</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Compatibility</span>
                <span>High Priority</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Location Match</span>
                <span>Medium Priority</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Availability</span>
                <span>High Priority</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Performance Rating</span>
                <span>Medium Priority</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
