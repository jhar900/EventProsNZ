'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { businessInfoSchema } from '@/lib/onboarding/validation';
import { AddressAutocomplete } from './AddressAutocomplete';

type BusinessDetailsFormData = z.infer<typeof businessInfoSchema>;

interface BusinessDetailsFormProps {
  data: {
    company_name: string;
    business_address: string;
    nzbn: string;
    description: string;
    service_areas: string[];
    social_links: {
      website: string;
      facebook: string;
      instagram: string;
      linkedin: string;
    };
  };
  onComplete: (data: BusinessDetailsFormData) => void;
  isLoading: boolean;
}

const SERVICE_AREAS = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Napier',
  'Dunedin',
  'Palmerston North',
  'Nelson',
  'Rotorua',
  'New Plymouth',
  'Whangarei',
  'Invercargill',
  'Whanganui',
  'Gisborne',
  'Nationwide',
];

export function BusinessDetailsForm({
  data,
  onComplete,
  isLoading,
}: BusinessDetailsFormProps) {
  const [businessAddress, setBusinessAddress] = useState(data.business_address);
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>(
    data.service_areas
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BusinessDetailsFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      ...data,
      service_areas: data.service_areas,
    },
  });

  const watchedServiceAreas = watch('service_areas', data.service_areas);

  const onSubmit = (formData: BusinessDetailsFormData) => {
    onComplete({ ...formData, service_areas: selectedServiceAreas });
  };

  const handleAddressChange = (newAddress: string) => {
    setBusinessAddress(newAddress);
    setValue('business_address', newAddress, { shouldValidate: true });
  };

  const handleServiceAreaToggle = (area: string) => {
    const newAreas = selectedServiceAreas.includes(area)
      ? selectedServiceAreas.filter(a => a !== area)
      : [...selectedServiceAreas, area];

    setSelectedServiceAreas(newAreas);
    setValue('service_areas', newAreas, { shouldValidate: true });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Business Information
        </h2>
        <p className="text-gray-600">
          Tell us about your business to help contractors find you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="company_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Company Name *
          </label>
          <input
            {...register('company_name')}
            type="text"
            id="company_name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your company name"
          />
          {errors.company_name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.company_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="business_address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Business Address *
          </label>
          <AddressAutocomplete
            value={businessAddress}
            onChange={handleAddressChange}
            placeholder="Enter your business address"
            error={errors.business_address?.message}
          />
        </div>

        <div>
          <label
            htmlFor="nzbn"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            NZBN (New Zealand Business Number) - Optional
          </label>
          <input
            {...register('nzbn')}
            type="text"
            id="nzbn"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your NZBN (optional)"
          />
          <p className="mt-1 text-sm text-gray-500">
            Your NZBN helps verify your business and build trust with
            contractors
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Business Description *
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your business and the types of events you manage"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Areas *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SERVICE_AREAS.map(area => (
              <label
                key={area}
                className="flex items-center p-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedServiceAreas.includes(area)}
                  onChange={() => handleServiceAreaToggle(area)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{area}</span>
              </label>
            ))}
          </div>
          {errors.service_areas && (
            <p className="mt-1 text-sm text-red-600">
              {errors.service_areas.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Social Media Links (Optional)
          </label>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="website"
                className="block text-sm text-gray-600 mb-1"
              >
                Website
              </label>
              <input
                {...register('social_links.website')}
                type="url"
                id="website"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="facebook"
                  className="block text-sm text-gray-600 mb-1"
                >
                  Facebook
                </label>
                <input
                  {...register('social_links.facebook')}
                  type="url"
                  id="facebook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div>
                <label
                  htmlFor="instagram"
                  className="block text-sm text-gray-600 mb-1"
                >
                  Instagram
                </label>
                <input
                  {...register('social_links.instagram')}
                  type="url"
                  id="instagram"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://instagram.com/yourpage"
                />
              </div>

              <div>
                <label
                  htmlFor="linkedin"
                  className="block text-sm text-gray-600 mb-1"
                >
                  LinkedIn
                </label>
                <input
                  {...register('social_links.linkedin')}
                  type="url"
                  id="linkedin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
