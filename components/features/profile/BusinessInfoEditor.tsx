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
import { X, Plus } from 'lucide-react';

const businessInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  business_address: z.string().optional(),
  nzbn: z.string().optional(),
  description: z.string().optional(),
  service_areas: z.array(z.string()).optional(),
  social_links: z.record(z.string()).optional(),
});

type BusinessInfoForm = z.infer<typeof businessInfoSchema>;

interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  business_address?: string;
  nzbn?: string;
  description?: string;
  service_areas?: string[];
  social_links?: Record<string, string>;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface BusinessInfoEditorProps {
  businessProfile: BusinessProfile | null;
  onUpdate: (businessProfile: BusinessProfile) => void;
}

const SERVICE_AREAS = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Napier',
  'Hastings',
  'Dunedin',
  'Palmerston North',
  'Nelson',
  'Rotorua',
  'New Plymouth',
  'Whangarei',
  'Invercargill',
  'Whanganui',
];

const SOCIAL_PLATFORMS = [
  'website',
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'youtube',
];

export function BusinessInfoEditor({
  businessProfile,
  onUpdate,
}: BusinessInfoEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newServiceArea, setNewServiceArea] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<BusinessInfoForm>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      company_name: businessProfile?.company_name || '',
      business_address: businessProfile?.business_address || '',
      nzbn: businessProfile?.nzbn || '',
      description: businessProfile?.description || '',
      service_areas: businessProfile?.service_areas || [],
      social_links: businessProfile?.social_links || {},
    },
  });

  const watchedServiceAreas = watch('service_areas') || [];
  const watchedSocialLinks = watch('social_links') || {};

  const onSubmit = async (data: BusinessInfoForm) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/profile/me/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        onUpdate(result.business_profile);
        reset(data);
      } else {
        const error = await response.json();
        }
    } catch (error) {
      } finally {
      setIsLoading(false);
    }
  };

  const addServiceArea = () => {
    if (newServiceArea && !watchedServiceAreas.includes(newServiceArea)) {
      const updatedAreas = [...watchedServiceAreas, newServiceArea];
      setValue('service_areas', updatedAreas, { shouldDirty: true });
      setNewServiceArea('');
    }
  };

  const removeServiceArea = (area: string) => {
    const updatedAreas = watchedServiceAreas.filter(a => a !== area);
    setValue('service_areas', updatedAreas, { shouldDirty: true });
  };

  const addSocialLink = () => {
    if (
      newSocialPlatform &&
      newSocialUrl &&
      !watchedSocialLinks[newSocialPlatform]
    ) {
      const updatedLinks = {
        ...watchedSocialLinks,
        [newSocialPlatform]: newSocialUrl,
      };
      setValue('social_links', updatedLinks, { shouldDirty: true });
      setNewSocialPlatform('');
      setNewSocialUrl('');
    }
  };

  const removeSocialLink = (platform: string) => {
    const updatedLinks = { ...watchedSocialLinks };
    delete updatedLinks[platform];
    setValue('social_links', updatedLinks, { shouldDirty: true });
  };

  if (!businessProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">No business profile found.</p>
          <p className="text-sm text-gray-500">
            Business profiles are only available for contractors. If you're a
            contractor, please complete your onboarding process first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          {businessProfile.is_verified && (
            <Badge className="bg-green-100 text-green-800 w-fit">
              Verified Business
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                {...register('company_name')}
                className={errors.company_name ? 'border-red-500' : ''}
              />
              {errors.company_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="business_address">Business Address</Label>
              <Input
                id="business_address"
                {...register('business_address')}
                placeholder="123 Business Street, Auckland, New Zealand"
                className={errors.business_address ? 'border-red-500' : ''}
              />
              {errors.business_address && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.business_address.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="nzbn">NZBN (New Zealand Business Number)</Label>
              <Input
                id="nzbn"
                {...register('nzbn')}
                placeholder="9429047131283"
                className={errors.nzbn ? 'border-red-500' : ''}
              />
              {errors.nzbn && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nzbn.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your business and services..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Service Areas */}
            <div>
              <Label>Service Areas</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {watchedServiceAreas.map(area => (
                  <Badge
                    key={area}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {area}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => removeServiceArea(area)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={newServiceArea}
                  onChange={e => setNewServiceArea(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select service area</option>
                  {SERVICE_AREAS.map(area => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={addServiceArea} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <Label>Social Media Links</Label>
              <div className="space-y-2 mb-2">
                {Object.entries(watchedSocialLinks).map(([platform, url]) => (
                  <div key={platform} className="flex items-center gap-2">
                    <span className="w-20 text-sm font-medium capitalize">
                      {platform}:
                    </span>
                    <span className="flex-1 text-sm text-gray-600 truncate">
                      {url}
                    </span>
                    <X
                      className="h-4 w-4 cursor-pointer hover:text-red-500"
                      onClick={() => removeSocialLink(platform)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={newSocialPlatform}
                  onChange={e => setNewSocialPlatform(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Platform</option>
                  {SOCIAL_PLATFORMS.map(platform => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                <Input
                  value={newSocialUrl}
                  onChange={e => setNewSocialUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                <Button type="button" onClick={addSocialLink} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={!isDirty || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
