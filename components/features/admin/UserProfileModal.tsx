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
import UserSettings from '@/components/features/user/UserSettings';
import ProfileForm from '@/components/features/user/ProfileForm';
import AvatarUpload from '@/components/features/user/AvatarUpload';
import BusinessProfileForm from '@/components/features/user/BusinessProfileForm';
import { ServicesEditor } from '@/components/features/profile/ServicesEditor';
import { PortfolioManager } from '@/components/features/profile/PortfolioManager';
import { ProfilePreview } from '@/components/features/profile/ProfilePreview';

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
                <div className="space-y-6">
                  <AvatarUpload
                    userId={userId}
                    onSuccess={() => {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                      loadUserData();
                    }}
                    onError={error => {
                      setError(error);
                    }}
                  />
                  <ProfileForm
                    userId={userId}
                    onSuccess={() => {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                      loadUserData();
                    }}
                    onError={error => {
                      setError(error);
                    }}
                  />
                </div>
              )}

              {activeTab === 'business' && (
                <div>
                  <BusinessProfileForm
                    userId={userId}
                    onSuccess={() => {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                      loadUserData();
                    }}
                    onError={error => {
                      setError(error);
                    }}
                  />
                </div>
              )}

              {activeTab === 'services' && (
                <div>
                  <ServicesEditor
                    userId={userId}
                    onSuccess={() => {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                      loadUserData();
                    }}
                    onError={error => {
                      setError(error);
                    }}
                  />
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div>
                  <PortfolioManager
                    userId={userId}
                    onSuccess={() => {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                      loadUserData();
                    }}
                    onError={error => {
                      setError(error);
                    }}
                  />
                </div>
              )}

              {activeTab === 'preview' && (
                <div>
                  <ProfilePreview
                    userId={userId}
                    onSuccess={() => {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                    }}
                    onError={error => {
                      setError(error);
                    }}
                  />
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <UserSettings
                    userId={userId}
                    userRole={
                      userData?.role as 'event_manager' | 'contractor' | 'admin'
                    }
                    onSuccess={() => {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                      loadUserData(); // Reload to get updated data
                    }}
                    onError={error => {
                      setError(error);
                    }}
                    readOnly={false}
                  />
                </div>
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
