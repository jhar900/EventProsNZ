'use client';

import React from 'react';
import { useEventCreationStore, useEventData } from '@/stores/event-creation';
import { EventTypeSelector } from './EventTypeSelector';
import { EventDatePicker } from './EventDatePicker';
import { EventLocationInput } from './EventLocationInput';
import { EventLogoUpload } from './EventLogoUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EVENT_TYPES } from '@/types/events';

// Event type labels matching EventTypeSelector
const eventTypeLabels: Record<string, string> = {
  [EVENT_TYPES.WEDDING]: 'Wedding',
  [EVENT_TYPES.CORPORATE]: 'Corporate Event',
  [EVENT_TYPES.PARTY]: 'Party',
  [EVENT_TYPES.CONFERENCE]: 'Conference',
  [EVENT_TYPES.SEMINAR]: 'Seminar',
  [EVENT_TYPES.WORKSHOP]: 'Workshop',
  [EVENT_TYPES.EXHIBITION]: 'Exhibition',
  [EVENT_TYPES.CONCERT]: 'Concert',
  [EVENT_TYPES.FESTIVAL]: 'Festival',
  [EVENT_TYPES.SPORTS]: 'Sports Event',
  [EVENT_TYPES.CHARITY]: 'Charity Event',
  [EVENT_TYPES.OTHER]: 'Other',
};

export function EventBasicsStep() {
  const eventData = useEventData();
  const { updateEventData } = useEventCreationStore();

  const handleInputChange = (field: string, value: any) => {
    updateEventData({ [field]: value });
  };

  const handleLocationChange = (location: any) => {
    updateEventData({ location });
  };

  return (
    <div className="space-y-6">
      {/* Event Type */}
      <div className="space-y-2">
        <Label htmlFor="eventType">Event Type *</Label>
        <EventTypeSelector
          value={eventData.eventType || ''}
          onChange={value => handleInputChange('eventType', value)}
        />
      </div>

      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          placeholder="Enter your event title"
          value={eventData.title || ''}
          onChange={e => handleInputChange('title', e.target.value)}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          {(eventData.title || '').length}/200 characters
        </p>
      </div>

      {/* Event Logo */}
      <EventLogoUpload
        value={eventData.logoUrl || null}
        onChange={logoUrl => handleInputChange('logoUrl', logoUrl)}
      />

      {/* Event Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Event Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your event..."
          value={eventData.description || ''}
          onChange={e => handleInputChange('description', e.target.value)}
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {(eventData.description || '').length}/1000 characters
        </p>
      </div>

      {/* Date and Time */}
      <div className="space-y-2">
        <Label>Event Date & Time *</Label>
        <EventDatePicker
          value={eventData.eventDate || ''}
          onChange={value => handleInputChange('eventDate', value)}
        />
      </div>

      {/* Duration and Attendees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="durationHours">Duration (hours)</Label>
          <Input
            id="durationHours"
            type="number"
            placeholder="e.g., 4"
            min="1"
            max="168"
            value={eventData.durationHours || ''}
            onChange={e =>
              handleInputChange(
                'durationHours',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="attendeeCount">Expected Attendees</Label>
          <Input
            id="attendeeCount"
            type="number"
            placeholder="e.g., 50"
            min="1"
            max="10000"
            value={eventData.attendeeCount || ''}
            onChange={e =>
              handleInputChange(
                'attendeeCount',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>Event Location *</Label>
        <EventLocationInput
          value={eventData.location}
          onChange={handleLocationChange}
        />
      </div>

      {/* Special Requirements */}
      <div className="space-y-2">
        <Label htmlFor="specialRequirements">Special Requirements</Label>
        <Textarea
          id="specialRequirements"
          placeholder="Any special requirements, accessibility needs, or notes..."
          value={eventData.specialRequirements || ''}
          onChange={e =>
            handleInputChange('specialRequirements', e.target.value)
          }
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {(eventData.specialRequirements || '').length}/500 characters
        </p>
      </div>

      {/* Event Type Specific Tips */}
      {eventData.eventType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Tips for your{' '}
              {eventTypeLabels[eventData.eventType] ||
                eventData.eventType.charAt(0).toUpperCase() +
                  eventData.eventType.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              {getEventTypeTips(eventData.eventType)}
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getEventTypeTips(eventType: string): string {
  const tips: Record<string, string> = {
    [EVENT_TYPES.WEDDING]:
      'Consider booking venues and vendors 6-12 months in advance. Popular dates fill up quickly!',
    [EVENT_TYPES.CORPORATE]:
      'Plan for AV equipment, catering, and professional services. Consider attendee travel and accommodation.',
    [EVENT_TYPES.PARTY]:
      'Think about entertainment, decorations, and food. Consider the age group and preferences of your guests.',
    [EVENT_TYPES.CONFERENCE]:
      'Plan for multiple sessions, networking breaks, and professional services. Consider attendee engagement.',
    [EVENT_TYPES.SEMINAR]:
      'Focus on educational content delivery, comfortable seating, and refreshments for learning breaks.',
    [EVENT_TYPES.WORKSHOP]:
      'Consider hands-on activities, materials needed, and interactive elements for participant engagement.',
    [EVENT_TYPES.EXHIBITION]:
      'Plan for display spaces, visitor flow, and exhibitor services. Consider marketing and promotion.',
    [EVENT_TYPES.CONCERT]:
      'Focus on sound, lighting, and stage setup. Consider crowd management and security.',
    [EVENT_TYPES.FESTIVAL]:
      'Plan for multiple activities, food vendors, and entertainment. Consider weather contingencies.',
    [EVENT_TYPES.SPORTS]:
      'Consider equipment, referees, and facilities. Plan for participant registration and awards.',
    [EVENT_TYPES.CHARITY]:
      'Focus on fundraising activities, donor recognition, and volunteer coordination.',
    [EVENT_TYPES.OTHER]:
      'Consider the unique aspects of your event and plan accordingly.',
  };

  return (
    tips[eventType] ||
    'Plan ahead and consider all aspects of your event for the best experience.'
  );
}
