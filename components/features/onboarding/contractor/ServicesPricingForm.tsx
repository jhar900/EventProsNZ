'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

const serviceSchema = z.object({
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
  services: z.array(serviceSchema).min(1, 'At least one service is required'),
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

export function ServicesPricingForm({
  onComplete,
  onNext,
  onPrevious,
}: ServicesPricingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<ServicesPricingFormData>({
    resolver: zodResolver(servicesPricingSchema),
    defaultValues: {
      services: [
        {
          service_type: '',
          description: '',
          price_range_min: undefined,
          price_range_max: undefined,
          availability: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'services',
  });

  const services = watch('services');

  const addService = () => {
    append({
      service_type: '',
      description: '',
      price_range_min: undefined,
      price_range_max: undefined,
      availability: '',
    });
  };

  const removeService = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: ServicesPricingFormData) => {
    setIsSubmitting(true);
    setError(null);

    // Validate price ranges
    for (const service of data.services) {
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

    try {
      const response = await fetch('/api/onboarding/contractor/step3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      console.error('Services pricing submission error:', error);
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
          Tell us about the services you offer and your pricing
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {fields.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </Button>
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
                  >
                    <option value="">Select a service type</option>
                    {SERVICE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
