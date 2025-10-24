'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Settings,
  Bell,
  Shield,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  User,
} from 'lucide-react';

interface EmailPreference {
  id: string;
  type: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  category:
    | 'welcome'
    | 'job_application'
    | 'event'
    | 'subscription'
    | 'announcement'
    | 'newsletter';
}

interface EmailPreferencesProps {
  userId?: string;
  onPreferencesUpdated?: (preferences: EmailPreference[]) => void;
}

export function EmailPreferences({
  userId,
  onPreferencesUpdated,
}: EmailPreferencesProps) {
  const [preferences, setPreferences] = useState<EmailPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const mockPreferences: EmailPreference[] = [
      {
        id: '1',
        type: 'welcome_series',
        name: 'Welcome Email Series',
        description: 'Receive onboarding emails when you first join',
        enabled: true,
        frequency: 'immediate',
        category: 'welcome',
      },
      {
        id: '2',
        type: 'job_application_confirmation',
        name: 'Job Application Confirmations',
        description: 'Get notified when your job applications are received',
        enabled: true,
        frequency: 'immediate',
        category: 'job_application',
      },
      {
        id: '3',
        type: 'job_application_updates',
        name: 'Job Application Updates',
        description: 'Receive updates on your job application status',
        enabled: true,
        frequency: 'immediate',
        category: 'job_application',
      },
      {
        id: '4',
        type: 'event_creation',
        name: 'Event Creation Notifications',
        description: 'Get notified when your events are created',
        enabled: true,
        frequency: 'immediate',
        category: 'event',
      },
      {
        id: '5',
        type: 'event_reminders',
        name: 'Event Reminders',
        description: 'Receive reminders about upcoming events',
        enabled: true,
        frequency: 'daily',
        category: 'event',
      },
      {
        id: '6',
        type: 'subscription_billing',
        name: 'Billing Notifications',
        description: 'Receive billing and payment notifications',
        enabled: true,
        frequency: 'immediate',
        category: 'subscription',
      },
      {
        id: '7',
        type: 'subscription_renewal',
        name: 'Subscription Renewal',
        description: 'Get notified about subscription renewals',
        enabled: true,
        frequency: 'weekly',
        category: 'subscription',
      },
      {
        id: '8',
        type: 'feature_announcements',
        name: 'Feature Announcements',
        description: 'Learn about new features and updates',
        enabled: false,
        frequency: 'weekly',
        category: 'announcement',
      },
      {
        id: '9',
        type: 'maintenance_notifications',
        name: 'Maintenance Notifications',
        description: 'Get notified about scheduled maintenance',
        enabled: true,
        frequency: 'immediate',
        category: 'announcement',
      },
      {
        id: '10',
        type: 'security_alerts',
        name: 'Security Alerts',
        description: 'Receive important security notifications',
        enabled: true,
        frequency: 'immediate',
        category: 'announcement',
      },
      {
        id: '11',
        type: 'newsletter',
        name: 'Monthly Newsletter',
        description: 'Receive our monthly newsletter with tips and updates',
        enabled: false,
        frequency: 'monthly',
        category: 'newsletter',
      },
    ];

    setPreferences(mockPreferences);
    setLoading(false);
  }, []);

  const handleTogglePreference = async (preferenceId: string) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === preferenceId ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  const handleFrequencyChange = async (
    preferenceId: string,
    frequency: string
  ) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === preferenceId
          ? { ...pref, frequency: frequency as any }
          : pref
      )
    );
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onPreferencesUpdated?.(preferences);
      console.log('Preferences saved:', preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPreferences = () => {
    setPreferences(prev =>
      prev.map(pref => ({
        ...pref,
        enabled: true,
        frequency: 'immediate',
      }))
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'welcome':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'job_application':
        return <Bell className="h-4 w-4 text-green-500" />;
      case 'event':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'subscription':
        return <Settings className="h-4 w-4 text-orange-500" />;
      case 'announcement':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'newsletter':
        return <Mail className="h-4 w-4 text-indigo-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'welcome':
        return 'bg-blue-100 text-blue-800';
      case 'job_application':
        return 'bg-green-100 text-green-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      case 'subscription':
        return 'bg-orange-100 text-orange-800';
      case 'announcement':
        return 'bg-red-100 text-red-800';
      case 'newsletter':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const enabledCount = preferences.filter(p => p.enabled).length;
  const totalCount = preferences.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Preferences</h2>
          <p className="text-muted-foreground">
            Manage your email notification preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetPreferences}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button size="sm" onClick={handleSavePreferences} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Preferences
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Preferences
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount}</div>
                <p className="text-xs text-muted-foreground">
                  Available email types
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enabledCount}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((enabledCount / totalCount) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disabled</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalCount - enabledCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(((totalCount - enabledCount) / totalCount) * 100)}
                  % of total
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preference Summary</CardTitle>
              <CardDescription>
                Overview of your current email notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preferences.map(preference => (
                  <div
                    key={preference.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getCategoryIcon(preference.category)}
                      <div>
                        <h4 className="font-medium">{preference.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {preference.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={getCategoryColor(preference.category)}
                          >
                            {preference.category.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {preference.frequency}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Switch
                        checked={preference.enabled}
                        onCheckedChange={() =>
                          handleTogglePreference(preference.id)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <div className="space-y-4">
            {preferences.map(preference => (
              <Card key={preference.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getCategoryIcon(preference.category)}
                      <div className="flex-1">
                        <h3 className="font-semibold">{preference.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {preference.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={getCategoryColor(preference.category)}
                          >
                            {preference.category.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {preference.frequency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={preference.frequency}
                        onChange={e =>
                          handleFrequencyChange(preference.id, e.target.value)
                        }
                        className="px-3 py-1 border rounded-md text-sm"
                        disabled={!preference.enabled}
                      >
                        <option value="immediate">Immediate</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <Switch
                        checked={preference.enabled}
                        onCheckedChange={() =>
                          handleTogglePreference(preference.id)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {[
            'welcome',
            'job_application',
            'event',
            'subscription',
            'announcement',
            'newsletter',
          ].map(category => {
            const categoryPreferences = preferences.filter(
              p => p.category === category
            );
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category.replace('_', ' ').toUpperCase()}
                  </CardTitle>
                  <CardDescription>
                    {categoryPreferences.length} preferences in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryPreferences.map(preference => (
                      <div
                        key={preference.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{preference.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {preference.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <select
                            value={preference.frequency}
                            onChange={e =>
                              handleFrequencyChange(
                                preference.id,
                                e.target.value
                              )
                            }
                            className="px-2 py-1 border rounded text-sm"
                            disabled={!preference.enabled}
                          >
                            <option value="immediate">Immediate</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                          <Switch
                            checked={preference.enabled}
                            onCheckedChange={() =>
                              handleTogglePreference(preference.id)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
