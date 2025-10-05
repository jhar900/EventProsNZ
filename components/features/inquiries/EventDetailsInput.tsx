'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  X,
  MapPin,
  Calendar,
  Users,
  Clock,
  DollarSign,
} from 'lucide-react';
import { EVENT_TYPES } from '@/types/events';

interface EventDetails {
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  duration_hours?: number;
  attendee_count?: number;
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    placeId?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  budget_total?: number;
  special_requirements?: string;
  service_requirements?: Array<{
    category: string;
    type: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    estimated_budget?: number;
    is_required: boolean;
  }>;
}

interface EventDetailsInputProps {
  value?: EventDetails;
  onChange: (eventDetails: EventDetails) => void;
  error?: string;
}

export function EventDetailsInput({
  value,
  onChange,
  error,
}: EventDetailsInputProps) {
  const [serviceRequirements, setServiceRequirements] = useState<
    Array<{
      id: string;
      category: string;
      type: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimated_budget: number;
      is_required: boolean;
    }>
  >(
    value?.service_requirements?.map((req, index) => ({
      id: `req-${index}`,
      ...req,
    })) || []
  );

  const handleFieldChange = (field: keyof EventDetails, fieldValue: any) => {
    onChange({
      ...value,
      [field]: fieldValue,
    } as EventDetails);
  };

  const handleLocationChange = (locationField: string, locationValue: any) => {
    onChange({
      ...value,
      location: {
        ...value?.location,
        [locationField]: locationValue,
      },
    } as EventDetails);
  };

  const addServiceRequirement = () => {
    const newRequirement = {
      id: `req-${Date.now()}`,
      category: '',
      type: '',
      description: '',
      priority: 'medium' as const,
      estimated_budget: 0,
      is_required: true,
    };

    const updatedRequirements = [...serviceRequirements, newRequirement];
    setServiceRequirements(updatedRequirements);

    onChange({
      ...value,
      service_requirements: updatedRequirements.map(({ id, ...req }) => req),
    } as EventDetails);
  };

  const removeServiceRequirement = (id: string) => {
    const updatedRequirements = serviceRequirements.filter(
      req => req.id !== id
    );
    setServiceRequirements(updatedRequirements);

    onChange({
      ...value,
      service_requirements: updatedRequirements.map(({ id, ...req }) => req),
    } as EventDetails);
  };

  const updateServiceRequirement = (
    id: string,
    field: string,
    fieldValue: any
  ) => {
    const updatedRequirements = serviceRequirements.map(req =>
      req.id === id ? { ...req, [field]: fieldValue } : req
    );
    setServiceRequirements(updatedRequirements);

    onChange({
      ...value,
      service_requirements: updatedRequirements.map(({ id, ...req }) => req),
    } as EventDetails);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Event Details
        </CardTitle>
        <CardDescription>
          Provide detailed information about your event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Type */}
        <div className="space-y-2">
          <Label htmlFor="event_type">Event Type *</Label>
          <Select
            value={value?.event_type || ''}
            onValueChange={eventType =>
              handleFieldChange('event_type', eventType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_TYPES).map(([key, eventType]) => (
                <SelectItem key={eventType} value={eventType}>
                  {key
                    .replace('_', ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Event Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            value={value?.title || ''}
            onChange={e => handleFieldChange('title', e.target.value)}
            placeholder="Enter event title"
          />
        </div>

        {/* Event Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={value?.description || ''}
            onChange={e => handleFieldChange('description', e.target.value)}
            placeholder="Describe your event"
            rows={3}
          />
        </div>

        {/* Event Date and Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event_date">Event Date *</Label>
            <Input
              id="event_date"
              type="datetime-local"
              value={value?.event_date || ''}
              onChange={e => handleFieldChange('event_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_hours">Duration (hours)</Label>
            <Input
              id="duration_hours"
              type="number"
              min="0"
              max="168"
              value={value?.duration_hours || ''}
              onChange={e =>
                handleFieldChange(
                  'duration_hours',
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="e.g., 4"
            />
          </div>
        </div>

        {/* Attendee Count and Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="attendee_count">Expected Attendees</Label>
            <Input
              id="attendee_count"
              type="number"
              min="1"
              max="10000"
              value={value?.attendee_count || ''}
              onChange={e =>
                handleFieldChange(
                  'attendee_count',
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="e.g., 100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_total">Total Budget</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="budget_total"
                type="number"
                min="0"
                value={value?.budget_total || ''}
                onChange={e =>
                  handleFieldChange(
                    'budget_total',
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="address">Event Location *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="address"
              value={value?.location?.address || ''}
              onChange={e => handleLocationChange('address', e.target.value)}
              placeholder="Enter event address"
              className="pl-10"
            />
          </div>
        </div>

        {/* Special Requirements */}
        <div className="space-y-2">
          <Label htmlFor="special_requirements">Special Requirements</Label>
          <Textarea
            id="special_requirements"
            value={value?.special_requirements || ''}
            onChange={e =>
              handleFieldChange('special_requirements', e.target.value)
            }
            placeholder="Any special requirements or notes"
            rows={3}
          />
        </div>

        {/* Service Requirements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Service Requirements</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addServiceRequirement}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          {serviceRequirements.map((requirement, index) => (
            <Card key={requirement.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Service {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeServiceRequirement(requirement.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={requirement.category}
                    onChange={e =>
                      updateServiceRequirement(
                        requirement.id,
                        'category',
                        e.target.value
                      )
                    }
                    placeholder="e.g., Catering"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    value={requirement.type}
                    onChange={e =>
                      updateServiceRequirement(
                        requirement.id,
                        'type',
                        e.target.value
                      )
                    }
                    placeholder="e.g., Buffet"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={requirement.priority}
                    onValueChange={priority =>
                      updateServiceRequirement(
                        requirement.id,
                        'priority',
                        priority
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Budget</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      min="0"
                      value={requirement.estimated_budget}
                      onChange={e =>
                        updateServiceRequirement(
                          requirement.id,
                          'estimated_budget',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={requirement.description}
                  onChange={e =>
                    updateServiceRequirement(
                      requirement.id,
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Describe the service requirement"
                  rows={2}
                />
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`required-${requirement.id}`}
                  checked={requirement.is_required}
                  onChange={e =>
                    updateServiceRequirement(
                      requirement.id,
                      'is_required',
                      e.target.checked
                    )
                  }
                />
                <Label htmlFor={`required-${requirement.id}`}>
                  Required service
                </Label>
              </div>
            </Card>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
