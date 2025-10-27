'use client';

import React from 'react';

interface AdminNotificationSettingsProps {
  onSuccess?: (settings: any) => void;
  onError?: (error: string) => void;
}

export default function AdminNotificationSettings({
  onSuccess,
  onError,
}: AdminNotificationSettingsProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Notification Settings
        </h3>

        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔔</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Notification Configuration
          </h4>
          <p className="text-gray-600 mb-4">
            Configure email notifications, SMS alerts, and system notifications.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 text-sm">
              <strong>Coming Soon:</strong> Advanced notification management
              will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
