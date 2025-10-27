'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSystemSettings from '@/components/features/admin/AdminSystemSettings';
import AdminSecuritySettings from '@/components/features/admin/AdminSecuritySettings';
import AdminNotificationSettings from '@/components/features/admin/AdminNotificationSettings';
import AdminAppearanceSettings from '@/components/features/admin/AdminAppearanceSettings';
import AdminBackupSettings from '@/components/features/admin/AdminBackupSettings';
import AdminPersonalSettings from '@/components/features/admin/AdminPersonalSettings';
import AdminBusinessSettings from '@/components/features/admin/AdminBusinessSettings';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('system');

  const handleSuccess = (message: string) => {
    // Success messages are now handled by individual components
  };

  const handleError = (error: string) => {
    // Error handling is now done by individual components
  };

  const tabs = [
    { id: 'personal', name: 'Personal', icon: '👤' },
    { id: 'business', name: 'Business', icon: '🏢' },
    { id: 'system', name: 'System', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'backup', name: 'Backup & Data', icon: '💾' },
  ];

  // In development mode, bypass RoleGuard to allow access
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.VERCEL_ENV === 'development' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  const SettingsContent = () => (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage system settings, security configurations, and platform
            preferences.
          </p>
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
                      ? 'border-orange-500 text-orange-600'
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
              <div>
                <AdminPersonalSettings
                  onSuccess={() =>
                    handleSuccess('Personal settings updated successfully!')
                  }
                  onError={handleError}
                />
              </div>
            )}

            {activeTab === 'business' && (
              <div>
                <AdminBusinessSettings
                  onSuccess={() =>
                    handleSuccess('Business settings updated successfully!')
                  }
                  onError={handleError}
                />
              </div>
            )}

            {activeTab === 'system' && (
              <div>
                <AdminSystemSettings
                  onSuccess={() =>
                    handleSuccess('System settings updated successfully!')
                  }
                  onError={handleError}
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <AdminSecuritySettings
                  onSuccess={() =>
                    handleSuccess('Security settings updated successfully!')
                  }
                  onError={handleError}
                />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <AdminNotificationSettings
                  onSuccess={() =>
                    handleSuccess('Notification settings updated successfully!')
                  }
                  onError={handleError}
                />
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <AdminAppearanceSettings
                  onSuccess={() =>
                    handleSuccess('Appearance settings updated successfully!')
                  }
                  onError={handleError}
                />
              </div>
            )}

            {activeTab === 'backup' && (
              <div>
                <AdminBackupSettings
                  onSuccess={() =>
                    handleSuccess('Backup settings updated successfully!')
                  }
                  onError={handleError}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDevelopment) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Development Mode:</strong> Admin access bypassed for
              development purposes.
            </p>
          </div>
          <SettingsContent />
        </div>
      </DashboardLayout>
    );
  }

  // Production mode: Use RoleGuard
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <SettingsContent />
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
