'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, EyeOff, Users, User } from 'lucide-react';

const privacySettingsSchema = z.object({
  profile_visibility: z.enum(['public', 'contacts_only', 'private']),
  contact_visibility: z.enum(['public', 'contacts_only', 'private']),
  portfolio_visibility: z.enum(['public', 'contacts_only', 'private']),
  business_visibility: z.enum(['public', 'contacts_only', 'private']),
});

type PrivacySettingsForm = z.infer<typeof privacySettingsSchema>;

interface PrivacySettings {
  profile_visibility: 'public' | 'contacts_only' | 'private';
  contact_visibility: 'public' | 'contacts_only' | 'private';
  portfolio_visibility: 'public' | 'contacts_only' | 'private';
  business_visibility: 'public' | 'contacts_only' | 'private';
}

interface PrivacySettingsProps {
  settings: PrivacySettings;
  onUpdate: (settings: PrivacySettings) => void;
}

const VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    description: 'Visible to everyone',
    icon: Eye,
    color: 'text-green-600',
  },
  {
    value: 'contacts_only',
    label: 'Contacts Only',
    description: 'Visible to users who have contacted you',
    icon: Users,
    color: 'text-yellow-600',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only visible to you',
    icon: EyeOff,
    color: 'text-red-600',
  },
];

const PRIVACY_SECTIONS = [
  {
    key: 'profile_visibility',
    title: 'Profile Information',
    description: 'Control who can see your basic profile information',
    icon: User,
  },
  {
    key: 'contact_visibility',
    title: 'Contact Information',
    description: 'Control who can see your phone number and address',
    icon: Shield,
  },
  {
    key: 'portfolio_visibility',
    title: 'Portfolio',
    description: 'Control who can see your portfolio items',
    icon: Eye,
  },
  {
    key: 'business_visibility',
    title: 'Business Information',
    description: 'Control who can see your business details',
    icon: Shield,
  },
];

export function PrivacySettings({ settings, onUpdate }: PrivacySettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<PrivacySettingsForm>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: {
      profile_visibility: settings.profile_visibility,
      contact_visibility: settings.contact_visibility,
      portfolio_visibility: settings.portfolio_visibility,
      business_visibility: settings.business_visibility,
    },
  });

  const onSubmit = async (data: PrivacySettingsForm) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/profile/me/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        onUpdate(result.privacy_settings);
        reset(data);
      } else {
        const error = await response.json();
        console.error('Error updating privacy settings:', error);
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVisibilityIcon = (value: string) => {
    const option = VISIBILITY_OPTIONS.find(opt => opt.value === value);
    return option ? option.icon : Eye;
  };

  const getVisibilityColor = (value: string) => {
    const option = VISIBILITY_OPTIONS.find(opt => opt.value === value);
    return option ? option.color : 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <p className="text-sm text-gray-600">
            Control who can see different parts of your profile and information.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {PRIVACY_SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <div key={section.key} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-gray-600">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {VISIBILITY_OPTIONS.map(option => {
                      const OptionIcon = option.icon;
                      const isSelected =
                        watch(section.key as keyof PrivacySettingsForm) ===
                        option.value;

                      return (
                        <label
                          key={option.value}
                          className={`
                            relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all
                            ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            {...register(
                              section.key as keyof PrivacySettingsForm
                            )}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-2 mb-2">
                            <OptionIcon className={`h-4 w-4 ${option.color}`} />
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {option.description}
                          </p>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Current Settings Summary</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(watch()).map(([key, value]) => {
                      const section = PRIVACY_SECTIONS.find(s => s.key === key);
                      const Icon = getVisibilityIcon(value);
                      return (
                        <Badge
                          key={key}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Icon
                            className={`h-3 w-3 ${getVisibilityColor(value)}`}
                          />
                          {section?.title}:{' '}
                          {
                            VISIBILITY_OPTIONS.find(opt => opt.value === value)
                              ?.label
                          }
                        </Badge>
                      );
                    })}
                  </div>
                </div>
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
                {isLoading ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
