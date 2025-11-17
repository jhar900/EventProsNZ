'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { businessInfoSchema } from '@/lib/onboarding/validation';
import { AddressAutocomplete } from './AddressAutocomplete';

type BusinessDetailsFormData = z.infer<typeof businessInfoSchema>;

interface BusinessDetailsFormProps {
  data: {
    company_name: string;
    position: string;
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

const NZ_REGIONS = [
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
  'Invercargill',
  'Whangarei',
  'New Plymouth',
  'Whanganui',
  'Gisborne',
  'Timaru',
  'Pukekohe',
  'Masterton',
  'Levin',
  'Ashburton',
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
  const [coverageType, setCoverageType] = useState<'regions' | 'nationwide'>(
    data.service_areas.includes('Nationwide') ? 'nationwide' : 'regions'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<BusinessDetailsFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      ...data,
      service_areas: data.service_areas,
    },
  });

  const watchedServiceAreas = watch('service_areas', data.service_areas);

  // Update form when data prop changes (e.g., when navigating back)
  useEffect(() => {
    reset({
      ...data,
      service_areas: data.service_areas,
    });
    setBusinessAddress(data.business_address);

    // Determine coverage type based on whether "Nationwide" is in the array
    const hasNationwide = data.service_areas.includes('Nationwide');
    const initialCoverageType = hasNationwide ? 'nationwide' : 'regions';
    setCoverageType(initialCoverageType);

    // Set selected service areas based on coverage type
    let finalServiceAreas: string[];
    if (initialCoverageType === 'nationwide') {
      finalServiceAreas = ['Nationwide'];
    } else {
      finalServiceAreas = data.service_areas.filter(
        area => area !== 'Nationwide' && NZ_REGIONS.includes(area)
      );
    }
    setSelectedServiceAreas(finalServiceAreas);
  }, [data, reset]);

  const onSubmit = (formData: BusinessDetailsFormData) => {
    onComplete({ ...formData, service_areas: selectedServiceAreas });
  };

  const handleAddressChange = (newAddress: string) => {
    setBusinessAddress(newAddress);
    setValue('business_address', newAddress, { shouldValidate: true });
  };

  const handleAreaToggle = (area: string) => {
    // If "Nationwide" is currently selected, switch to regions mode and clear it
    if (selectedServiceAreas.includes('Nationwide')) {
      setCoverageType('regions');
      const newAreas = [area]; // Start with just the selected region
      setSelectedServiceAreas(newAreas);
      setValue('service_areas', newAreas, {
        shouldValidate: true,
        shouldDirty: true,
      });
      return;
    }

    // Normal toggle behavior for individual regions
    const newAreas = selectedServiceAreas.includes(area)
      ? selectedServiceAreas.filter(a => a !== area)
      : [...selectedServiceAreas, area];

    setSelectedServiceAreas(newAreas);
    setValue('service_areas', newAreas, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCoverageTypeChange = (type: 'regions' | 'nationwide') => {
    if (type === 'nationwide') {
      // When selecting nationwide, explicitly clear ALL individual regions and set only "Nationwide"
      const nationwideAreas = ['Nationwide'];

      // Update coverage type first
      setCoverageType('nationwide');

      // Immediately update state - this will trigger re-render
      setSelectedServiceAreas(nationwideAreas);

      // Update form value immediately - ensure we're setting exactly ['Nationwide']
      setValue('service_areas', nationwideAreas, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      // When switching to regions, clear "Nationwide" if it exists
      const regionsOnly = selectedServiceAreas.filter(
        area => area !== 'Nationwide' && NZ_REGIONS.includes(area)
      );
      setCoverageType('regions');
      setSelectedServiceAreas(regionsOnly);
      setValue('service_areas', regionsOnly, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const selectAllRegions = () => {
    setSelectedServiceAreas(NZ_REGIONS);
    setValue('service_areas', NZ_REGIONS, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const clearAllRegions = () => {
    setSelectedServiceAreas([]);
    setValue('service_areas', [], { shouldValidate: true, shouldDirty: true });
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

      <form
        onSubmit={e => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        className="space-y-6"
      >
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
            htmlFor="position"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Position/Role in the Business *
          </label>
          <input
            {...register('position')}
            type="text"
            id="position"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g., Event Manager, Owner, Director, Coordinator"
          />
          {errors.position && (
            <p className="mt-1 text-sm text-red-600">
              {errors.position.message}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Describe your business and the types of events you manage"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Service Coverage Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Service Coverage *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="coverageType"
                value="nationwide"
                checked={coverageType === 'nationwide'}
                onChange={() => handleCoverageTypeChange('nationwide')}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                Nationwide coverage
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="coverageType"
                value="regions"
                checked={coverageType === 'regions'}
                onChange={() => handleCoverageTypeChange('regions')}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                Specific regions in New Zealand
              </span>
            </label>
          </div>
        </div>

        {/* Region Selection */}
        {coverageType === 'regions' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Service Areas *
              </label>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={selectAllRegions}
                  className="text-xs text-orange-600 hover:text-orange-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllRegions}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {NZ_REGIONS.map(region => (
                <label key={region} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedServiceAreas.includes(region)}
                    onChange={() => handleAreaToggle(region)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{region}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Selected Areas Summary */}
        {selectedServiceAreas.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Areas ({selectedServiceAreas.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedServiceAreas
                .filter(area => {
                  // If "Nationwide" is selected, only show "Nationwide" and filter out all regions
                  if (selectedServiceAreas.includes('Nationwide')) {
                    return area === 'Nationwide';
                  }
                  // Otherwise, show all selected areas (but filter out "Nationwide" if it somehow exists)
                  return area !== 'Nationwide';
                })
                .map(area => (
                  <span
                    key={area}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => handleAreaToggle(area)}
                      className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-orange-400 hover:bg-orange-200 hover:text-orange-500"
                    >
                      <span className="sr-only">Remove</span>
                      <svg
                        className="h-2 w-2"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 8 8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeWidth="1.5"
                          d="M1 1l6 6m0-6l-6 6"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}

        {errors.service_areas && (
          <p className="mt-1 text-sm text-red-600">
            {errors.service_areas.message}
          </p>
        )}

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
