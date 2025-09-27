'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/features/auth/AuthGuard';
import PageLayout from '@/components/layout/PageLayout';
import ProfileForm from '@/components/features/user/ProfileForm';
import AvatarUpload from '@/components/features/user/AvatarUpload';
import BusinessProfileForm from '@/components/features/user/BusinessProfileForm';
import UserSettings from '@/components/features/user/UserSettings';
import { ServicesEditor } from '@/components/features/profile/ServicesEditor';
import { PortfolioManager } from '@/components/features/profile/PortfolioManager';
import { PrivacySettings } from '@/components/features/profile/PrivacySettings';
import { ProfilePreview } from '@/components/features/profile/ProfilePreview';
import ProfileCompletionTracker from '@/components/features/profile/ProfileCompletionTracker';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleError = (error: string) => {
    console.error('Profile error:', error);
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'business', name: 'Business Profile', icon: '🏢' },
    { id: 'services', name: 'Services', icon: '🛠️' },
    { id: 'portfolio', name: 'Portfolio', icon: '📸' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'preview', name: 'Preview', icon: '👁️' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <AuthGuard>
      <PageLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                  Profile Management
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage your personal information, business profile, and
                  settings.
                </p>
              </div>

              {/* Profile Completion Tracker */}
              <div className="mb-6">
                <ProfileCompletionTracker />
              </div>

              {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        {successMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white shadow rounded-lg">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
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

                <div className="p-6">
                  {activeTab === 'personal' && (
                    <div className="space-y-6">
                      <AvatarUpload
                        onSuccess={() =>
                          handleSuccess('Avatar updated successfully!')
                        }
                        onError={handleError}
                      />
                      <ProfileForm
                        onSuccess={() =>
                          handleSuccess('Profile updated successfully!')
                        }
                        onError={handleError}
                      />
                    </div>
                  )}

                  {activeTab === 'business' && (
                    <div>
                      <BusinessProfileForm
                        onSuccess={() =>
                          handleSuccess(
                            'Business profile updated successfully!'
                          )
                        }
                        onError={handleError}
                      />
                    </div>
                  )}

                  {activeTab === 'services' && (
                    <div>
                      <ServicesEditor
                        onSuccess={handleSuccess}
                        onError={handleError}
                      />
                    </div>
                  )}

                  {activeTab === 'portfolio' && (
                    <div>
                      <PortfolioManager
                        onSuccess={handleSuccess}
                        onError={handleError}
                      />
                    </div>
                  )}

                  {activeTab === 'privacy' && (
                    <div>
                      <PrivacySettings
                        onSuccess={handleSuccess}
                        onError={handleError}
                      />
                    </div>
                  )}

                  {activeTab === 'preview' && (
                    <div>
                      <ProfilePreview
                        onSuccess={handleSuccess}
                        onError={handleError}
                      />
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div>
                      <UserSettings
                        onSuccess={() =>
                          handleSuccess('Settings updated successfully!')
                        }
                        onError={handleError}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </AuthGuard>
  );
}
