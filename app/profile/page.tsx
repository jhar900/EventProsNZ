'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProfileForm from '@/components/features/user/ProfileForm';
import AvatarUpload from '@/components/features/user/AvatarUpload';
import BusinessProfileForm from '@/components/features/user/BusinessProfileForm';
import UserSettings from '@/components/features/user/UserSettings';
import { ServicesEditor } from '@/components/features/profile/ServicesEditor';
import { PortfolioManager } from '@/components/features/profile/PortfolioManager';
import { ProfilePreview } from '@/components/features/profile/ProfilePreview';
import { TeamMembersManager } from '@/components/features/profile/TeamMembersManager';
import ProfileCompletionTracker from '@/components/features/profile/ProfileCompletionTracker';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');

  const handleSuccess = (message: string) => {
    // Success messages are now handled by individual components
    console.log('Profile success:', message);
  };

  const handleError = (error: string) => {
    console.error('Profile error:', error);
  };

  const isEventManager = user?.role === 'event_manager';

  const tabs = isEventManager
    ? [
        { id: 'personal', name: 'Personal Info', icon: '👤' },
        { id: 'business', name: 'Business Profile', icon: '🏢' },
        { id: 'team', name: 'Team Members', icon: '👥' },
      ]
    : [
        { id: 'personal', name: 'Personal Info', icon: '👤' },
        { id: 'business', name: 'Business Profile', icon: '🏢' },
        { id: 'services', name: 'Services', icon: '🛠️' },
        { id: 'portfolio', name: 'Portfolio', icon: '📸' },
        { id: 'preview', name: 'Preview', icon: '👁️' },
        { id: 'settings', name: 'Publication', icon: '💻' },
      ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Profile Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your personal information, business profile, and settings.
            </p>
          </div>

          {/* Profile Completion Tracker - Only show when not loading */}
          <div className="mb-6">
            <ProfileCompletionTracker />
          </div>

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
                      handleSuccess('Business profile updated successfully!')
                    }
                    onError={handleError}
                  />
                </div>
              )}

              {activeTab === 'services' && !isEventManager && (
                <div>
                  <ServicesEditor
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </div>
              )}

              {activeTab === 'portfolio' && !isEventManager && (
                <div>
                  <PortfolioManager
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </div>
              )}

              {activeTab === 'preview' && !isEventManager && (
                <div>
                  <ProfilePreview
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </div>
              )}

              {activeTab === 'settings' && !isEventManager && (
                <div>
                  <UserSettings
                    onSuccess={() =>
                      handleSuccess('Settings updated successfully!')
                    }
                    onError={handleError}
                  />
                </div>
              )}

              {activeTab === 'team' && isEventManager && (
                <div>
                  <TeamMembersManager
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
