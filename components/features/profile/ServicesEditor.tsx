'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';

const serviceSchema = z.object({
  service_type: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  price_range_min: z.number().min(0).optional(),
  price_range_max: z.number().min(0).optional(),
  availability: z.string().optional(),
  is_visible: z.boolean().default(true),
});

type ServiceForm = z.infer<typeof serviceSchema>;

interface Service {
  id: string;
  user_id: string;
  service_type: string;
  description?: string;
  price_range_min?: number;
  price_range_max?: number;
  availability?: string;
  is_visible: boolean;
  created_at: string;
}

interface ServicesEditorProps {
  services: Service[];
  onUpdate: (services: Service[]) => void;
}

const SERVICE_TYPES = [
  'Photography',
  'Videography',
  'Catering',
  'Music & Entertainment',
  'Flowers & Decor',
  'Venue Management',
  'Event Planning',
  'Transportation',
  'Security',
  'Lighting & Sound',
  'Photobooth',
  'Other',
];

export function ServicesEditor({ services, onUpdate }: ServicesEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      service_type: '',
      description: '',
      price_range_min: undefined,
      price_range_max: undefined,
      availability: '',
      is_visible: true,
    },
  });

  const onSubmit = async (data: ServiceForm) => {
    try {
      setIsLoading(true);

      const url = editingService
        ? '/api/profile/me/services'
        : '/api/profile/me/services';

      const method = editingService ? 'PUT' : 'POST';
      const body = editingService ? { ...data, id: editingService.id } : data;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedServices = editingService
          ? services.map(s => (s.id === editingService.id ? result.service : s))
          : [...services, result.service];
        onUpdate(updatedServices);
        reset();
        setEditingService(null);
        setIsFormOpen(false);
      } else {
        const error = await response.json();
        console.error('Error saving service:', error);
      }
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setValue('service_type', service.service_type);
    setValue('description', service.description || '');
    setValue('price_range_min', service.price_range_min);
    setValue('price_range_max', service.price_range_max);
    setValue('availability', service.availability || '');
    setValue('is_visible', service.is_visible);
    setIsFormOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      setIsLoading(true);

      const response = await fetch(`/api/profile/me/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedServices = services.filter(s => s.id !== serviceId);
        onUpdate(updatedServices);
      } else {
        console.error('Error deleting service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setEditingService(null);
    setIsFormOpen(false);
  };

  const formatPriceRange = (min?: number, max?: number) => {
    if (!min && !max) return 'Price on request';
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return 'Price on request';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Services</CardTitle>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No services added yet.</p>
              <p className="text-sm">Click "Add Service" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map(service => (
                <div
                  key={service.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {service.service_type}
                        </h3>
                        {!service.is_visible && (
                          <Badge variant="secondary">Hidden</Badge>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatPriceRange(
                            service.price_range_min,
                            service.price_range_max
                          )}
                        </div>
                        {service.availability && (
                          <span>Available: {service.availability}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="service_type">Service Type *</Label>
                <select
                  id="service_type"
                  {...register('service_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select service type</option>
                  {SERVICE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.service_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.service_type.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe your service..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_range_min">Minimum Price ($)</Label>
                  <Input
                    id="price_range_min"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price_range_min', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="price_range_max">Maximum Price ($)</Label>
                  <Input
                    id="price_range_max"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price_range_max', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  {...register('availability')}
                  placeholder="e.g., Weekends only, Available 24/7"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_visible"
                  {...register('is_visible')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_visible">
                  Make this service visible to event managers
                </Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isLoading
                    ? 'Saving...'
                    : editingService
                      ? 'Update Service'
                      : 'Add Service'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
