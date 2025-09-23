'use client';

import React, { useEffect, useState } from 'react';
import { useEventCreationStore } from '@/stores/event-creation';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  Search,
  Heart,
  Building2,
  PartyPopper,
  Users,
  GraduationCap,
  Wrench,
  PresentationChart,
  Music,
  Calendar,
  Trophy,
  Gift,
  HelpCircle,
  Loader2,
  Star,
  Clock,
  DollarSign,
} from 'lucide-react';
import { EventTemplate, EVENT_TYPES } from '@/types/events';

interface EventTemplatesProps {
  onSelect: (template: EventTemplate) => void;
  onClose: () => void;
}

const eventTypeIcons = {
  [EVENT_TYPES.WEDDING]: Heart,
  [EVENT_TYPES.CORPORATE]: Building2,
  [EVENT_TYPES.PARTY]: PartyPopper,
  [EVENT_TYPES.CONFERENCE]: Users,
  [EVENT_TYPES.SEMINAR]: GraduationCap,
  [EVENT_TYPES.WORKSHOP]: Wrench,
  [EVENT_TYPES.EXHIBITION]: PresentationChart,
  [EVENT_TYPES.CONCERT]: Music,
  [EVENT_TYPES.FESTIVAL]: Calendar,
  [EVENT_TYPES.SPORTS]: Trophy,
  [EVENT_TYPES.CHARITY]: Gift,
  [EVENT_TYPES.OTHER]: HelpCircle,
};

export function EventTemplates({ onSelect, onClose }: EventTemplatesProps) {
  const { templates, loadTemplates, loadTemplate, isLoading } =
    useEventCreationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.event_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      !selectedEventType || template.event_type === selectedEventType;
    return matchesSearch && matchesType;
  });

  const handleTemplateSelect = (template: EventTemplate) => {
    loadTemplate(template);
    onSelect(template);
  };

  const getEventTypeIcon = (eventType: string) => {
    const Icon =
      eventTypeIcons[eventType as keyof typeof eventTypeIcons] || HelpCircle;
    return <Icon className="h-5 w-5" />;
  };

  const getServiceCount = (template: EventTemplate) => {
    return template.template_data?.serviceRequirements?.length || 0;
  };

  const getEstimatedBudget = (template: EventTemplate) => {
    const requirements = template.template_data?.serviceRequirements || [];
    return requirements.reduce(
      (sum, req) => sum + (req.estimatedBudget || 0),
      0
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Choose an Event Template</CardTitle>
            <CardDescription>
              Start with a pre-built template or create your own custom event
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedEventType === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedEventType('')}
              >
                All Types
              </Button>
              {Object.entries(EVENT_TYPES).map(([key, value]) => (
                <Button
                  key={key}
                  variant={selectedEventType === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedEventType(value)}
                  className="flex items-center gap-1"
                >
                  {getEventTypeIcon(value)}
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading templates...</span>
            </div>
          )}

          {/* Templates Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(template.event_type)}
                        <div>
                          <CardTitle className="text-lg">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="capitalize">
                            {template.event_type.replace('_', ' ')} Event
                          </CardDescription>
                        </div>
                      </div>
                      {template.is_public && (
                        <Badge variant="secondary">Public</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Template Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {getServiceCount(template)} services
                      </div>
                      {getEstimatedBudget(template) > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />$
                          {getEstimatedBudget(template).toLocaleString()}+
                        </div>
                      )}
                    </div>

                    {/* Service Requirements Preview */}
                    {template.template_data?.serviceRequirements && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Includes:</Label>
                        <div className="flex flex-wrap gap-1">
                          {template.template_data.serviceRequirements
                            .slice(0, 3)
                            .map((req, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {req.category.replace('_', ' ')}
                              </Badge>
                            ))}
                          {template.template_data.serviceRequirements.length >
                            3 && (
                            <Badge variant="outline" className="text-xs">
                              +
                              {template.template_data.serviceRequirements
                                .length - 3}{' '}
                              more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Budget Breakdown Preview */}
                    {template.template_data?.budgetBreakdown && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Budget Allocation:
                        </Label>
                        <div className="space-y-1">
                          {Object.entries(
                            template.template_data.budgetBreakdown
                          )
                            .slice(0, 3)
                            .map(([category, percentage]) => (
                              <div
                                key={category}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="capitalize">
                                  {category.replace('_', ' ')}
                                </span>
                                <span>{percentage}%</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Use Template Button */}
                    <Button
                      className="w-full"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Templates Found */}
          {!isLoading && filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <Alert>
                <AlertDescription>
                  No templates found matching your criteria. Try adjusting your
                  search or filters.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Create Custom Event */}
          <div className="pt-4 border-t">
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">
                  Don&apos;t see what you&apos;re looking for?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a custom event from scratch with your own requirements
                </p>
                <Button variant="outline" onClick={onClose}>
                  Create Custom Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
