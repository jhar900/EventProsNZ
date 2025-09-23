'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Star,
} from 'lucide-react';
import {
  Event,
  EventFormData,
  ServiceRequirement,
  BudgetPlan,
} from '@/types/events';
import { EventTypeSelector } from './EventTypeSelector';
import { EventDatePicker } from './EventDatePicker';
import { EventLocationInput } from './EventLocationInput';
import { ServiceCategorySelector } from './ServiceCategorySelector';

interface EventEditFormProps {
  eventId: string;
}

export function EventEditForm({ eventId }: EventEditFormProps) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [eventData, setEventData] = useState<Partial<EventFormData>>({});
  const [serviceRequirements, setServiceRequirements] = useState<
    ServiceRequirement[]
  >([]);
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan>({
    totalBudget: 0,
    breakdown: {},
    recommendations: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    { field: string; message: string }[]
  >([]);

  // Load event data
  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();

      if (data.success) {
        const eventData = data.event;
        setEvent(eventData);

        // Map event data to form data
        setEventData({
          eventType: eventData.event_type,
          title: eventData.title,
          description: eventData.description,
          eventDate: eventData.event_date,
          durationHours: eventData.duration_hours,
          attendeeCount: eventData.attendee_count,
          location: eventData.location_data || {
            address: eventData.location || '',
            coordinates: { lat: 0, lng: 0 },
          },
          specialRequirements: eventData.special_requirements,
        });

        // Map service requirements
        if (eventData.event_service_requirements) {
          setServiceRequirements(
            eventData.event_service_requirements.map((req: any) => ({
              id: req.id,
              category: req.service_category,
              type: req.service_type,
              description: req.description,
              priority: req.priority,
              estimatedBudget: req.estimated_budget,
              isRequired: req.is_required,
            }))
          );
        }

        // Map budget plan
        if (eventData.budget_total) {
          setBudgetPlan({
            totalBudget: eventData.budget_total,
            breakdown: {},
            recommendations: [],
          });
        }
      } else {
        setError(data.message || 'Failed to load event');
      }
    } catch (err) {
      setError('Failed to load event');
      console.error('Error loading event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const handleLocationChange = (location: any) => {
    setEventData(prev => ({ ...prev, location }));
  };

  const handleServiceRequirementChange = (
    index: number,
    field: string,
    value: any
  ) => {
    setServiceRequirements(prev =>
      prev.map((req, i) => (i === index ? { ...req, [field]: value } : req))
    );
  };

  const addServiceRequirement = () => {
    setServiceRequirements(prev => [
      ...prev,
      {
        category: '',
        type: '',
        description: '',
        priority: 'medium',
        estimatedBudget: undefined,
        isRequired: true,
      },
    ]);
  };

  const removeServiceRequirement = (index: number) => {
    setServiceRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleBudgetChange = (field: string, value: any) => {
    setBudgetPlan(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: { field: string; message: string }[] = [];

    if (!eventData.eventType) {
      errors.push({ field: 'eventType', message: 'Event type is required' });
    }
    if (!eventData.title?.trim()) {
      errors.push({ field: 'title', message: 'Event title is required' });
    }
    if (!eventData.eventDate) {
      errors.push({ field: 'eventDate', message: 'Event date is required' });
    }
    if (!eventData.location?.address?.trim()) {
      errors.push({ field: 'location', message: 'Event location is required' });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          serviceRequirements,
          budgetPlan,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Event updated successfully');
        setTimeout(() => {
          router.push(`/events/${eventId}`);
        }, 1500);
      } else {
        setError(data.message || 'Failed to update event');
        if (data.errors) {
          setValidationErrors(data.errors);
        }
      }
    } catch (err) {
      setError('Failed to update event');
      console.error('Error updating event:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading event...</span>
      </div>
    );
  }

  if (error && !event) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Event Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Event Basics</CardTitle>
          <CardDescription>Basic information about your event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Type */}
          <div className="space-y-2">
            <Label>Event Type *</Label>
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
          </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Service Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Service Requirements</CardTitle>
          <CardDescription>
            What services do you need for your event?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceRequirements.map((requirement, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Service Requirement {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeServiceRequirement(index)}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Category</Label>
                  <ServiceCategorySelector
                    value={requirement.category}
                    onChange={value =>
                      handleServiceRequirementChange(index, 'category', value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Input
                    placeholder="e.g., Wedding Photography"
                    value={requirement.type}
                    onChange={e =>
                      handleServiceRequirementChange(
                        index,
                        'type',
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what you need..."
                  value={requirement.description || ''}
                  onChange={e =>
                    handleServiceRequirementChange(
                      index,
                      'description',
                      e.target.value
                    )
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={requirement.priority}
                    onChange={e =>
                      handleServiceRequirementChange(
                        index,
                        'priority',
                        e.target.value
                      )
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Budget (NZD)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 2000"
                    min="0"
                    value={requirement.estimatedBudget || ''}
                    onChange={e =>
                      handleServiceRequirementChange(
                        index,
                        'estimatedBudget',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Required</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={requirement.isRequired}
                      onChange={e =>
                        handleServiceRequirementChange(
                          index,
                          'isRequired',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">This service is required</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addServiceRequirement}
            className="w-full"
          >
            Add Service Requirement
          </Button>
        </CardContent>
      </Card>

      {/* Budget Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Planning</CardTitle>
          <CardDescription>Set your budget for the event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totalBudget">Total Budget (NZD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="totalBudget"
                type="number"
                placeholder="Enter total budget"
                value={budgetPlan.totalBudget || ''}
                onChange={e =>
                  handleBudgetChange(
                    'totalBudget',
                    e.target.value ? parseInt(e.target.value) : 0
                  )
                }
                className="pl-10"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
