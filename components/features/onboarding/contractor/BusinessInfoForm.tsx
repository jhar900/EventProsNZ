'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Building2 } from 'lucide-react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { useAuth } from '@/hooks/useAuth';

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

const businessInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  business_address: z.string().min(5, 'Business address is required'),
  nzbn: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  service_areas: z
    .array(z.string())
    .min(1, 'At least one service area is required'),
  service_categories: z
    .array(z.string())
    .min(1, 'At least one service category is required'),
  logo_url: z
    .string()
    .min(1, 'Company logo is required')
    .url('Company logo must be a valid URL'),
  social_links: z
    .object({
      website: z.string().url().optional().or(z.literal('')),
      facebook: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      linkedin: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

interface BusinessInfoFormProps {
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function BusinessInfoForm({
  onComplete,
  onNext,
  onPrevious,
}: BusinessInfoFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>(
    []
  );
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<
    string[]
  >([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [coverageType, setCoverageType] = useState<'regions' | 'nationwide'>(
    'regions'
  );
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [initialFormData, setInitialFormData] =
    useState<BusinessInfoFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: initialFormData || {
      service_areas: [],
      service_categories: [],
      social_links: {
        website: '',
        facebook: '',
        instagram: '',
        linkedin: '',
        twitter: '',
      },
    },
  });

  const socialLinks = watch('social_links');
  const logoUrl = watch('logo_url');

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

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      if (!user?.id) {
        setUploadError('User not authenticated');
        return;
      }

      const response = await fetch('/api/user/business-logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'x-user-id': user.id,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload logo');
      }

      // Set the logo URL from the response
      if (result.logo_url) {
        setValue('logo_url', result.logo_url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Load existing business profile data when component mounts
  // Wait for service categories to be loaded first
  useEffect(() => {
    const loadBusinessProfileData = async () => {
      if (!user?.id || loadingCategories) return;

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
          const businessProfile =
            result.businessProfile || result.business_profile;

          if (businessProfile) {
            // Get service areas (handle both array and single value)
            const rawServiceAreas = businessProfile.service_areas || [];
            const serviceAreas = Array.isArray(rawServiceAreas)
              ? rawServiceAreas
              : [];

            // Determine coverage type based on whether "Nationwide" is in the array
            const hasNationwide = serviceAreas.includes('Nationwide');
            const initialCoverageType = hasNationwide
              ? 'nationwide'
              : 'regions';

            setCoverageType(initialCoverageType);

            // Set selected service areas based on coverage type
            let finalServiceAreas: string[];
            if (initialCoverageType === 'nationwide') {
              // For nationwide, set to ['Nationwide']
              finalServiceAreas = ['Nationwide'];
            } else {
              // For regions, filter out "Nationwide" and only keep actual region names
              finalServiceAreas = serviceAreas.filter(
                area => area !== 'Nationwide' && NZ_REGIONS.includes(area)
              );
            }

            setSelectedServiceAreas(finalServiceAreas);
            setValue('service_areas', finalServiceAreas, {
              shouldDirty: false,
            });

            // Get service categories (handle both array and single value)
            // Only filter if serviceCategories is loaded
            const profileCategories = businessProfile.service_categories || [];
            const validCategories = Array.isArray(profileCategories)
              ? serviceCategories.length > 0
                ? profileCategories.filter(cat =>
                    serviceCategories.includes(cat)
                  )
                : profileCategories // If categories not loaded yet, use all from profile
              : [];
            setSelectedServiceCategories(validCategories);
            setValue('service_categories', validCategories, {
              shouldDirty: false,
            });

            // Get social links - handle different possible formats
            let socialLinksData = {
              website: '',
              facebook: '',
              instagram: '',
              linkedin: '',
              twitter: '',
            };

            if (businessProfile.social_links) {
              // If social_links is an object, use it directly
              if (typeof businessProfile.social_links === 'object') {
                socialLinksData = {
                  website: businessProfile.social_links.website || '',
                  facebook: businessProfile.social_links.facebook || '',
                  instagram: businessProfile.social_links.instagram || '',
                  linkedin: businessProfile.social_links.linkedin || '',
                  twitter: businessProfile.social_links.twitter || '',
                };
              }
            } else {
              // Try individual fields (legacy format)
              socialLinksData = {
                website: businessProfile.website || '',
                facebook: businessProfile.facebook_url || '',
                instagram: businessProfile.instagram_url || '',
                linkedin: businessProfile.linkedin_url || '',
                twitter: businessProfile.twitter_url || '',
              };
            }

            // Populate form with existing data
            // Use the same finalServiceAreas we calculated above
            const formData = {
              company_name: businessProfile.company_name || '',
              business_address:
                businessProfile.business_address ||
                businessProfile.location ||
                '',
              nzbn: businessProfile.nzbn || '',
              description: businessProfile.description || '',
              service_areas: finalServiceAreas,
              service_categories: validCategories,
              logo_url: businessProfile.logo_url || '',
              social_links: socialLinksData,
            };

            // Store initial form data
            setInitialFormData(formData);
            setIsDataLoaded(true);

            // Reset the form with all data - this should update all registered fields
            reset(formData, {
              keepDefaultValues: false,
            });

            // Immediately set state for checkboxes/selects
            setSelectedServiceAreas(finalServiceAreas);
            setSelectedServiceCategories(validCategories);
            setCoverageType(initialCoverageType);

            // Use a small delay to ensure form is ready, then set all values explicitly
            // This ensures fields that might not be registered properly get updated
            setTimeout(() => {
              // Explicitly set each field to ensure they're updated
              setValue('company_name', formData.company_name, {
                shouldDirty: false,
                shouldValidate: false,
              });
              setValue('business_address', formData.business_address, {
                shouldDirty: false,
                shouldValidate: false,
              });
              setValue('nzbn', formData.nzbn, {
                shouldDirty: false,
                shouldValidate: false,
              });
              setValue('description', formData.description, {
                shouldDirty: false,
                shouldValidate: false,
              });
              setValue('logo_url', formData.logo_url, {
                shouldDirty: false,
                shouldValidate: false,
              });
              setValue('service_areas', finalServiceAreas, {
                shouldDirty: false,
                shouldValidate: false,
              });
              setValue('service_categories', validCategories, {
                shouldDirty: false,
                shouldValidate: false,
              });
              setValue('social_links', socialLinksData, {
                shouldDirty: false,
                shouldValidate: false,
              });
            }, 300);
          }
        }
      } catch (error) {
        // Silently fail - user might not have a business profile yet
      }
    };

    loadBusinessProfileData();
  }, [user?.id, reset, setValue, loadingCategories, serviceCategories, watch]);

  // Sync form's service_areas with selectedServiceAreas state
  // This ensures checkboxes reflect the form state
  const formServiceAreas = watch('service_areas');
  useEffect(() => {
    // Skip sync if we're in nationwide mode - let handleCoverageTypeChange manage it
    if (coverageType === 'nationwide') {
      // In nationwide mode, ensure state only contains "Nationwide"
      setSelectedServiceAreas(prev => {
        const hasNationwide = prev.includes('Nationwide');
        const hasRegions = prev.some(area => NZ_REGIONS.includes(area));

        // If we have regions but no "Nationwide", or if we have both, clean it up
        if (hasRegions || (hasNationwide && prev.length > 1)) {
          return ['Nationwide'];
        }

        // If we only have "Nationwide", keep it
        if (hasNationwide && prev.length === 1) {
          return prev;
        }

        // Otherwise, set to ["Nationwide"]
        return ['Nationwide'];
      });
      return;
    }

    if (
      formServiceAreas &&
      Array.isArray(formServiceAreas) &&
      formServiceAreas.length > 0
    ) {
      // If "Nationwide" is in the form, filter out all individual regions
      let areasToSync = formServiceAreas;
      if (formServiceAreas.includes('Nationwide')) {
        areasToSync = formServiceAreas.filter(
          area => area !== 'Nationwide' && NZ_REGIONS.includes(area)
        );
      }

      // Only update if different to avoid infinite loops
      const formAreasString = JSON.stringify([...areasToSync].sort());
      const stateAreasString = JSON.stringify([...selectedServiceAreas].sort());
      if (formAreasString !== stateAreasString) {
        setSelectedServiceAreas(areasToSync);
      }
    } else if (
      formServiceAreas &&
      Array.isArray(formServiceAreas) &&
      formServiceAreas.length === 0 &&
      selectedServiceAreas.length > 0 &&
      coverageType === 'regions'
    ) {
      // If form has empty array but state has values, sync to empty (only in regions mode)
      setSelectedServiceAreas([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formServiceAreas, coverageType, selectedServiceAreas]);

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

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedServiceCategories.includes(category)
      ? selectedServiceCategories.filter(c => c !== category)
      : [...selectedServiceCategories, category];

    setSelectedServiceCategories(newCategories);
    setValue('service_categories', newCategories, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCoverageTypeChange = (type: 'regions' | 'nationwide') => {
    if (type === 'nationwide') {
      // When selecting nationwide, explicitly clear ALL individual regions and set only "Nationwide"
      // First, filter out ALL regions from current selection to ensure clean state
      const currentAreas = selectedServiceAreas.filter(
        area => !NZ_REGIONS.includes(area)
      );
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

      // Force a second update to ensure form state is clean
      setTimeout(() => {
        const currentFormAreas = watch('service_areas');
        if (
          Array.isArray(currentFormAreas) &&
          currentFormAreas.some(area => NZ_REGIONS.includes(area))
        ) {
          setValue('service_areas', ['Nationwide'], {
            shouldValidate: true,
            shouldDirty: true,
          });
          setSelectedServiceAreas(['Nationwide']);
        }
      }, 0);
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

  const onSubmit = async (data: BusinessInfoFormData) => {
    setIsSubmitting(true);
    setError(null);

    // Check if user is authenticated before submitting
    if (!user) {
      setError('You must be logged in to submit this form');
      setIsSubmitting(false);
      return;
    }

    // Validate service areas and categories are selected
    if (selectedServiceAreas.length === 0) {
      setError('Please select at least one service area');
      setIsSubmitting(false);
      return;
    }

    if (selectedServiceCategories.length === 0) {
      setError('Please select at least one service category');
      setIsSubmitting(false);
      return;
    }

    // Clean up data - remove empty logo_url
    const cleanedData = {
      ...data,
      logo_url:
        data.logo_url && data.logo_url.trim() !== ''
          ? data.logo_url
          : undefined,
    };

    // Update data with selected service areas and categories
    const formData = {
      ...cleanedData,
      service_areas: selectedServiceAreas,
      service_categories: selectedServiceCategories,
    };

    try {
      const response = await fetch('/api/onboarding/contractor/step2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id, // Send user ID in header - same as profile settings
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(formData),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        setError('Invalid response from server');
        return;
      }

      if (response.ok) {
        onComplete();
        onNext();
      } else {
        const errorMessage = responseData.details
          ? `${responseData.error}: ${responseData.details}`
          : responseData.error || 'Failed to save business information';
        setError(errorMessage);
        console.error('Business info submission error:', {
          status: response.status,
          error: responseData,
        });
      }
    } catch (error) {
      console.error('Business info submission exception:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Business Information
        </h2>
        <p className="text-gray-600">
          Tell us about your business and the services you offer
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{uploadError}</p>
        </div>
      )}

      <form
        key={isDataLoaded ? 'form-loaded' : 'form-loading'}
        onSubmit={handleSubmit(onSubmit, errors => {
          console.error('Form validation errors:', errors);
          // Show first validation error
          const firstError = Object.values(errors)[0];
          if (firstError) {
            setError(firstError.message || 'Please fix the form errors');
          }
        })}
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
            type="text"
            id="company_name"
            value={watch('company_name') || ''}
            onChange={e =>
              setValue('company_name', e.target.value, { shouldDirty: true })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your company name"
          />
          {errors.company_name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.company_name.message}
            </p>
          )}
        </div>

        {/* Company Logo Upload */}
        <div>
          <label
            htmlFor="logo-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Company Logo / Photo *
          </label>
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
            <Avatar className="h-20 w-20">
              <AvatarImage src={logoUrl} />
              <AvatarFallback>
                <Building2 className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <label htmlFor="logo-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </label>
              <input
                ref={fileInputRef}
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={isUploading}
              />
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG or WebP. Max size 5MB.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="business_address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Business Address *
          </label>
          <AddressAutocomplete
            value={watch('business_address') || ''}
            onChange={value => setValue('business_address', value)}
            placeholder="Enter your business address"
            id="business_address"
          />
          {errors.business_address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.business_address.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="nzbn"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            NZBN (New Zealand Business Number) - Optional
          </label>
          <input
            type="text"
            id="nzbn"
            value={watch('nzbn') || ''}
            onChange={e =>
              setValue('nzbn', e.target.value, { shouldDirty: true })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your NZBN (optional)"
          />
          {errors.nzbn && (
            <p className="mt-1 text-sm text-red-600">{errors.nzbn.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Business Description *
          </label>
          <textarea
            id="description"
            rows={4}
            value={watch('description') || ''}
            onChange={e =>
              setValue('description', e.target.value, { shouldDirty: true })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your business and what makes you unique"
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
                Select Service Areas *
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
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => handleAreaToggle(area)}
                      className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500"
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
                          d="m1 1 6 6m0-6-6 6"
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

        {/* Service Categories Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Service Categories *
          </label>
          {loadingCategories ? (
            <p className="text-sm text-gray-500">Loading categories...</p>
          ) : serviceCategories.length === 0 ? (
            <p className="text-sm text-amber-600">
              No service categories available. Please contact support.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
              {serviceCategories.map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedServiceCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category}</span>
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

        {/* Selected Categories Summary */}
        {selectedServiceCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Categories ({selectedServiceCategories.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedServiceCategories.map(category => (
                <span
                  key={category}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {category}
                  <button
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-green-400 hover:bg-green-200 hover:text-green-500"
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
                        d="m1 1 6 6m0-6-6 6"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Social Media Links (Optional)
          </label>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="website"
                className="block text-xs text-gray-600 mb-1"
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
            <div>
              <label
                htmlFor="facebook"
                className="block text-xs text-gray-600 mb-1"
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
                className="block text-xs text-gray-600 mb-1"
              >
                Instagram
              </label>
              <input
                {...register('social_links.instagram')}
                type="url"
                id="instagram"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
            <div>
              <label
                htmlFor="linkedin"
                className="block text-xs text-gray-600 mb-1"
              >
                LinkedIn
              </label>
              <input
                {...register('social_links.linkedin')}
                type="url"
                id="linkedin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label
                htmlFor="twitter"
                className="block text-xs text-gray-600 mb-1"
              >
                Twitter
              </label>
              <input
                {...register('social_links.twitter')}
                type="url"
                id="twitter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
          </div>
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
