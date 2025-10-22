'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';

interface PremiumNotificationsProps {
  className?: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  job_alerts: boolean;
  application_updates: boolean;
  new_job_matches: boolean;
  weekly_digest: boolean;
  instant_alerts: boolean;
}

export function PremiumNotifications({
  className = '',
}: PremiumNotificationsProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    job_alerts: true,
    application_updates: true,
    new_job_matches: true,
    weekly_digest: true,
    instant_alerts: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/contractors/notification-preferences');

      if (!response.ok) {
        throw new Error('Failed to load notification preferences');
      }

      const data = await response.json();

      if (data.success) {
        setPreferences(data.preferences);
      } else {
        throw new Error(
          data.error || 'Failed to load notification preferences'
        );
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load notification preferences'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        '/api/contractors/notification-preferences',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save notification preferences');
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('Notification preferences saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(
          data.error || 'Failed to save notification preferences'
        );
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save notification preferences'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const isSpotlightSubscriber = user?.subscription_tier === 'spotlight';

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">
            Loading notification preferences...
          </span>
        </div>
      </Card>
    );
  }

  if (!isSpotlightSubscriber) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <StarIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Premium Notifications
          </h3>
          <p className="text-gray-600 mb-4">
            Upgrade to Spotlight subscription to access premium notification
            features.
          </p>
          <Button>Upgrade to Spotlight</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Premium Notifications
          </h3>
          <p className="text-sm text-gray-600">
            Manage your notification preferences for job alerts and updates
          </p>
        </div>
        <Badge className="bg-yellow-100 text-yellow-800">
          <StarIcon className="h-3 w-3 mr-1" />
          Spotlight
        </Badge>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notification Channels */}
      <Card className="p-6">
        <div className="space-y-6">
          <h4 className="text-md font-semibold text-gray-900">
            Notification Channels
          </h4>

          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Email Notifications
                  </div>
                  <div className="text-sm text-gray-600">
                    Receive notifications via email
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={checked =>
                  handlePreferenceChange('email_notifications', checked)
                }
              />
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    SMS Notifications
                  </div>
                  <div className="text-sm text-gray-600">
                    Receive urgent notifications via SMS
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.sms_notifications}
                onCheckedChange={checked =>
                  handlePreferenceChange('sms_notifications', checked)
                }
              />
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BellIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Push Notifications
                  </div>
                  <div className="text-sm text-gray-600">
                    Receive notifications in your browser
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={checked =>
                  handlePreferenceChange('push_notifications', checked)
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Job Alerts */}
      <Card className="p-6">
        <div className="space-y-6">
          <h4 className="text-md font-semibold text-gray-900">Job Alerts</h4>

          <div className="space-y-4">
            {/* Job Alerts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BellIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Job Alerts</div>
                  <div className="text-sm text-gray-600">
                    Get notified about new jobs matching your criteria
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.job_alerts}
                onCheckedChange={checked =>
                  handlePreferenceChange('job_alerts', checked)
                }
              />
            </div>

            {/* New Job Matches */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <StarIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    New Job Matches
                  </div>
                  <div className="text-sm text-gray-600">
                    Get notified when new jobs match your profile
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.new_job_matches}
                onCheckedChange={checked =>
                  handlePreferenceChange('new_job_matches', checked)
                }
              />
            </div>

            {/* Instant Alerts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Instant Alerts
                  </div>
                  <div className="text-sm text-gray-600">
                    Get immediate notifications for high-priority jobs
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.instant_alerts}
                onCheckedChange={checked =>
                  handlePreferenceChange('instant_alerts', checked)
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Application Updates */}
      <Card className="p-6">
        <div className="space-y-6">
          <h4 className="text-md font-semibold text-gray-900">
            Application Updates
          </h4>

          <div className="space-y-4">
            {/* Application Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Application Updates
                  </div>
                  <div className="text-sm text-gray-600">
                    Get notified about status changes to your applications
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.application_updates}
                onCheckedChange={checked =>
                  handlePreferenceChange('application_updates', checked)
                }
              />
            </div>

            {/* Weekly Digest */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Weekly Digest</div>
                  <div className="text-sm text-gray-600">
                    Receive a weekly summary of your application activity
                  </div>
                </div>
              </div>
              <Switch
                checked={preferences.weekly_digest}
                onCheckedChange={checked =>
                  handlePreferenceChange('weekly_digest', checked)
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" onClick={loadPreferences} disabled={isSaving}>
          Reset
        </Button>
        <Button
          onClick={savePreferences}
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
