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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const serviceSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  service_type: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  price_range_min: z.number().min(0).optional(),
  price_range_max: z.number().min(0).optional(),
  exact_price: z.number().min(0).optional(),
  hourly_rate: z.number().min(0).optional(),
  daily_rate: z.number().min(0).optional(),
  hide_price: z.boolean().default(false),
  contact_for_pricing: z.boolean().default(false),
  is_free: z.boolean().default(false),
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
  exact_price?: number;
  hourly_rate?: number;
  daily_rate?: number;
  hide_price?: boolean;
  contact_for_pricing?: boolean;
  is_free?: boolean;
  availability?: string;
  is_visible: boolean;
  created_at: string;
}

interface ServicesEditorProps {
  userId?: string | null; // Optional: for admin viewing other users
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

// Service categories will be fetched from the database

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
  const [allServiceCategories, setAllServiceCategories] = useState<
    Array<{ id: string; name: string; description?: string }>
  >([]);
  const [pricingType, setPricingType] = useState<
    'hourly' | 'daily' | 'exact' | 'range' | 'none'
  >('none');

  useEffect(() => {
    if (targetUserId) {
      fetchServices();
    }
  }, [targetUserId]);

  // Load service categories from database
  useEffect(() => {
    const loadServiceCategories = async () => {
      try {
        setLoadingCategories(true);

        // Fetch all active service categories from the database
        const response = await fetch('/api/service-categories', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          // The API returns both categories array (names) and fullCategories array (full objects)
          const fullCategories = result.fullCategories || [];

          if (fullCategories.length > 0) {
            // Use full categories with id, name, description
            setAllServiceCategories(fullCategories);
            // Extract category names for the dropdown
            const categoryNames = fullCategories.map(
              (cat: { name: string; id?: string; description?: string }) =>
                cat.name
            );
            setAvailableServiceTypes(categoryNames);
          } else if (result.categories && Array.isArray(result.categories)) {
            // Fallback: if only category names are returned
            const categoryNames = result.categories;
            setAvailableServiceTypes(categoryNames);
            // Create minimal category objects from names
            setAllServiceCategories(
              categoryNames.map((name: string) => ({ name }))
            );
          } else {
            setAvailableServiceTypes([]);
            setAllServiceCategories([]);
          }
        } else {
          console.error('Error loading service categories from database');
          // Fallback: show empty array if fetch fails
          setAvailableServiceTypes([]);
          setAllServiceCategories([]);
        }
      } catch (error) {
        console.error('Error loading service categories:', error);
        setAvailableServiceTypes([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadServiceCategories();
  }, []);

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
    watch,
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      service_name: '',
      service_type: '',
      description: '',
      price_range_min: undefined,
      price_range_max: undefined,
      exact_price: undefined,
      hourly_rate: undefined,
      daily_rate: undefined,
      hide_price: false,
      contact_for_pricing: false,
      is_free: false,
      availability: '',
      is_visible: true,
    },
  });

  // Watch pricing-related fields to manage pricing type state
  const hidePrice = watch('hide_price');
  const contactForPricing = watch('contact_for_pricing');
  const isFree = watch('is_free');
  const exactPrice = watch('exact_price');
  const hourlyRate = watch('hourly_rate');
  const dailyRate = watch('daily_rate');
  const priceRangeMin = watch('price_range_min');
  const priceRangeMax = watch('price_range_max');

  // Update pricing type based on form values
  useEffect(() => {
    if (isFree) {
      setPricingType('none');
    } else if (contactForPricing) {
      setPricingType('none');
    } else if (hidePrice) {
      setPricingType('none');
    } else if (
      hourlyRate !== undefined &&
      hourlyRate !== null &&
      hourlyRate !== 0
    ) {
      setPricingType('hourly');
    } else if (
      dailyRate !== undefined &&
      dailyRate !== null &&
      dailyRate !== 0
    ) {
      setPricingType('daily');
    } else if (
      exactPrice !== undefined &&
      exactPrice !== null &&
      exactPrice !== 0
    ) {
      setPricingType('exact');
    } else if (
      (priceRangeMin !== undefined &&
        priceRangeMin !== null &&
        priceRangeMin !== 0) ||
      (priceRangeMax !== undefined &&
        priceRangeMax !== null &&
        priceRangeMax !== 0)
    ) {
      setPricingType('range');
    } else {
      setPricingType('none');
    }
  }, [
    hidePrice,
    contactForPricing,
    isFree,
    hourlyRate,
    dailyRate,
    exactPrice,
    priceRangeMin,
    priceRangeMax,
  ]);

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
      exact_price: service.exact_price,
      hourly_rate: service.hourly_rate,
      daily_rate: service.daily_rate,
      hide_price: service.hide_price || false,
      contact_for_pricing: service.contact_for_pricing || false,
      is_free: service.is_free || false,
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
      exact_price: undefined,
      hourly_rate: undefined,
      daily_rate: undefined,
      hide_price: false,
      contact_for_pricing: false,
      is_free: false,
      availability: '',
      is_visible: true,
    });
    setPricingType('none');
    setEditingService(null);
    setIsFormOpen(false);
  };

  const formatPrice = (service: Service) => {
    if (service.is_free) return 'Free';
    if (service.contact_for_pricing) return 'Contact for pricing';
    if (service.hide_price) return 'Price not shown';
    if (service.hourly_rate !== undefined && service.hourly_rate !== null) {
      return `$${service.hourly_rate}/hour`;
    }
    if (service.daily_rate !== undefined && service.daily_rate !== null) {
      return `$${service.daily_rate}/day`;
    }
    if (service.exact_price !== undefined && service.exact_price !== null) {
      return `$${service.exact_price}`;
    }
    if (service.price_range_min || service.price_range_max) {
      const min = service.price_range_min;
      const max = service.price_range_max;
      if (min && max) return `$${min} - $${max}`;
      if (min) return `From $${min}`;
      if (max) return `Up to $${max}`;
    }
    return 'Contact for pricing';
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
                  exact_price: undefined,
                  hourly_rate: undefined,
                  daily_rate: undefined,
                  hide_price: false,
                  contact_for_pricing: false,
                  is_free: false,
                  availability: '',
                  is_visible: true,
                });
                setPricingType('none');
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
                          {formatPrice(service)}
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
                    exact_price: undefined,
                    hide_price: false,
                    contact_for_pricing: false,
                    is_free: false,
                    availability: '',
                    is_visible: true,
                  });
                  setPricingType('none');
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

              {/* Pricing Options */}
              <div className="space-y-4">
                <Label>Pricing Options</Label>

                {/* Pricing Type Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_free"
                      checked={isFree}
                      onCheckedChange={checked => {
                        setValue('is_free', checked as boolean);
                        if (checked) {
                          setValue('contact_for_pricing', false);
                          setValue('hide_price', false);
                          setValue('exact_price', undefined);
                          setValue('hourly_rate', undefined);
                          setValue('daily_rate', undefined);
                          setValue('price_range_min', undefined);
                          setValue('price_range_max', undefined);
                        }
                      }}
                    />
                    <Label
                      htmlFor="is_free"
                      className="font-normal cursor-pointer"
                    >
                      Free service
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contact_for_pricing"
                      checked={contactForPricing}
                      onCheckedChange={checked => {
                        setValue('contact_for_pricing', checked as boolean);
                        if (checked) {
                          setValue('is_free', false);
                          setValue('hide_price', false);
                          setValue('exact_price', undefined);
                          setValue('hourly_rate', undefined);
                          setValue('daily_rate', undefined);
                          setValue('price_range_min', undefined);
                          setValue('price_range_max', undefined);
                        }
                      }}
                    />
                    <Label
                      htmlFor="contact_for_pricing"
                      className="font-normal cursor-pointer"
                    >
                      Contact for pricing
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide_price"
                      checked={hidePrice}
                      onCheckedChange={checked => {
                        setValue('hide_price', checked as boolean);
                        if (checked) {
                          setValue('is_free', false);
                          setValue('contact_for_pricing', false);
                          setValue('exact_price', undefined);
                          setValue('hourly_rate', undefined);
                          setValue('daily_rate', undefined);
                          setValue('price_range_min', undefined);
                          setValue('price_range_max', undefined);
                        }
                      }}
                    />
                    <Label
                      htmlFor="hide_price"
                      className="font-normal cursor-pointer"
                    >
                      Do not show price
                    </Label>
                  </div>
                </div>

                {/* Price Input Fields - Only show if no special pricing option is selected */}
                {!isFree && !contactForPricing && !hidePrice && (
                  <div className="space-y-4 pt-2 border-t">
                    <div className="space-y-2">
                      <Label>Price Type</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="pricing_hourly"
                            name="pricing_type"
                            checked={pricingType === 'hourly'}
                            onChange={() => {
                              setPricingType('hourly');
                              setValue('exact_price', undefined);
                              setValue('daily_rate', undefined);
                              setValue('price_range_min', undefined);
                              setValue('price_range_max', undefined);
                            }}
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor="pricing_hourly"
                            className="font-normal cursor-pointer"
                          >
                            Hourly rate
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="pricing_daily"
                            name="pricing_type"
                            checked={pricingType === 'daily'}
                            onChange={() => {
                              setPricingType('daily');
                              setValue('exact_price', undefined);
                              setValue('hourly_rate', undefined);
                              setValue('price_range_min', undefined);
                              setValue('price_range_max', undefined);
                            }}
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor="pricing_daily"
                            className="font-normal cursor-pointer"
                          >
                            Daily rate
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="pricing_exact"
                            name="pricing_type"
                            checked={pricingType === 'exact'}
                            onChange={() => {
                              setPricingType('exact');
                              setValue('hourly_rate', undefined);
                              setValue('daily_rate', undefined);
                              setValue('price_range_min', undefined);
                              setValue('price_range_max', undefined);
                            }}
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor="pricing_exact"
                            className="font-normal cursor-pointer"
                          >
                            Exact price
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="pricing_range"
                            name="pricing_type"
                            checked={pricingType === 'range'}
                            onChange={() => {
                              setPricingType('range');
                              setValue('exact_price', undefined);
                              setValue('hourly_rate', undefined);
                              setValue('daily_rate', undefined);
                            }}
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor="pricing_range"
                            className="font-normal cursor-pointer"
                          >
                            Price range
                          </Label>
                        </div>
                      </div>
                    </div>

                    {pricingType === 'hourly' && (
                      <div>
                        <Label htmlFor="hourly_rate">Hourly Rate (NZD)</Label>
                        <Input
                          id="hourly_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('hourly_rate', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    {pricingType === 'daily' && (
                      <div>
                        <Label htmlFor="daily_rate">Daily Rate (NZD)</Label>
                        <Input
                          id="daily_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('daily_rate', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    {pricingType === 'exact' && (
                      <div>
                        <Label htmlFor="exact_price">Exact Price (NZD)</Label>
                        <Input
                          id="exact_price"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('exact_price', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    {pricingType === 'range' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price_range_min">
                            Minimum Price (NZD)
                          </Label>
                          <Input
                            id="price_range_min"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('price_range_min', {
                              valueAsNumber: true,
                            })}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price_range_max">
                            Maximum Price (NZD)
                          </Label>
                          <Input
                            id="price_range_max"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('price_range_max', {
                              valueAsNumber: true,
                            })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
