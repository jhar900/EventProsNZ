'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const serviceSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  service_type: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  price_range_min: z
    .number()
    .min(0, 'Minimum price must be non-negative')
    .optional(),
  price_range_max: z
    .number()
    .min(0, 'Maximum price must be non-negative')
    .optional(),
  availability: z.string().optional(),
});

const servicesPricingSchema = z.object({
  services: z.array(serviceSchema).optional().default([]),
});

type ServicesPricingFormData = z.infer<typeof servicesPricingSchema>;

interface ServicesPricingFormProps {
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
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

export function ServicesPricingForm({
  onComplete,
  onNext,
  onPrevious,
}: ServicesPricingFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm<ServicesPricingFormData>({
    resolver: zodResolver(servicesPricingSchema),
    defaultValues: {
      services: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'services',
  });

  const services = watch('services');

  // Load existing services when component mounts
  useEffect(() => {
    const loadExistingServices = async () => {
      if (!user?.id) {
        return;
      }

      try {
        const response = await fetch('/api/user/services', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          const existingServices = result.services || [];

          console.log(
            'ServicesPricingForm - Fetched services from API:',
            existingServices
          );

          if (existingServices.length > 0) {
            // Use replace to update the field array with existing services
            replace(existingServices);
            // Also reset the form to ensure all values are set
            reset({
              services: existingServices,
            });
            console.log(
              'ServicesPricingForm - Loaded existing services:',
              existingServices
            );
          } else {
            console.log('ServicesPricingForm - No existing services found');
          }
        } else {
          console.error(
            'ServicesPricingForm - Failed to fetch services:',
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        console.error('Failed to load existing services:', error);
        // Silently fail - user might not have services yet
      }
    };

    loadExistingServices();
  }, [user?.id, reset]);

  // Load business profile to get selected service categories
  useEffect(() => {
    const loadServiceCategories = async () => {
      if (!user?.id) {
        setLoadingCategories(false);
        return;
      }

      try {
        const response = await fetch('/api/user/business-profile', {
          method: 'GET',
          headers: {
            'x-user-id': user.id,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          // API returns 'businessProfile' (camelCase), not 'business_profile'
          const businessProfile =
            result.businessProfile || result.business_profile;

          console.log(
            'ServicesPricingForm - Business profile:',
            businessProfile
          );
          console.log(
            'ServicesPricingForm - Service categories:',
            businessProfile?.service_categories
          );

          if (
            businessProfile?.service_categories &&
            Array.isArray(businessProfile.service_categories) &&
            businessProfile.service_categories.length > 0
          ) {
            // Map selected categories to available service types
            const selectedCategories = businessProfile.service_categories;
            const allowedServiceTypes = new Set<string>();

            console.log(
              'ServicesPricingForm - Selected categories:',
              selectedCategories
            );
            console.log(
              'ServicesPricingForm - Mapping keys:',
              Object.keys(CATEGORY_TO_SERVICE_TYPE_MAP)
            );

            selectedCategories.forEach((category: string) => {
              // Trim whitespace and try exact match first
              const trimmedCategory = category.trim();
              let serviceTypes = CATEGORY_TO_SERVICE_TYPE_MAP[trimmedCategory];

              // If no exact match, try case-insensitive match
              if (!serviceTypes || serviceTypes.length === 0) {
                const matchingKey = Object.keys(
                  CATEGORY_TO_SERVICE_TYPE_MAP
                ).find(
                  key => key.toLowerCase() === trimmedCategory.toLowerCase()
                );
                if (matchingKey) {
                  serviceTypes = CATEGORY_TO_SERVICE_TYPE_MAP[matchingKey];
                  console.log(
                    `ServicesPricingForm - Case-insensitive match found: "${category}" -> "${matchingKey}"`
                  );
                }
              }

              // Default to empty array if still no match
              serviceTypes = serviceTypes || [];

              console.log(
                `ServicesPricingForm - Category "${category}" (trimmed: "${trimmedCategory}") maps to:`,
                serviceTypes
              );
              if (serviceTypes.length === 0) {
                console.warn(
                  `ServicesPricingForm - No mapping found for category: "${category}"`
                );
                console.warn(
                  `ServicesPricingForm - Available mapping keys:`,
                  Object.keys(CATEGORY_TO_SERVICE_TYPE_MAP)
                );
              }
              serviceTypes.forEach(type => allowedServiceTypes.add(type));
            });

            console.log(
              'ServicesPricingForm - Allowed service types:',
              Array.from(allowedServiceTypes)
            );

            // If no categories selected or mapping found, allow all service types
            // Otherwise, filter to only allowed types
            const filteredTypes =
              allowedServiceTypes.size > 0
                ? SERVICE_TYPES.filter(type => allowedServiceTypes.has(type))
                : SERVICE_TYPES;

            console.log(
              'ServicesPricingForm - Filtered service types:',
              filteredTypes
            );
            setAvailableServiceTypes(filteredTypes);
          } else {
            // No categories selected, allow all service types
            console.log(
              'ServicesPricingForm - No categories found, allowing all service types'
            );
            setAvailableServiceTypes(SERVICE_TYPES);
          }
        } else {
          // If profile doesn't exist yet, allow all service types
          setAvailableServiceTypes(SERVICE_TYPES);
        }
      } catch (error) {
        console.error('Failed to load service categories:', error);
        // On error, allow all service types
        setAvailableServiceTypes(SERVICE_TYPES);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadServiceCategories();
  }, [user?.id]);

  const addService = () => {
    // If there's only one available service type, auto-select it
    const defaultServiceType =
      availableServiceTypes.length === 1 ? availableServiceTypes[0] : '';

    append({
      service_name: '',
      service_type: defaultServiceType,
      description: '',
      price_range_min: undefined,
      price_range_max: undefined,
      availability: '',
    });
  };

  const removeService = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: ServicesPricingFormData) => {
    setIsSubmitting(true);
    setError(null);

    // Filter out incomplete services (those without a service_name or service_type)
    const validServices = (data.services || []).filter(
      service =>
        service.service_name &&
        service.service_name.trim() !== '' &&
        service.service_type &&
        service.service_type.trim() !== ''
    );

    // Validate price ranges for valid services
    for (const service of validServices) {
      if (
        service.price_range_min &&
        service.price_range_max &&
        service.price_range_min > service.price_range_max
      ) {
        setError('Minimum price cannot be greater than maximum price');
        setIsSubmitting(false);
        return;
      }
    }

    // Check if user is authenticated before submitting
    if (!user) {
      setError('You must be logged in to submit this form');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/onboarding/contractor/step3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id, // Send user ID in header - same as other steps
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          services: validServices,
        }),
      });

      if (response.ok) {
        onComplete();
        onNext();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save services and pricing');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Services & Pricing
        </h2>
        <p className="text-gray-600">
          Tell us about the services you offer and your pricing (optional)
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">
              No services added yet. You can add services now or continue
              without adding any.
            </p>
            <Button
              type="button"
              onClick={addService}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Add Your First Service
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Service {index + 1}
                    </h3>
                    <Button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Name *
                      </label>
                      <input
                        {...register(`services.${index}.service_name`)}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Wedding Photography Package"
                      />
                      {errors.services?.[index]?.service_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.services[index]?.service_name?.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Type *
                        </label>
                        <select
                          {...register(`services.${index}.service_type`)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        {availableServiceTypes.length === 0 &&
                          !loadingCategories && (
                            <p className="mt-1 text-sm text-amber-600">
                              Please select service categories in the Business
                              Information section first.
                            </p>
                          )}
                        {errors.services?.[index]?.service_type && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.services[index]?.service_type?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Availability
                        </label>
                        <input
                          {...register(`services.${index}.availability`)}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Weekends only, 24/7, etc."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register(`services.${index}.description`)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe this service in detail"
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Price (NZD)
                      </label>
                      <input
                        {...register(`services.${index}.price_range_min`, {
                          valueAsNumber: true,
                        })}
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Price (NZD)
                      </label>
                      <input
                        {...register(`services.${index}.price_range_max`, {
                          valueAsNumber: true,
                        })}
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                onClick={addService}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                + Add Another Service
              </Button>
            </div>
          </>
        )}

        <div className="flex justify-between">
          <Button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Previous
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}
