'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/useAuth';

const serviceSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
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
  service_name: string;
  service_type: string;
  description?: string;
  price_range_min?: number;
  price_range_max?: number;
  availability?: string;
  is_visible: boolean;
  created_at: string;
}

interface ServicesEditorProps {
  userId?: string | null; // Optional: for admin viewing other users
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const SERVICE_TYPES = [
  'Photography',
  'Videography',
  'Catering',
  'Music/DJ',
  'Floral Design',
  'Event Planning',
  'Venue Management',
  'Security',
  'Transportation',
  'Decorations',
  'Lighting',
  'Sound Equipment',
  'Other',
];

// Map service categories from Business Information to service types
// Keys must match exactly with SERVICE_CATEGORIES from BusinessInfoForm
const CATEGORY_TO_SERVICE_TYPE_MAP: Record<string, string[]> = {
  Catering: ['Catering'],
  Photography: ['Photography'],
  Videography: ['Videography'],
  'Music & Entertainment': ['Music/DJ'],
  Venues: ['Venue Management'],
  'Decoration & Styling': ['Decorations'],
  'Event Planning': ['Event Planning'],
  Security: ['Security'],
  Transportation: ['Transportation'],
  'Audio/Visual': ['Sound Equipment'],
  'Floral Design': ['Floral Design'],
  Lighting: ['Lighting'],
  Photobooth: ['Photography'], // Could be photography or other
  'DJ Services': ['Music/DJ'],
  'Wedding Services': [
    'Event Planning',
    'Photography',
    'Videography',
    'Floral Design',
    'Music/DJ',
  ],
  'Corporate Events': [
    'Event Planning',
    'Venue Management',
    'Catering',
    'Security',
  ],
  'Party Planning': ['Event Planning', 'Decorations', 'Lighting', 'Music/DJ'],
  Other: ['Other'],
};

export function ServicesEditor({
  userId: propUserId,
  onSuccess,
  onError,
}: ServicesEditorProps) {
  const { user } = useAuth();
  // Use provided userId (for admin) or fall back to logged-in user
  const targetUserId = propUserId || user?.id;
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (targetUserId) {
      fetchServices();
    }
  }, [targetUserId]);

  // Load business profile to get selected service categories
  useEffect(() => {
    const loadServiceCategories = async () => {
      if (!targetUserId) {
        setLoadingCategories(false);
        setAvailableServiceTypes(SERVICE_TYPES);
        return;
      }

      try {
        // If viewing another user (admin), use admin API endpoint
        const apiEndpoint = propUserId
          ? `/api/admin/users/${propUserId}/business-profile`
          : '/api/user/business-profile';

        const response = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            'x-user-id': targetUserId,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          const businessProfile =
            result.businessProfile || result.business_profile;

          if (
            businessProfile?.service_categories &&
            Array.isArray(businessProfile.service_categories) &&
            businessProfile.service_categories.length > 0
          ) {
            // Get unique service types based on selected categories
            const selectedCategories = businessProfile.service_categories;
            const allowedServiceTypesSet = new Set<string>();

            selectedCategories.forEach((category: string) => {
              const trimmedCategory = category.trim();
              const mappedTypes =
                CATEGORY_TO_SERVICE_TYPE_MAP[trimmedCategory] || [];
              mappedTypes.forEach(type => allowedServiceTypesSet.add(type));
            });

            // Filter SERVICE_TYPES to only include allowed types
            const filteredTypes =
              allowedServiceTypesSet.size > 0
                ? SERVICE_TYPES.filter(type => allowedServiceTypesSet.has(type))
                : SERVICE_TYPES;

            setAvailableServiceTypes(filteredTypes);
          } else {
            // If no categories selected, show all service types
            setAvailableServiceTypes(SERVICE_TYPES);
          }
        } else {
          // If business profile not found, show all service types
          setAvailableServiceTypes(SERVICE_TYPES);
        }
      } catch (error) {
        console.error('Error loading service categories:', error);
        // On error, show all service types
        setAvailableServiceTypes(SERVICE_TYPES);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadServiceCategories();
  }, [targetUserId, propUserId]);

  const fetchServices = async () => {
    if (!targetUserId) return;

    try {
      setIsFetching(true);
      setError(null);

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/services`
        : '/api/profile/me/services';

      const response = await fetch(apiEndpoint, {
        headers: {
          'x-user-id': targetUserId,
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to load services';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load services';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsFetching(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      service_name: '',
      service_type: '',
      description: '',
      price_range_min: undefined,
      price_range_max: undefined,
      availability: '',
      is_visible: true,
    },
  });

  const onSubmit = async (data: ServiceForm) => {
    if (!targetUserId) {
      setError('User ID is required');
      return;
    }

    try {
      setIsLoading(true);

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/services`
        : '/api/profile/me/services';

      const method = editingService ? 'PUT' : 'POST';
      const body = editingService ? { ...data, id: editingService.id } : data;

      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedServices = editingService
          ? services.map(s => (s.id === editingService.id ? result.service : s))
          : [...services, result.service];
        setServices(updatedServices);
        reset();
        setEditingService(null);
        setIsFormOpen(false);
        onSuccess?.('Service saved successfully!');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to save service';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save service';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    // Reset form first, then set values
    reset({
      service_name: service.service_name || '',
      service_type: service.service_type || '',
      description: service.description || '',
      price_range_min: service.price_range_min,
      price_range_max: service.price_range_max,
      availability: service.availability || '',
      is_visible: service.is_visible !== false,
    });
    setIsFormOpen(true);
    // Scroll to form after a brief delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.getElementById('service-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (serviceId: string) => {
    if (!targetUserId) {
      setError('User ID is required');
      return;
    }

    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      setIsLoading(true);

      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/services/${serviceId}`
        : `/api/profile/me/services/${serviceId}`;

      const response = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: {
          'x-user-id': targetUserId,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const updatedServices = services.filter(s => s.id !== serviceId);
        setServices(updatedServices);
        onSuccess?.('Service deleted successfully!');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to delete service';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete service';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      service_name: '',
      service_type: '',
      description: '',
      price_range_min: undefined,
      price_range_max: undefined,
      availability: '',
      is_visible: true,
    });
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

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Services</CardTitle>
            <Button
              onClick={() => {
                setEditingService(null);
                reset({
                  service_name: '',
                  service_type: '',
                  description: '',
                  price_range_min: undefined,
                  price_range_max: undefined,
                  availability: '',
                  is_visible: true,
                });
                setIsFormOpen(true);
              }}
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
              <p className="text-sm">
                Click &quot;Add Service&quot; to get started.
              </p>
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
                          {service.service_name || service.service_type}
                        </h3>
                        {service.service_type && (
                          <Badge variant="outline" className="text-xs">
                            {service.service_type}
                          </Badge>
                        )}
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
        <Card id="service-form" className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingService(null);
                  reset({
                    service_name: '',
                    service_type: '',
                    description: '',
                    price_range_min: undefined,
                    price_range_max: undefined,
                    availability: '',
                    is_visible: true,
                  });
                }}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="service_name">Service Name *</Label>
                <Input
                  id="service_name"
                  {...register('service_name')}
                  placeholder="e.g., Wedding Photography Package"
                  className="w-full"
                />
                {errors.service_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.service_name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_type">Service Type *</Label>
                  <select
                    id="service_type"
                    {...register('service_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={loadingCategories}
                  >
                    <option value="">
                      {loadingCategories
                        ? 'Loading...'
                        : 'Select a service type'}
                    </option>
                    {availableServiceTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {availableServiceTypes.length === 0 && !loadingCategories && (
                    <p className="mt-1 text-sm text-amber-600">
                      Please select service categories in the Business Profile
                      section first.
                    </p>
                  )}
                  {errors.service_type && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.service_type.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    {...register('availability')}
                    placeholder="e.g., Weekends only, 24/7, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe this service in detail"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_range_min">Minimum Price (NZD)</Label>
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
                  <Label htmlFor="price_range_max">Maximum Price (NZD)</Label>
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
