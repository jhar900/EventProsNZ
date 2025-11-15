'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserProfileModalProps {
  userId: string | null;
  userEmail: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  is_verified: boolean;
  status: string;
  created_at: string;
  last_login: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    bio: string;
    avatar_url: string;
    location?: string;
    timezone?: string;
  } | null;
  business_profiles?: {
    company_name: string;
    description: string;
    website: string;
    subscription_tier: string;
    location: string;
    service_categories?: string[];
    is_verified?: boolean;
  } | null;
}

export function UserProfileModal({
  userId,
  userEmail,
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state for personal profile
  const [personalForm, setPersonalForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    bio: '',
    location: '',
    timezone: 'Pacific/Auckland',
  });

  // Form state for business profile
  const [businessForm, setBusinessForm] = useState({
    company_name: '',
    description: '',
    website: '',
    location: '',
    subscription_tier: 'essential' as 'essential' | 'showcase' | 'spotlight',
    is_verified: false,
  });

  // Form state for user settings
  const [settingsForm, setSettingsForm] = useState({
    role: 'event_manager' as 'admin' | 'event_manager' | 'contractor',
    is_verified: false,
    status: 'active' as string,
  });

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'business', name: 'Business Profile', icon: '🏢' },
    { id: 'services', name: 'Services', icon: '🛠️' },
    { id: 'portfolio', name: 'Portfolio', icon: '📸' },
    { id: 'preview', name: 'Preview', icon: '👁️' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  useEffect(() => {
    if (isOpen && userId) {
      setError(null);
      loadUserData();
    } else {
      setUserData(null);
      setActiveTab('personal');
      setError(null);
    }
  }, [isOpen, userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(
          errorData.error || `Failed to load user: ${response.status}`
        );
      }

      const data = await response.json();
      console.log('User data received:', data);

      if (data.user) {
        // Handle profiles being an array (Supabase sometimes returns arrays for relations)
        const user = data.user;
        if (Array.isArray(user.profiles)) {
          user.profiles = user.profiles[0] || null;
        }
        if (Array.isArray(user.business_profiles)) {
          user.business_profiles = user.business_profiles[0] || null;
        }

        // Ensure status field exists
        if (!user.status) {
          user.status = 'active';
        }

        setUserData(user);

        // Initialize form state
        if (user.profiles) {
          setPersonalForm({
            first_name: user.profiles.first_name || '',
            last_name: user.profiles.last_name || '',
            phone: user.profiles.phone || '',
            address: user.profiles.address || '',
            bio: user.profiles.bio || '',
            location: user.profiles.location || '',
            timezone: user.profiles.timezone || 'Pacific/Auckland',
          });
        }

        if (user.business_profiles) {
          setBusinessForm({
            company_name: user.business_profiles.company_name || '',
            description: user.business_profiles.description || '',
            website: user.business_profiles.website || '',
            location: user.business_profiles.location || '',
            subscription_tier:
              (user.business_profiles.subscription_tier as any) || 'essential',
            is_verified: user.business_profiles.is_verified || false,
          });
        }

        // Initialize settings form
        setSettingsForm({
          role: (user.role as any) || 'event_manager',
          is_verified: user.is_verified || false,
          status: user.status || 'active',
        });
      } else {
        throw new Error('No user data in response');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load user data';
      setError(errorMessage);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(personalForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadUserData(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to save personal profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      const response = await fetch(
        `/api/admin/users/${userId}/business-profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(businessForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update business profile');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadUserData(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to save business profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settingsForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadUserData(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Hide the default close button after a short delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const closeButton = document.querySelector(
          '[role="dialog"] button[class*="absolute"][class*="right-4"], [role="dialog"] button[class*="absolute"][class*="top-4"]'
        );
        if (closeButton) {
          (closeButton as HTMLElement).style.display = 'none';
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !userId) return null;

  const profile = userData?.profiles;
  const businessProfile = userData?.business_profiles;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            User Profile - {userData?.email || userEmail || 'Loading...'}
          </DialogTitle>
          <DialogDescription>
            View and edit user profile settings and information
          </DialogDescription>
          {saveSuccess && (
            <div className="mt-2 p-2 bg-green-100 text-green-800 text-sm rounded">
              Changes saved successfully!
            </div>
          )}
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-800 text-sm rounded">
              {error}
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : userData ? (
          <div className="mt-4">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'personal' && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center space-x-4 mb-6">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Profile"
                          className="h-20 w-20 rounded-full"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-2xl font-medium text-gray-700">
                            {(
                              profile?.first_name?.[0] || userData.email[0]
                            ).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold">
                          {profile?.first_name && profile?.last_name
                            ? `${profile.first_name} ${profile.last_name}`
                            : 'No Name'}
                        </h3>
                        <p className="text-gray-600">{userData.email}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge>{userData.role.replace('_', ' ')}</Badge>
                          {userData.is_verified && (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800"
                            >
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={personalForm.first_name}
                          onChange={e =>
                            setPersonalForm({
                              ...personalForm,
                              first_name: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={personalForm.last_name}
                          onChange={e =>
                            setPersonalForm({
                              ...personalForm,
                              last_name: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={personalForm.phone}
                          onChange={e =>
                            setPersonalForm({
                              ...personalForm,
                              phone: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={personalForm.address}
                          onChange={e =>
                            setPersonalForm({
                              ...personalForm,
                              address: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={personalForm.location}
                          onChange={e =>
                            setPersonalForm({
                              ...personalForm,
                              location: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Input
                          id="timezone"
                          value={personalForm.timezone}
                          onChange={e =>
                            setPersonalForm({
                              ...personalForm,
                              timezone: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={personalForm.bio}
                          onChange={e =>
                            setPersonalForm({
                              ...personalForm,
                              bio: e.target.value,
                            })
                          }
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        onClick={handleSavePersonal}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'business' && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          value={businessForm.company_name}
                          onChange={e =>
                            setBusinessForm({
                              ...businessForm,
                              company_name: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subscription_tier">
                          Subscription Tier
                        </Label>
                        <Select
                          value={businessForm.subscription_tier}
                          onValueChange={value =>
                            setBusinessForm({
                              ...businessForm,
                              subscription_tier: value as any,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="essential">Essential</SelectItem>
                            <SelectItem value="showcase">Showcase</SelectItem>
                            <SelectItem value="spotlight">Spotlight</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={businessForm.website}
                          onChange={e =>
                            setBusinessForm({
                              ...businessForm,
                              website: e.target.value,
                            })
                          }
                          className="mt-1"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="business_location">Location</Label>
                        <Input
                          id="business_location"
                          value={businessForm.location}
                          onChange={e =>
                            setBusinessForm({
                              ...businessForm,
                              location: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={businessForm.description}
                          onChange={e =>
                            setBusinessForm({
                              ...businessForm,
                              description: e.target.value,
                            })
                          }
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="is_verified"
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            id="is_verified"
                            checked={businessForm.is_verified}
                            onChange={e =>
                              setBusinessForm({
                                ...businessForm,
                                is_verified: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          Verified Business
                        </Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        onClick={handleSaveBusiness}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'services' && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-500 text-center py-8">
                      Services information would be displayed here.
                      <br />
                      <Button
                        variant="link"
                        onClick={() =>
                          window.open(`/admin/users/${userId}`, '_blank')
                        }
                        className="mt-2"
                      >
                        View full details to manage services
                      </Button>
                    </p>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'portfolio' && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-500 text-center py-8">
                      Portfolio items would be displayed here.
                      <br />
                      <Button
                        variant="link"
                        onClick={() =>
                          window.open(`/admin/users/${userId}`, '_blank')
                        }
                        className="mt-2"
                      >
                        View full details to manage portfolio
                      </Button>
                    </p>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'preview' && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-500 text-center py-8">
                      Profile preview would be displayed here.
                      <br />
                      <Button
                        variant="link"
                        onClick={() =>
                          window.open(`/admin/users/${userId}`, '_blank')
                        }
                        className="mt-2"
                      >
                        View full details for complete preview
                      </Button>
                    </p>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'settings' && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role">User Role</Label>
                        <Select
                          value={settingsForm.role}
                          onValueChange={value =>
                            setSettingsForm({
                              ...settingsForm,
                              role: value as any,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="event_manager">
                              Event Manager
                            </SelectItem>
                            <SelectItem value="contractor">
                              Contractor
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Account Status</Label>
                        <Select
                          value={settingsForm.status}
                          onValueChange={value =>
                            setSettingsForm({
                              ...settingsForm,
                              status: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="user_verified"
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            id="user_verified"
                            checked={settingsForm.is_verified}
                            onChange={e =>
                              setSettingsForm({
                                ...settingsForm,
                                is_verified: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          User Verified
                        </Label>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Member Since
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(userData.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Last Login
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {userData.last_login
                            ? new Date(userData.last_login).toLocaleString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 font-semibold mb-2">
              Failed to load user data
            </div>
            <div className="text-sm text-gray-600 mb-4">{error}</div>
            <Button onClick={loadUserData} variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No user data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
