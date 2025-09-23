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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Star,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Save,
  Copy,
  Share2,
  Heart,
  TrendingUp,
  Calendar,
  MapPin,
} from 'lucide-react';

interface ServiceTemplate {
  id: string;
  name: string;
  event_type: string;
  services: Array<{
    service_category: string;
    priority: number;
    is_required: boolean;
    estimated_cost_percentage: number;
    description?: string;
  }>;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  usage_count?: number;
  rating?: number;
  description?: string;
}

interface ServiceTemplatesProps {
  eventType: string;
  onTemplateSelect?: (template: ServiceTemplate) => void;
  onTemplateCreate?: (template: ServiceTemplate) => void;
  className?: string;
}

export function ServiceTemplates({
  eventType,
  onTemplateSelect,
  onTemplateCreate,
  className = '',
}: ServiceTemplatesProps) {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublic, setFilterPublic] = useState<boolean | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ServiceTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [eventType]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/ai/service-templates?event_type=${eventType}`
      );
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPublic =
      filterPublic === null || template.is_public === filterPublic;
    return matchesSearch && matchesPublic;
  });

  const handleTemplateSelect = (template: ServiceTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleTemplateCreate = async (
    templateData: Partial<ServiceTemplate>
  ) => {
    try {
      const response = await fetch('/api/ai/service-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      const data = await response.json();
      setTemplates(prev => [data.template, ...prev]);
      setShowCreateDialog(false);
      onTemplateCreate?.(data.template);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create template'
      );
    }
  };

  const handleTemplateDelete = async (templateId: string) => {
    try {
      const response = await fetch(`/api/ai/service-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete template'
      );
    }
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

  if (isLoading) {
    return (
      <div
        className={`space-y-4 ${className} flex items-center justify-center`}
      >
        <LoadingSpinner />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Service Templates</h3>
          <p className="text-muted-foreground">
            Pre-configured service packages for {eventType} events
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Service Template</DialogTitle>
              <DialogDescription>
                Create a new service template for {eventType} events
              </DialogDescription>
            </DialogHeader>
            <CreateTemplateForm
              eventType={eventType}
              onSubmit={handleTemplateCreate}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Templates</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <Label htmlFor="public">Filter by Visibility</Label>
          <select
            id="public"
            value={filterPublic === null ? '' : filterPublic.toString()}
            onChange={e =>
              setFilterPublic(
                e.target.value === '' ? null : e.target.value === 'true'
              )
            }
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">All Templates</option>
            <option value="true">Public Templates</option>
            <option value="false">My Templates</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map(template => (
          <Card
            key={template.id}
            className="transition-all duration-200 hover:shadow-md cursor-pointer"
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description ||
                      `${template.services.length} services included`}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {template.is_public && (
                    <Badge variant="secondary" className="text-xs">
                      Public
                    </Badge>
                  )}
                  {template.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">
                        {template.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Services Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Services Included</span>
                </div>
                <div className="space-y-1">
                  {template.services.slice(0, 3).map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className="text-muted-foreground"
                        data-testid={`service-${template.id}-${service.service_category.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {service.service_category}
                      </span>
                      <Badge
                        className={getPriorityColor(service.priority)}
                        variant="outline"
                      >
                        P{service.priority}
                      </Badge>
                    </div>
                  ))}
                  {template.services.length > 3 && (
                    <div className="text-xs text-primary">
                      +{template.services.length - 3} more services
                    </div>
                  )}
                </div>
              </div>

              {/* Template Stats */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-center">
                  <div
                    className="font-medium"
                    data-testid={`services-count-${template.id}`}
                  >
                    {template.services.length}
                  </div>
                  <div className="text-muted-foreground">Services</div>
                </div>
                <div className="text-center">
                  <div
                    className="font-medium"
                    data-testid={`budget-percentage-${template.id}`}
                  >
                    {Math.round(
                      template.services.reduce(
                        (sum, s) => sum + s.estimated_cost_percentage,
                        0
                      ) * 100
                    )}
                    %
                  </div>
                  <div className="text-muted-foreground">Budget</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleTemplateSelect(template);
                  }}
                  className="flex-1"
                  data-testid={`use-template-${template.id}`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={e => {
                    e.stopPropagation();
                    // Handle template copy
                    console.log('Copy template:', template.id);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Template Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(template.created_at).toLocaleDateString()}
                </span>
                {template.usage_count && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {template.usage_count}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Details Dialog */}
      {selectedTemplate && (
        <Dialog
          open={!!selectedTemplate}
          onOpenChange={() => setSelectedTemplate(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
              <DialogDescription>
                {selectedTemplate.description ||
                  `Service template for ${selectedTemplate.event_type} events`}
              </DialogDescription>
            </DialogHeader>
            <TemplateDetails
              template={selectedTemplate}
              onUse={() => {
                onTemplateSelect?.(selectedTemplate);
                setSelectedTemplate(null);
              }}
              onDelete={() => {
                handleTemplateDelete(selectedTemplate.id);
                setSelectedTemplate(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Summary */}
      {filteredTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {filteredTemplates.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Templates
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredTemplates.filter(t => t.is_public).length}
                </div>
                <div className="text-sm text-muted-foreground">Public</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    filteredTemplates.reduce(
                      (sum, t) => sum + t.services.length,
                      0
                    ) / filteredTemplates.length
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Services
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredTemplates.reduce(
                    (sum, t) => sum + (t.usage_count || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Usage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <Alert>
          <AlertDescription>
            No templates found matching your search criteria.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Create Template Form Component
function CreateTemplateForm({
  eventType,
  onSubmit,
  onCancel,
}: {
  eventType: string;
  onSubmit: (template: Partial<ServiceTemplate>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
    services: [] as Array<{
      service_category: string;
      priority: number;
      is_required: boolean;
      estimated_cost_percentage: number;
      description?: string;
    }>,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      event_type: eventType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e =>
            setFormData(prev => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter template name"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter template description"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_public"
          checked={formData.is_public}
          onChange={e =>
            setFormData(prev => ({ ...prev, is_public: e.target.checked }))
          }
        />
        <Label htmlFor="is_public">Make this template public</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>
    </form>
  );
}

// Template Details Component
function TemplateDetails({
  template,
  onUse,
  onDelete,
}: {
  template: ServiceTemplate;
  onUse: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {template.services.length}
          </div>
          <div className="text-sm text-muted-foreground">Services</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {template.services.filter(s => s.is_required).length}
          </div>
          <div className="text-sm text-muted-foreground">Required</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(
              template.services.reduce(
                (sum, s) => sum + s.estimated_cost_percentage,
                0
              ) * 100
            )}
            %
          </div>
          <div className="text-sm text-muted-foreground">Total Budget</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {template.usage_count || 0}
          </div>
          <div className="text-sm text-muted-foreground">Usage Count</div>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        <h4 className="font-semibold">Services Included</h4>
        <div className="space-y-2">
          {template.services.map((service, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {service.service_category}
                    </div>
                    {service.description && (
                      <div className="text-sm text-muted-foreground">
                        {service.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        service.is_required
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {service.is_required ? 'Required' : 'Optional'}
                    </Badge>
                    <Badge variant="outline">Priority {service.priority}</Badge>
                    <Badge variant="secondary">
                      {Math.round(service.estimated_cost_percentage * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button onClick={onUse}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Use This Template
        </Button>
      </div>
    </div>
  );
}
