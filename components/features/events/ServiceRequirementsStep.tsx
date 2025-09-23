'use client';

import React, { useState } from 'react';
import {
  useServiceRequirements,
  useEventCreationStore,
} from '@/stores/event-creation';
import { ServiceCategorySelector } from './ServiceCategorySelector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Star,
  DollarSign,
  AlertCircle,
  Lightbulb,
  CheckCircle,
} from 'lucide-react';
import { ServiceRequirement, PRIORITY_LEVELS } from '@/types/events';

export function ServiceRequirementsStep() {
  const serviceRequirements = useServiceRequirements();
  const {
    addServiceRequirement,
    removeServiceRequirement,
    updateServiceRequirement,
  } = useEventCreationStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRequirement, setNewRequirement] = useState<
    Partial<ServiceRequirement>
  >({
    category: '',
    type: '',
    description: '',
    priority: 'medium',
    estimatedBudget: undefined,
    isRequired: true,
  });

  const handleAddRequirement = () => {
    if (newRequirement.category && newRequirement.type) {
      addServiceRequirement(newRequirement as ServiceRequirement);
      setNewRequirement({
        category: '',
        type: '',
        description: '',
        priority: 'medium',
        estimatedBudget: undefined,
        isRequired: true,
      });
      setShowAddForm(false);
    }
  };

  const handleRemoveRequirement = (id: string) => {
    removeServiceRequirement(id);
  };

  const handleUpdateRequirement = (id: string, field: string, value: any) => {
    updateServiceRequirement(id, { [field]: value });
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

  const getServiceSuggestions = () => {
    const suggestions = [
      {
        category: 'catering',
        type: 'full_service',
        description: 'Complete catering service with setup and cleanup',
      },
      {
        category: 'photography',
        type: 'event_photography',
        description: 'Professional event photography with edited photos',
      },
      {
        category: 'music',
        type: 'dj_service',
        description: 'DJ service with sound system and music selection',
      },
      {
        category: 'decorations',
        type: 'floral_arrangements',
        description: 'Floral decorations and centerpieces',
      },
      {
        category: 'venue',
        type: 'reception_venue',
        description: 'Event venue with tables, chairs, and basic amenities',
      },
    ];

    return suggestions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">What services do you need?</h3>
        <p className="text-sm text-muted-foreground">
          Add the services you need for your event. We&apos;ll help you find the
          right contractors.
        </p>
      </div>

      {/* Service Requirements List */}
      {serviceRequirements.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Your Service Requirements</h4>
          {serviceRequirements.map(requirement => (
            <Card key={requirement.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {requirement.category}
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

                    <div>
                      <h5 className="font-medium">{requirement.type}</h5>
                      {requirement.description && (
                        <p className="text-sm text-muted-foreground">
                          {requirement.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {requirement.estimatedBudget
                            ? `$${requirement.estimatedBudget.toLocaleString()}`
                            : 'No budget set'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRequirement(requirement.id!)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Service Requirement */}
      {!showAddForm ? (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service Requirement
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Service Requirement</CardTitle>
            <CardDescription>
              Tell us what service you need for your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service Category */}
            <div className="space-y-2">
              <Label>Service Category *</Label>
              <ServiceCategorySelector
                value={newRequirement.category || ''}
                onChange={value =>
                  setNewRequirement({ ...newRequirement, category: value })
                }
              />
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Input
                id="serviceType"
                placeholder="e.g., Wedding Photography, DJ Service, Catering"
                value={newRequirement.type || ''}
                onChange={e =>
                  setNewRequirement({ ...newRequirement, type: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you need in detail..."
                value={newRequirement.description || ''}
                onChange={e =>
                  setNewRequirement({
                    ...newRequirement,
                    description: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            {/* Priority and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newRequirement.priority}
                  onValueChange={value =>
                    setNewRequirement({
                      ...newRequirement,
                      priority: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedBudget">Estimated Budget (NZD)</Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  placeholder="e.g., 2000"
                  min="0"
                  value={newRequirement.estimatedBudget || ''}
                  onChange={e =>
                    setNewRequirement({
                      ...newRequirement,
                      estimatedBudget: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Required Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRequired"
                checked={newRequirement.isRequired}
                onChange={e =>
                  setNewRequirement({
                    ...newRequirement,
                    isRequired: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="isRequired" className="text-sm">
                This service is required for the event
              </Label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4">
              <Button
                onClick={handleAddRequirement}
                disabled={!newRequirement.category || !newRequirement.type}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Requirement
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Suggestions */}
      {serviceRequirements.length === 0 && (
        <div className="space-y-3">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Need inspiration?</strong> Here are some common services
              for events:
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {getServiceSuggestions().map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start h-auto p-3"
                onClick={() => {
                  setNewRequirement({
                    category: suggestion.category,
                    type: suggestion.type,
                    description: suggestion.description,
                    priority: 'medium',
                    estimatedBudget: undefined,
                    isRequired: true,
                  });
                  setShowAddForm(true);
                }}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{suggestion.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {suggestion.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Be specific about your requirements. The more
          detail you provide, the better we can match you with the right
          contractors.
        </AlertDescription>
      </Alert>
    </div>
  );
}
