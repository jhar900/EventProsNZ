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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Save,
  Copy,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  Settings,
  Star,
  Users,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Target,
  BarChart3,
} from 'lucide-react';

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  eventType: string;
  services: ServiceTemplateItem[];
  isPublic: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  rating?: number;
  tags: string[];
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDuration: {
    min: number;
    max: number;
  };
  guestCountRange: {
    min: number;
    max: number;
  };
}

interface ServiceTemplateItem {
  id: string;
  serviceName: string;
  category: string;
  priority: number;
  isRequired: boolean;
  estimatedCost: number;
  estimatedDuration: number;
  description: string;
  notes?: string;
}

interface ServiceTemplateBuilderProps {
  onTemplateSave?: (template: ServiceTemplate) => void;
  onTemplateLoad?: (templateId: string) => void;
  initialTemplate?: Partial<ServiceTemplate>;
  className?: string;
}

export function ServiceTemplateBuilder({
  onTemplateSave,
  onTemplateLoad,
  initialTemplate,
  className = '',
}: ServiceTemplateBuilderProps) {
  const [template, setTemplate] = useState<ServiceTemplate>({
    id: '',
    name: '',
    description: '',
    eventType: '',
    services: [],
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    estimatedBudget: { min: 0, max: 0, currency: 'NZD' },
    estimatedDuration: { min: 0, max: 0 },
    guestCountRange: { min: 0, max: 0 },
    ...initialTemplate,
  });

  const [editingService, setEditingService] = useState<string | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState<Partial<ServiceTemplateItem>>({
    serviceName: '',
    category: '',
    priority: 3,
    isRequired: false,
    estimatedCost: 0,
    estimatedDuration: 1,
    description: '',
    notes: '',
  });

  const [activeTab, setActiveTab] = useState('services');

  // Update template statistics when services change
  useEffect(() => {
    const totalCost = template.services.reduce(
      (sum, service) => sum + service.estimatedCost,
      0
    );
    const totalDuration = template.services.reduce(
      (sum, service) => sum + service.estimatedDuration,
      0
    );
    const requiredServices = template.services.filter(
      service => service.isRequired
    ).length;

    setTemplate(prev => ({
      ...prev,
      estimatedBudget: {
        ...prev.estimatedBudget,
        min: Math.round(totalCost * 0.8),
        max: Math.round(totalCost * 1.2),
      },
      estimatedDuration: {
        min: Math.round(totalDuration * 0.9),
        max: Math.round(totalDuration * 1.1),
      },
    }));
  }, [template.services]);

  const handleAddService = () => {
    if (!newService.serviceName || !newService.category) {
      return;
    }

    const service: ServiceTemplateItem = {
      id: `service_${Date.now()}`,
      serviceName: newService.serviceName,
      category: newService.category,
      priority: newService.priority || 3,
      isRequired: newService.isRequired || false,
      estimatedCost: newService.estimatedCost || 0,
      estimatedDuration: newService.estimatedDuration || 1,
      description: newService.description || '',
      notes: newService.notes || '',
    };

    setTemplate(prev => ({
      ...prev,
      services: [...prev.services, service],
    }));

    setNewService({
      serviceName: '',
      category: '',
      priority: 3,
      isRequired: false,
      estimatedCost: 0,
      estimatedDuration: 1,
      description: '',
      notes: '',
    });
    setShowAddService(false);
  };

  const handleUpdateService = (
    id: string,
    updates: Partial<ServiceTemplateItem>
  ) => {
    setTemplate(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === id ? { ...service, ...updates } : service
      ),
    }));
    setEditingService(null);
  };

  const handleRemoveService = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== id),
    }));
  };

  const handleDuplicateService = (service: ServiceTemplateItem) => {
    const duplicatedService: ServiceTemplateItem = {
      ...service,
      id: `service_${Date.now()}`,
      serviceName: `${service.serviceName} (Copy)`,
    };
    setTemplate(prev => ({
      ...prev,
      services: [...prev.services, duplicatedService],
    }));
  };

  const handleSaveTemplate = () => {
    const templateToSave: ServiceTemplate = {
      ...template,
      id: template.id || `template_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    onTemplateSave?.(templateToSave);
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

  const totalCost = template.services.reduce(
    (sum, service) => sum + service.estimatedCost,
    0
  );
  const totalDuration = template.services.reduce(
    (sum, service) => sum + service.estimatedDuration,
    0
  );
  const requiredServices = template.services.filter(
    service => service.isRequired
  ).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Service Template Builder</h3>
          <p className="text-muted-foreground">
            Create and customize service templates for your events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddService(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
          <Button onClick={handleSaveTemplate}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Template Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Template Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template_name">Template Name</Label>
              <Input
                id="template_name"
                value={template.name}
                onChange={e =>
                  setTemplate(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Wedding Package"
              />
            </div>
            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={template.eventType}
                onValueChange={value =>
                  setTemplate(prev => ({ ...prev, eventType: value }))
                }
              >
                <SelectTrigger id="event_type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="template_description">Description</Label>
            <Textarea
              id="template_description"
              value={template.description}
              onChange={e =>
                setTemplate(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe this template..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={template.isPublic}
              onCheckedChange={checked =>
                setTemplate(prev => ({ ...prev, isPublic: checked }))
              }
            />
            <Label htmlFor="is_public">Make this template public</Label>
          </div>
        </CardContent>
      </Card>

      {/* Template Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {template.services.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Services</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {requiredServices}
            </div>
            <div className="text-sm text-muted-foreground">Required</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              ${totalCost.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Cost</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalDuration}h
            </div>
            <div className="text-sm text-muted-foreground">Total Duration</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {/* Add Service Form */}
          {showAddService && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Add Service to Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service_name">Service Name</Label>
                    <Input
                      id="service_name"
                      value={newService.serviceName}
                      onChange={e =>
                        setNewService(prev => ({
                          ...prev,
                          serviceName: e.target.value,
                        }))
                      }
                      placeholder="e.g., Wedding Photography"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service_category">Category</Label>
                    <Input
                      id="service_category"
                      value={newService.category}
                      onChange={e =>
                        setNewService(prev => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      placeholder="e.g., Photography"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="service_description">Description</Label>
                  <Textarea
                    id="service_description"
                    value={newService.description}
                    onChange={e =>
                      setNewService(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the service..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="service_priority">Priority</Label>
                    <Select
                      value={newService.priority?.toString()}
                      onValueChange={value =>
                        setNewService(prev => ({
                          ...prev,
                          priority: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger id="service_priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 - Critical</SelectItem>
                        <SelectItem value="4">4 - High</SelectItem>
                        <SelectItem value="3">3 - Medium</SelectItem>
                        <SelectItem value="2">2 - Low</SelectItem>
                        <SelectItem value="1">1 - Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="service_cost">Estimated Cost</Label>
                    <Input
                      id="service_cost"
                      type="number"
                      value={newService.estimatedCost}
                      onChange={e =>
                        setNewService(prev => ({
                          ...prev,
                          estimatedCost: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service_duration">Duration (hours)</Label>
                    <Input
                      id="service_duration"
                      type="number"
                      value={newService.estimatedDuration}
                      onChange={e =>
                        setNewService(prev => ({
                          ...prev,
                          estimatedDuration: parseFloat(e.target.value) || 1,
                        }))
                      }
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="service_notes">Notes</Label>
                  <Textarea
                    id="service_notes"
                    value={newService.notes}
                    onChange={e =>
                      setNewService(prev => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="service_required"
                    checked={newService.isRequired}
                    onCheckedChange={checked =>
                      setNewService(prev => ({ ...prev, isRequired: checked }))
                    }
                  />
                  <Label htmlFor="service_required">Required Service</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddService(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddService}>Add Service</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services List */}
          <div className="space-y-4">
            {template.services.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No services added yet. Add some services to build your
                  template.
                </AlertDescription>
              </Alert>
            ) : (
              template.services.map(service => (
                <Card key={service.id}>
                  <CardContent className="p-4">
                    {editingService === service.id ? (
                      <EditServiceForm
                        service={service}
                        onSave={updates =>
                          handleUpdateService(service.id, updates)
                        }
                        onCancel={() => setEditingService(null)}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {service.serviceName}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {service.category}
                            </p>
                            {service.description && (
                              <p className="text-sm">{service.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getPriorityColor(service.priority)}
                            >
                              Priority {service.priority}
                            </Badge>
                            {service.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>
                              ${service.estimatedCost.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{service.estimatedDuration}h</span>
                          </div>
                        </div>

                        {service.notes && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {service.notes}
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateService(service)}
                            aria-label="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingService(service.id)}
                            aria-label="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveService(service.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                Preview how your template will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold">
                  {template.name || 'Untitled Template'}
                </h3>
                <p className="text-muted-foreground">
                  {template.description || 'No description provided'}
                </p>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{template.eventType || 'Any'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {template.guestCountRange.min}-
                      {template.guestCountRange.max} guests
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      ${template.estimatedBudget.min.toLocaleString()}-$
                      {template.estimatedBudget.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {template.estimatedDuration.min}-
                      {template.estimatedDuration.max}h
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Included Services:</h4>
                  <div className="space-y-2">
                    {template.services.map(service => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{service.serviceName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {service.priority}
                          </Badge>
                          {service.isRequired && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget_min">Minimum Budget</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    value={template.estimatedBudget.min}
                    onChange={e =>
                      setTemplate(prev => ({
                        ...prev,
                        estimatedBudget: {
                          ...prev.estimatedBudget,
                          min: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="budget_max">Maximum Budget</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    value={template.estimatedBudget.max}
                    onChange={e =>
                      setTemplate(prev => ({
                        ...prev,
                        estimatedBudget: {
                          ...prev.estimatedBudget,
                          max: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guests_min">Minimum Guests</Label>
                  <Input
                    id="guests_min"
                    type="number"
                    value={template.guestCountRange.min}
                    onChange={e =>
                      setTemplate(prev => ({
                        ...prev,
                        guestCountRange: {
                          ...prev.guestCountRange,
                          min: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="guests_max">Maximum Guests</Label>
                  <Input
                    id="guests_max"
                    type="number"
                    value={template.guestCountRange.max}
                    onChange={e =>
                      setTemplate(prev => ({
                        ...prev,
                        guestCountRange: {
                          ...prev.guestCountRange,
                          max: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="template_public"
                  checked={template.isPublic}
                  onCheckedChange={checked =>
                    setTemplate(prev => ({ ...prev, isPublic: checked }))
                  }
                />
                <Label htmlFor="template_public">
                  Make this template public
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Edit Service Form Component
function EditServiceForm({
  service,
  onSave,
  onCancel,
}: {
  service: ServiceTemplateItem;
  onSave: (updates: Partial<ServiceTemplateItem>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    serviceName: service.serviceName,
    category: service.category,
    priority: service.priority,
    isRequired: service.isRequired,
    estimatedCost: service.estimatedCost,
    estimatedDuration: service.estimatedDuration,
    description: service.description,
    notes: service.notes || '',
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit_service_name">Service Name</Label>
          <Input
            id="edit_service_name"
            value={formData.serviceName}
            onChange={e =>
              setFormData(prev => ({ ...prev, serviceName: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="edit_category">Category</Label>
          <Input
            id="edit_category"
            value={formData.category}
            onChange={e =>
              setFormData(prev => ({ ...prev, category: e.target.value }))
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="edit_description">Description</Label>
        <Textarea
          id="edit_description"
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="edit_priority">Priority</Label>
          <Select
            value={formData.priority.toString()}
            onValueChange={value =>
              setFormData(prev => ({ ...prev, priority: parseInt(value) }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 - Critical</SelectItem>
              <SelectItem value="4">4 - High</SelectItem>
              <SelectItem value="3">3 - Medium</SelectItem>
              <SelectItem value="2">2 - Low</SelectItem>
              <SelectItem value="1">1 - Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit_cost">Estimated Cost</Label>
          <Input
            id="edit_cost"
            type="number"
            value={formData.estimatedCost}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                estimatedCost: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="edit_duration">Duration (hours)</Label>
          <Input
            id="edit_duration"
            type="number"
            value={formData.estimatedDuration}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                estimatedDuration: parseFloat(e.target.value) || 1,
              }))
            }
          />
        </div>
      </div>

      <div>
        <Label htmlFor="edit_notes">Notes</Label>
        <Textarea
          id="edit_notes"
          value={formData.notes}
          onChange={e =>
            setFormData(prev => ({ ...prev, notes: e.target.value }))
          }
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="edit_required"
          checked={formData.isRequired}
          onCheckedChange={checked =>
            setFormData(prev => ({ ...prev, isRequired: checked }))
          }
        />
        <Label htmlFor="edit_required">Required Service</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
