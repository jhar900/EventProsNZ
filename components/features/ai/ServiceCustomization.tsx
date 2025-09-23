'use client';

import React, { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Minus,
  Edit,
  Save,
  X,
  DollarSign,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Copy,
  Settings,
} from 'lucide-react';

interface CustomService {
  id: string;
  service_category: string;
  service_name: string;
  description?: string;
  priority: number;
  is_required: boolean;
  estimated_cost?: number;
  estimated_duration_hours?: number;
  notes?: string;
  is_custom: boolean;
}

interface ServiceCustomizationProps {
  selectedServices: string[];
  onServiceUpdate: (services: CustomService[]) => void;
  className?: string;
}

export function ServiceCustomization({
  selectedServices,
  onServiceUpdate,
  className = '',
}: ServiceCustomizationProps) {
  const [services, setServices] = useState<CustomService[]>([]);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState<Partial<CustomService>>({
    service_category: '',
    service_name: '',
    description: '',
    priority: 3,
    is_required: false,
    estimated_cost: 0,
    estimated_duration_hours: 1,
    notes: '',
    is_custom: true,
  });

  const handleAddService = () => {
    if (!newService.service_name || !newService.service_category) {
      return;
    }

    const service: CustomService = {
      id: `custom_${Date.now()}`,
      service_category: newService.service_category,
      service_name: newService.service_name,
      description: newService.description,
      priority: newService.priority || 3,
      is_required: newService.is_required || false,
      estimated_cost: newService.estimated_cost,
      estimated_duration_hours: newService.estimated_duration_hours || 1,
      notes: newService.notes,
      is_custom: true,
    };

    setServices(prev => [...prev, service]);
    setNewService({
      service_category: '',
      service_name: '',
      description: '',
      priority: 3,
      is_required: false,
      estimated_cost: 0,
      estimated_duration_hours: 1,
      notes: '',
      is_custom: true,
    });
    setShowAddForm(false);
    onServiceUpdate([...services, service]);
  };

  const handleUpdateService = (id: string, updates: Partial<CustomService>) => {
    setServices(prev =>
      prev.map(service =>
        service.id === id ? { ...service, ...updates } : service
      )
    );
    setEditingService(null);
    onServiceUpdate(
      services.map(service =>
        service.id === id ? { ...service, ...updates } : service
      )
    );
  };

  const handleRemoveService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
    onServiceUpdate(services.filter(service => service.id !== id));
  };

  const handleDuplicateService = (service: CustomService) => {
    const duplicatedService: CustomService = {
      ...service,
      id: `custom_${Date.now()}`,
      service_name: `${service.service_name} (Copy)`,
    };
    setServices(prev => [...prev, duplicatedService]);
    onServiceUpdate([...services, duplicatedService]);
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

  const totalCost = services.reduce(
    (sum, service) => sum + (service.estimated_cost || 0),
    0
  );
  const totalDuration = services.reduce(
    (sum, service) => sum + (service.estimated_duration_hours || 0),
    0
  );
  const requiredServices = services.filter(
    service => service.is_required
  ).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Service Customization</h3>
          <p className="text-muted-foreground">
            Customize and manage your event services
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Service
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {services.length}
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

      {/* Add Service Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Custom Service</CardTitle>
            <CardDescription>
              Add a custom service to your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_category">Service Category</Label>
                <Input
                  id="service_category"
                  value={newService.service_category}
                  onChange={e =>
                    setNewService(prev => ({
                      ...prev,
                      service_category: e.target.value,
                    }))
                  }
                  placeholder="e.g., Photography, Catering"
                />
              </div>
              <div>
                <Label htmlFor="service_name">Service Name</Label>
                <Input
                  id="service_name"
                  value={newService.service_name}
                  onChange={e =>
                    setNewService(prev => ({
                      ...prev,
                      service_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Wedding Photography"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
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
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newService.priority?.toString()}
                  onValueChange={value =>
                    setNewService(prev => ({
                      ...prev,
                      priority: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
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
                <Label htmlFor="estimated_cost">Estimated Cost</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  value={newService.estimated_cost}
                  onChange={e =>
                    setNewService(prev => ({
                      ...prev,
                      estimated_cost: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newService.estimated_duration_hours}
                  onChange={e =>
                    setNewService(prev => ({
                      ...prev,
                      estimated_duration_hours: parseFloat(e.target.value) || 1,
                    }))
                  }
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newService.notes}
                onChange={e =>
                  setNewService(prev => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes or requirements..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_required"
                checked={newService.is_required}
                onCheckedChange={checked =>
                  setNewService(prev => ({ ...prev, is_required: checked }))
                }
              />
              <Label htmlFor="is_required">Required Service</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddService}>
                <Save className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <div className="space-y-4">
        {services.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No services added yet. Add some services to get started.
            </AlertDescription>
          </Alert>
        ) : (
          services.map(service => (
            <Card key={service.id}>
              <CardContent className="p-4">
                {editingService === service.id ? (
                  <EditServiceForm
                    service={service}
                    onSave={updates => handleUpdateService(service.id, updates)}
                    onCancel={() => setEditingService(null)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {service.service_name}
                          </h4>
                          {service.is_custom && (
                            <Badge variant="secondary" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {service.service_category}
                        </p>
                        {service.description && (
                          <p className="text-sm">{service.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(service.priority)}>
                          Priority {service.priority}
                        </Badge>
                        {service.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {service.estimated_cost && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>
                            ${service.estimated_cost.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {service.estimated_duration_hours && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{service.estimated_duration_hours}h</span>
                        </div>
                      )}
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
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingService(service.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveService(service.id)}
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
    </div>
  );
}

// Edit Service Form Component
function EditServiceForm({
  service,
  onSave,
  onCancel,
}: {
  service: CustomService;
  onSave: (updates: Partial<CustomService>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    service_category: service.service_category,
    service_name: service.service_name,
    description: service.description || '',
    priority: service.priority,
    is_required: service.is_required,
    estimated_cost: service.estimated_cost || 0,
    estimated_duration_hours: service.estimated_duration_hours || 1,
    notes: service.notes || '',
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit_service_category">Service Category</Label>
          <Input
            id="edit_service_category"
            value={formData.service_category}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                service_category: e.target.value,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="edit_service_name">Service Name</Label>
          <Input
            id="edit_service_name"
            value={formData.service_name}
            onChange={e =>
              setFormData(prev => ({ ...prev, service_name: e.target.value }))
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
          <Label htmlFor="edit_estimated_cost">Estimated Cost</Label>
          <Input
            id="edit_estimated_cost"
            type="number"
            value={formData.estimated_cost}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                estimated_cost: parseFloat(e.target.value) || 0,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="edit_duration">Duration (hours)</Label>
          <Input
            id="edit_duration"
            type="number"
            value={formData.estimated_duration_hours}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                estimated_duration_hours: parseFloat(e.target.value) || 1,
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
          id="edit_is_required"
          checked={formData.is_required}
          onCheckedChange={checked =>
            setFormData(prev => ({ ...prev, is_required: checked }))
          }
        />
        <Label htmlFor="edit_is_required">Required Service</Label>
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
