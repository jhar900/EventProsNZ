'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import AddressAutosuggest from './AddressAutosuggest';
import BusinessLogoUpload from './BusinessLogoUpload';

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

const businessProfileSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location too long').optional(),
  service_areas: z
    .array(z.string())
    .min(1, 'At least one service area is required')
    .optional(),
  service_categories: z
    .array(z.string())
    .max(10, 'Too many service categories')
    .optional(),
  facebook_url: z
    .string()
    .url('Invalid Facebook URL')
    .optional()
    .or(z.literal('')),
  instagram_url: z
    .string()
    .url('Invalid Instagram URL')
    .optional()
    .or(z.literal('')),
  linkedin_url: z
    .string()
    .url('Invalid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  twitter_url: z
    .string()
    .url('Invalid Twitter URL')
    .optional()
    .or(z.literal('')),
  youtube_url: z
    .string()
    .url('Invalid YouTube URL')
    .optional()
    .or(z.literal('')),
  tiktok_url: z.string().url('Invalid TikTok URL').optional().or(z.literal('')),
});

type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

interface BusinessProfileFormProps {
  userId?: string | null; // Optional: for admin viewing other users
  onSuccess?: (businessProfile: any) => void;
  onError?: (error: string) => void;
}

export default function BusinessProfileForm({
  userId: propUserId,
  onSuccess,
  onError,
}: BusinessProfileFormProps) {
  const { user, refreshUser } = useAuth();
  // Use provided userId (for admin) or fall back to logged-in user
  const targetUserId = propUserId || user?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>(
    []
  );
  const [coverageType, setCoverageType] = useState<'regions' | 'nationwide'>(
    'regions'
  );

  const methods = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = methods;

  const selectedCategories = watch('service_categories') || [];
  const formServiceAreas = watch('service_areas') || [];

  // Sync form service_areas with selectedServiceAreas state
  useEffect(() => {
    if (Array.isArray(formServiceAreas) && formServiceAreas.length > 0) {
      const hasNationwide = formServiceAreas.includes('Nationwide');
      if (hasNationwide && coverageType !== 'nationwide') {
        setCoverageType('nationwide');
        setSelectedServiceAreas(['Nationwide']);
      } else if (!hasNationwide && coverageType === 'nationwide') {
        setCoverageType('regions');
        setSelectedServiceAreas(
          formServiceAreas.filter(area => NZ_REGIONS.includes(area))
        );
      } else if (!hasNationwide) {
        setSelectedServiceAreas(
          formServiceAreas.filter(area => NZ_REGIONS.includes(area))
        );
      }
    }
  }, [formServiceAreas, coverageType]);

  // Load service categories from API
  useEffect(() => {
    const loadServiceCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/service-categories');
        if (response.ok) {
          const data = await response.json();
          setServiceCategories(data.categories || []);
        } else {
          console.error('Failed to load service categories');
          // Fallback to empty array if API fails
          setServiceCategories([]);
        }
      } catch (error) {
        console.error('Error loading service categories:', error);
        setServiceCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadServiceCategories();
  }, []);

  // Load existing business profile data
  useEffect(() => {
    const loadBusinessProfile = async () => {
      // If viewing another user (admin), fetch their business profile
      if (propUserId && propUserId !== user?.id) {
        try {
          setIsLoading(true);
          const response = await fetch(
            `/api/admin/users/${propUserId}/business-profile`,
            {
              credentials: 'include',
            }
          );

          if (response.ok) {
            const data = await response.json();
            const businessProfile =
              data.businessProfile || data.business_profile;

            if (businessProfile) {
              const serviceAreas = businessProfile.service_areas || [];
              const hasNationwide =
                Array.isArray(serviceAreas) &&
                serviceAreas.includes('Nationwide');
              const initialCoverageType = hasNationwide
                ? 'nationwide'
                : 'regions';

              let finalServiceAreas: string[];
              if (initialCoverageType === 'nationwide') {
                finalServiceAreas = ['Nationwide'];
              } else {
                finalServiceAreas = Array.isArray(serviceAreas)
                  ? serviceAreas.filter(
                      area => area !== 'Nationwide' && NZ_REGIONS.includes(area)
                    )
                  : [];
              }

              setCoverageType(initialCoverageType);
              setSelectedServiceAreas(finalServiceAreas);

              reset({
                company_name: businessProfile.company_name || '',
                description: businessProfile.description || '',
                website: businessProfile.website || '',
                location: businessProfile.location || '',
                service_areas: finalServiceAreas,
                service_categories: businessProfile.service_categories || [],
                facebook_url: businessProfile.facebook_url || '',
                instagram_url: businessProfile.instagram_url || '',
                linkedin_url: businessProfile.linkedin_url || '',
                twitter_url: businessProfile.twitter_url || '',
                youtube_url: businessProfile.youtube_url || '',
                tiktok_url: businessProfile.tiktok_url || '',
              });
              setIsCreating(false);
            } else {
              // No business profile exists, show empty form
              reset({
                company_name: '',
                description: '',
                website: '',
                location: '',
                service_areas: [],
                service_categories: [],
                facebook_url: '',
                instagram_url: '',
                linkedin_url: '',
                twitter_url: '',
                youtube_url: '',
                tiktok_url: '',
              });
              setIsCreating(true);
            }
          } else {
            // API call failed, show error but still render form
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to load business profile:', errorData);
            onError?.(errorData.error || 'Failed to load business profile');
            // Still show empty form
            reset({
              company_name: '',
              description: '',
              website: '',
              location: '',
              service_areas: [],
              service_categories: [],
              facebook_url: '',
              instagram_url: '',
              linkedin_url: '',
              twitter_url: '',
              youtube_url: '',
              tiktok_url: '',
            });
            setIsCreating(true);
          }
        } catch (error) {
          console.error('Error loading business profile:', error);
          onError?.('Failed to load business profile');
          // Still show empty form
          reset({
            company_name: '',
            description: '',
            website: '',
            location: '',
            service_areas: [],
            service_categories: [],
            facebook_url: '',
            instagram_url: '',
            linkedin_url: '',
            twitter_url: '',
            youtube_url: '',
            tiktok_url: '',
          });
          setIsCreating(true);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Use logged-in user's business profile
      console.log('BusinessProfileForm useEffect - user:', user);
      console.log(
        'BusinessProfileForm useEffect - user.business_profile:',
        user?.business_profile
      );

      if (user?.business_profile) {
        console.log('Loading existing business profile data into form');
        const serviceAreas = user.business_profile.service_areas || [];
        const hasNationwide =
          Array.isArray(serviceAreas) && serviceAreas.includes('Nationwide');
        const initialCoverageType = hasNationwide ? 'nationwide' : 'regions';

        let finalServiceAreas: string[];
        if (initialCoverageType === 'nationwide') {
          finalServiceAreas = ['Nationwide'];
        } else {
          finalServiceAreas = Array.isArray(serviceAreas)
            ? serviceAreas.filter(
                area => area !== 'Nationwide' && NZ_REGIONS.includes(area)
              )
            : [];
        }

        setCoverageType(initialCoverageType);
        setSelectedServiceAreas(finalServiceAreas);

        reset({
          company_name: user.business_profile.company_name || '',
          description: user.business_profile.description || '',
          website: user.business_profile.website || '',
          location: user.business_profile.location || '',
          service_areas: finalServiceAreas,
          service_categories: user.business_profile.service_categories || [],
          facebook_url: user.business_profile.facebook_url || '',
          instagram_url: user.business_profile.instagram_url || '',
          linkedin_url: user.business_profile.linkedin_url || '',
          twitter_url: user.business_profile.twitter_url || '',
          youtube_url: user.business_profile.youtube_url || '',
          tiktok_url: user.business_profile.tiktok_url || '',
        });
        setIsCreating(false);
      } else {
        console.log('No business profile data found, setting to creating mode');
        setIsCreating(true);
      }
    };

    loadBusinessProfile();
  }, [user, propUserId, reset]);

  const onSubmit = async (data: BusinessProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null); // Clear success message on new submission

    try {
      console.log('Submitting business profile form:', { isCreating, data });

      // Ensure we have a valid user ID
      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      // Clean up social media URLs - convert empty strings to undefined
      // Ensure service_areas is included from the form state
      const cleanedData = {
        ...data,
        service_areas:
          selectedServiceAreas.length > 0
            ? selectedServiceAreas
            : data.service_areas || [],
        facebook_url: data.facebook_url?.trim() || undefined,
        instagram_url: data.instagram_url?.trim() || undefined,
        linkedin_url: data.linkedin_url?.trim() || undefined,
        twitter_url: data.twitter_url?.trim() || undefined,
        youtube_url: data.youtube_url?.trim() || undefined,
        tiktok_url: data.tiktok_url?.trim() || undefined,
      };

      const method = isCreating ? 'POST' : 'PUT';
      console.log('Submitting with method:', method, 'isCreating:', isCreating);
      // If viewing another user (admin), use admin API endpoint
      const apiEndpoint = propUserId
        ? `/api/admin/users/${propUserId}/business-profile`
        : '/api/user/business-profile';

      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...cleanedData,
          userData: user, // Include user data for authentication
        }),
      });

      console.log('API response status:', response.status);
      const result = await response.json();
      console.log('API response result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update business profile');
      }

      // Refresh user data
      await refreshUser();

      // Show success message
      setSuccessMessage(
        isCreating
          ? 'Business profile created successfully!'
          : 'Business profile updated successfully!'
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      onSuccess?.(result.businessProfile);
    } catch (err) {
      console.error('Business profile submission error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to update business profile';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = selectedCategories;
    if (checked) {
      if (!currentCategories.includes(category)) {
        currentCategories.push(category);
      }
    } else {
      const index = currentCategories.indexOf(category);
      if (index > -1) {
        currentCategories.splice(index, 1);
      }
    }
    reset({ ...watch(), service_categories: currentCategories });
  };

  const handleAreaToggle = (area: string) => {
    if (area === 'Nationwide') {
      // If clicking Nationwide, switch to nationwide mode
      handleCoverageTypeChange('nationwide');
      return;
    }

    const newAreas = selectedServiceAreas.includes(area)
      ? selectedServiceAreas.filter(a => a !== area)
      : [...selectedServiceAreas, area];

    setSelectedServiceAreas(newAreas);
    setValue('service_areas', newAreas, { shouldDirty: true });
  };

  const handleCoverageTypeChange = (type: 'regions' | 'nationwide') => {
    if (type === 'nationwide') {
      const nationwideAreas = ['Nationwide'];
      setCoverageType('nationwide');
      setSelectedServiceAreas(nationwideAreas);
      setValue('service_areas', nationwideAreas, { shouldDirty: true });
    } else {
      const regionsOnly = selectedServiceAreas.filter(
        area => area !== 'Nationwide' && NZ_REGIONS.includes(area)
      );
      setCoverageType('regions');
      setSelectedServiceAreas(regionsOnly);
      setValue('service_areas', regionsOnly, { shouldDirty: true });
    }
  };

  const selectAllRegions = () => {
    setSelectedServiceAreas(NZ_REGIONS);
    setValue('service_areas', NZ_REGIONS, { shouldDirty: true });
  };

  const clearAllRegions = () => {
    setSelectedServiceAreas([]);
    setValue('service_areas', [], { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <BusinessLogoUpload
        userId={propUserId}
        onSuccess={() => {
          setSuccessMessage('Business logo updated successfully!');
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
          // Reload business profile to get updated logo
          if (propUserId && propUserId !== user?.id) {
            // Trigger a reload by updating a dependency or calling loadBusinessProfile
            const loadBusinessProfile = async () => {
              try {
                const response = await fetch(
                  `/api/admin/users/${propUserId}/business-profile`,
                  {
                    credentials: 'include',
                  }
                );
                if (response.ok) {
                  const data = await response.json();
                  const businessProfile =
                    data.businessProfile || data.business_profile;
                  if (businessProfile) {
                    // Update form with latest data including logo
                    reset({
                      ...methods.getValues(),
                    });
                  }
                }
              } catch (error) {
                console.error('Error reloading business profile:', error);
              }
            };
            loadBusinessProfile();
          }
        }}
        onError={setError}
      />

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Business Information
          </h3>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="company_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name *
                </label>
                <input
                  {...register('company_name')}
                  type="text"
                  id="company_name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Business Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe your business and services..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700"
                >
                  Website
                </label>
                <input
                  {...register('website')}
                  type="url"
                  id="website"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://your-website.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.website.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Business Location
                </label>
                <AddressAutosuggest
                  name="location"
                  placeholder="Start typing your business location..."
                  onAddressSelect={(address, coordinates) => {
                    console.log('Selected business location:', address);
                    console.log('Coordinates:', coordinates);
                  }}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.location.message}
                  </p>
                )}
              </div>

              {/* Service Coverage Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Service Coverage
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="coverageType"
                      value="nationwide"
                      checked={coverageType === 'nationwide'}
                      onChange={() => handleCoverageTypeChange('nationwide')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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
                      Select Service Areas
                    </label>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={selectAllRegions}
                        className="text-xs text-blue-600 hover:text-blue-800"
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {region}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.service_areas && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.service_areas.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Categories
                </label>
                {loadingCategories ? (
                  <p className="text-sm text-gray-500">Loading categories...</p>
                ) : serviceCategories.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    No service categories available. Please contact support.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {serviceCategories.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={e =>
                            handleCategoryChange(category, e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {errors.service_categories && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.service_categories.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Social Media Links
                </label>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="facebook_url"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Facebook
                    </label>
                    <input
                      {...register('facebook_url')}
                      type="url"
                      id="facebook_url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://facebook.com/yourpage"
                    />
                    {errors.facebook_url && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.facebook_url.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="instagram_url"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Instagram
                    </label>
                    <input
                      {...register('instagram_url')}
                      type="url"
                      id="instagram_url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://instagram.com/yourhandle"
                    />
                    {errors.instagram_url && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.instagram_url.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="linkedin_url"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      LinkedIn
                    </label>
                    <input
                      {...register('linkedin_url')}
                      type="url"
                      id="linkedin_url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                    {errors.linkedin_url && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.linkedin_url.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="twitter_url"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Twitter/X
                    </label>
                    <input
                      {...register('twitter_url')}
                      type="url"
                      id="twitter_url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://twitter.com/yourhandle"
                    />
                    {errors.twitter_url && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.twitter_url.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="youtube_url"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      YouTube
                    </label>
                    <input
                      {...register('youtube_url')}
                      type="url"
                      id="youtube_url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://youtube.com/@yourchannel"
                    />
                    {errors.youtube_url && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.youtube_url.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="tiktok_url"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      TikTok
                    </label>
                    <input
                      {...register('tiktok_url')}
                      type="url"
                      id="tiktok_url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://tiktok.com/@yourhandle"
                    />
                    {errors.tiktok_url && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.tiktok_url.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end items-center">
                {successMessage && (
                  <div className="mr-4 bg-green-50 border border-green-200 rounded-md p-2">
                    <div className="flex items-center">
                      <svg
                        className="h-5 w-5 text-green-400 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-green-800">{successMessage}</p>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? isCreating
                      ? 'Creating...'
                      : 'Saving...'
                    : isCreating
                      ? 'Create Business Profile'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
