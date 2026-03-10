'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingPreview } from '@/components/features/onboarding/PreviewContext';

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

type ServiceFormData = z.infer<typeof serviceSchema>;

interface Service extends ServiceFormData {
  id: string;
}

interface ServicesPricingFormProps {
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const emptyDefaults: ServiceFormData = {
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
};

export function ServicesPricingForm({
  onComplete,
  onNext,
  onPrevious,
}: ServicesPricingFormProps) {
  const { user } = useAuth();
  const { isPreview } = useOnboardingPreview();

  const [services, setServices] = useState<Service[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [pricingType, setPricingType] = useState<
    'hourly' | 'daily' | 'exact' | 'range' | 'none'
  >('none');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: emptyDefaults,
  });

  const isFree = watch('is_free');
  const contactForPricing = watch('contact_for_pricing');
  const hidePrice = watch('hide_price');

  // Load existing services
  useEffect(() => {
    if (isPreview) {
      setIsFetching(false);
      return;
    }
    const load = async () => {
      if (!user?.id) {
        setIsFetching(false);
        return;
      }
      try {
        const res = await fetch('/api/profile/me/services', {
          headers: { 'x-user-id': user.id },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setServices(data.services || []);
        }
      } catch {
        // silently ignore
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, [user?.id, isPreview]);

  // Load service categories
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/service-categories', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const fullCategories = data.fullCategories || [];
          if (fullCategories.length > 0) {
            setAvailableServiceTypes(
              fullCategories.map((c: { name: string }) => c.name)
            );
          } else if (Array.isArray(data.categories)) {
            setAvailableServiceTypes(data.categories);
          }
        }
      } catch {
        // silently ignore
      } finally {
        setLoadingCategories(false);
      }
    };
    load();
  }, []);

  const openAddForm = () => {
    setEditingService(null);
    reset(emptyDefaults);
    setPricingType('none');
    setIsFormOpen(true);
  };

  const openEditForm = (service: Service) => {
    setEditingService(service);
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
    // Derive pricingType from existing data
    if (service.is_free || service.contact_for_pricing || service.hide_price) {
      setPricingType('none');
    } else if (service.hourly_rate) {
      setPricingType('hourly');
    } else if (service.daily_rate) {
      setPricingType('daily');
    } else if (service.exact_price) {
      setPricingType('exact');
    } else if (service.price_range_min || service.price_range_max) {
      setPricingType('range');
    } else {
      setPricingType('none');
    }
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingService(null);
    reset(emptyDefaults);
    setPricingType('none');
  };

  const onServiceSubmit = async (data: ServiceFormData) => {
    if (isPreview) {
      // In preview: manage local state only
      if (editingService) {
        setServices(prev =>
          prev.map(s =>
            s.id === editingService.id ? { ...data, id: editingService.id } : s
          )
        );
      } else {
        setServices(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
      }
      handleCancel();
      return;
    }

    if (!user?.id) {
      setError('You must be logged in');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const method = editingService ? 'PUT' : 'POST';
      const body = editingService ? { ...data, id: editingService.id } : data;

      const res = await fetch('/api/profile/me/services', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const result = await res.json();
        setServices(prev =>
          editingService
            ? prev.map(s => (s.id === editingService.id ? result.service : s))
            : [...prev, result.service]
        );
        handleCancel();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to save service');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    if (isPreview) {
      setServices(prev => prev.filter(s => s.id !== serviceId));
      return;
    }

    if (!user?.id) return;

    try {
      const res = await fetch(`/api/profile/me/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
        credentials: 'include',
      });
      if (res.ok) {
        setServices(prev => prev.filter(s => s.id !== serviceId));
      }
    } catch {
      // silently ignore
    }
  };

  const handleContinue = async () => {
    if (isPreview) {
      onComplete();
      onNext();
      return;
    }

    if (!user?.id) {
      setError('You must be logged in');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding/contractor/step3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        credentials: 'include',
        body: JSON.stringify({ services: [] }),
      });

      if (res.ok) {
        onComplete();
        onNext();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to complete step 3');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (service: Service) => {
    if (service.is_free) return 'Free';
    if (service.contact_for_pricing) return 'Contact for pricing';
    if (service.hide_price) return 'Price not shown';
    if (service.hourly_rate) return `$${service.hourly_rate}/hour`;
    if (service.daily_rate) return `$${service.daily_rate}/day`;
    if (service.exact_price) return `$${service.exact_price}`;
    if (service.price_range_min || service.price_range_max) {
      const min = service.price_range_min;
      const max = service.price_range_max;
      if (min && max) return `$${min} – $${max}`;
      if (min) return `From $${min}`;
      if (max) return `Up to $${max}`;
    }
    return 'Contact for pricing';
  };

  if (isFetching) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-center py-12">
        <span className="text-gray-500">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">
          Services &amp; Pricing
        </h2>
        <p className="text-gray-600 text-sm">
          Add the services you offer. You can add or update these later from
          your profile.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Services list */}
      {services.length === 0 && !isFormOpen ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">
            No services added yet. You can continue without adding any.
          </p>
          <Button
            type="button"
            onClick={openAddForm}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Service
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {services.map(service => (
              <div
                key={service.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {service.service_name || service.service_type}
                      </h3>
                      {service.service_type && (
                        <Badge variant="outline" className="text-xs">
                          {service.service_type}
                        </Badge>
                      )}
                      {!service.is_visible && (
                        <Badge variant="secondary" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-gray-500 text-sm mb-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatPrice(service)}
                      </div>
                      {service.availability && (
                        <span>Available: {service.availability}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!isFormOpen && (
            <Button type="button" variant="outline" onClick={openAddForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Another Service
            </Button>
          )}
        </>
      )}

      {/* Add / Edit form */}
      {isFormOpen && (
        <div className="border border-gray-200 rounded-lg p-5 space-y-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onServiceSubmit)} className="space-y-4">
            {/* Service Name */}
            <div>
              <Label htmlFor="service_name">Service Name *</Label>
              <Input
                id="service_name"
                {...register('service_name')}
                placeholder="e.g., Wedding Photography Package"
              />
              {errors.service_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.service_name.message}
                </p>
              )}
            </div>

            {/* Service Type + Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type">Service Type *</Label>
                <select
                  id="service_type"
                  {...register('service_type')}
                  disabled={loadingCategories}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">
                    {loadingCategories ? 'Loading...' : 'Select a service type'}
                  </option>
                  {availableServiceTypes.map(type => (
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
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  {...register('availability')}
                  placeholder="e.g., Weekends only, 24/7"
                />
              </div>
            </div>

            {/* Description */}
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
            <div className="space-y-3">
              <Label>Pricing Options</Label>

              <div className="space-y-2">
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
                        setPricingType('none');
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
                        setPricingType('none');
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
                        setPricingType('none');
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

              {/* Price type radios — only when no special option checked */}
              {!isFree && !contactForPricing && !hidePrice && (
                <div className="pt-3 border-t space-y-3">
                  <Label>Price Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(
                      [
                        { value: 'hourly', label: 'Hourly rate' },
                        { value: 'daily', label: 'Daily rate' },
                        { value: 'exact', label: 'Exact price' },
                        { value: 'range', label: 'Price range' },
                      ] as const
                    ).map(opt => (
                      <div
                        key={opt.value}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          id={`pricing_${opt.value}`}
                          name="pricing_type"
                          checked={pricingType === opt.value}
                          onChange={() => {
                            setPricingType(opt.value);
                            // Clear all other price fields
                            if (opt.value !== 'hourly')
                              setValue('hourly_rate', undefined);
                            if (opt.value !== 'daily')
                              setValue('daily_rate', undefined);
                            if (opt.value !== 'exact')
                              setValue('exact_price', undefined);
                            if (opt.value !== 'range') {
                              setValue('price_range_min', undefined);
                              setValue('price_range_max', undefined);
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <Label
                          htmlFor={`pricing_${opt.value}`}
                          className="font-normal cursor-pointer"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
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

            {/* Visibility */}
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

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSaving
                  ? 'Saving...'
                  : editingService
                    ? 'Update Service'
                    : 'Add Service'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Wizard navigation */}
      <div className="flex justify-between pt-2 border-t">
        <Button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Previous
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
