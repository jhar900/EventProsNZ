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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  Save,
  Settings,
  Bell,
  Palette,
  Brain,
  Shield,
  Star,
  DollarSign,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface UserPreference {
  id: string;
  user_id: string;
  preference_type: string;
  preference_data: any;
  created_at: string;
  updated_at: string;
}

interface UserPreferencesPanelProps {
  onClose: () => void;
  className?: string;
}

export function UserPreferencesPanel({
  onClose,
  className = '',
}: UserPreferencesPanelProps) {
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('service');
  const [hasChanges, setHasChanges] = useState(false);

  // Form states for different preference types
  const [servicePrefs, setServicePrefs] = useState({
    preferred_categories: [] as string[],
    avoided_categories: [] as string[],
    budget_preferences: {
      min_budget: 0,
      max_budget: 10000,
      budget_priority: 'medium' as 'low' | 'medium' | 'high',
    },
    quality_preferences: {
      min_rating: 3,
      verified_only: false,
      premium_preferred: false,
    },
  });

  const [eventPrefs, setEventPrefs] = useState({
    preferred_event_types: [] as string[],
    typical_attendee_count: 50,
    typical_duration_hours: 4,
    preferred_locations: [] as string[],
    seasonal_preferences: [] as string[],
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    notification_frequency: 'daily' as 'immediate' | 'daily' | 'weekly',
    notification_types: ['recommendations', 'updates', 'reminders'],
  });

  const [uiPrefs, setUiPrefs] = useState({
    theme: 'auto' as 'light' | 'dark' | 'auto',
    language: 'en',
    default_view: 'grid' as 'grid' | 'list' | 'map',
    items_per_page: 20,
    show_advanced_filters: false,
  });

  const [learningPrefs, setLearningPrefs] = useState({
    allow_data_collection: true,
    allow_personalization: true,
    allow_ab_testing: true,
    feedback_frequency: 'sometimes' as 'always' | 'sometimes' | 'never',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/user-preferences');
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }
      const data = await response.json();
      setPreferences(data.preferences || []);

      // Load existing preferences into form states
      data.preferences.forEach((pref: UserPreference) => {
        switch (pref.preference_type) {
          case 'service_preferences':
            setServicePrefs(pref.preference_data);
            break;
          case 'event_preferences':
            setEventPrefs(pref.preference_data);
            break;
          case 'notification_preferences':
            setNotificationPrefs(pref.preference_data);
            break;
          case 'ui_preferences':
            setUiPrefs(pref.preference_data);
            break;
          case 'learning_preferences':
            setLearningPrefs(pref.preference_data);
            break;
        }
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load preferences'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      const preferenceUpdates = [
        {
          preference_type: 'service_preferences',
          preference_data: servicePrefs,
        },
        { preference_type: 'event_preferences', preference_data: eventPrefs },
        {
          preference_type: 'notification_preferences',
          preference_data: notificationPrefs,
        },
        { preference_type: 'ui_preferences', preference_data: uiPrefs },
        {
          preference_type: 'learning_preferences',
          preference_data: learningPrefs,
        },
      ];

      for (const update of preferenceUpdates) {
        const response = await fetch('/api/ai/user-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update),
        });

        if (!response.ok) {
          throw new Error(`Failed to save ${update.preference_type}`);
        }
      }

      setHasChanges(false);
      // Show success message
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save preferences'
      );
    }
  };

  const handleServicePrefChange = (updates: Partial<typeof servicePrefs>) => {
    setServicePrefs(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleEventPrefChange = (updates: Partial<typeof eventPrefs>) => {
    setEventPrefs(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleNotificationPrefChange = (
    updates: Partial<typeof notificationPrefs>
  ) => {
    setNotificationPrefs(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleUiPrefChange = (updates: Partial<typeof uiPrefs>) => {
    setUiPrefs(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleLearningPrefChange = (updates: Partial<typeof learningPrefs>) => {
    setLearningPrefs(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      >
        <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center">
              <LoadingSpinner />
              <span className="ml-2">Loading preferences...</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 w-full bg-gray-100 animate-pulse rounded"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <Card className="w-full max-w-5xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">User Preferences</CardTitle>
              <CardDescription>
                Customize your AI recommendation experience
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && <Badge variant="secondary">Unsaved Changes</Badge>}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="event">Event</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="ui">Interface</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
            </TabsList>

            <TabsContent value="service" className="space-y-4">
              <ServicePreferences
                preferences={servicePrefs}
                onChange={handleServicePrefChange}
              />
            </TabsContent>

            <TabsContent value="event" className="space-y-4">
              <EventPreferences
                preferences={eventPrefs}
                onChange={handleEventPrefChange}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <NotificationPreferences
                preferences={notificationPrefs}
                onChange={handleNotificationPrefChange}
              />
            </TabsContent>

            <TabsContent value="ui" className="space-y-4">
              <UIPreferences
                preferences={uiPrefs}
                onChange={handleUiPrefChange}
              />
            </TabsContent>

            <TabsContent value="learning" className="space-y-4">
              <LearningPreferences
                preferences={learningPrefs}
                onChange={handleLearningPrefChange}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={savePreferences} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Service Preferences Component
function ServicePreferences({
  preferences,
  onChange,
}: {
  preferences: any;
  onChange: (updates: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Service Preferences</h3>

        {/* Budget Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_budget">Minimum Budget</Label>
                <Input
                  id="min_budget"
                  type="number"
                  value={preferences.budget_preferences.min_budget}
                  onChange={e =>
                    onChange({
                      budget_preferences: {
                        ...preferences.budget_preferences,
                        min_budget: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="max_budget">Maximum Budget</Label>
                <Input
                  id="max_budget"
                  type="number"
                  value={preferences.budget_preferences.max_budget}
                  onChange={e =>
                    onChange({
                      budget_preferences: {
                        ...preferences.budget_preferences,
                        max_budget: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="budget_priority">Budget Priority</Label>
              <Select
                value={preferences.budget_preferences.budget_priority}
                onValueChange={value =>
                  onChange({
                    budget_preferences: {
                      ...preferences.budget_preferences,
                      budget_priority: value,
                    },
                  })
                }
              >
                <SelectTrigger id="budget_priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Focus on value</SelectItem>
                  <SelectItem value="medium">
                    Medium - Balanced approach
                  </SelectItem>
                  <SelectItem value="high">High - Premium quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quality Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" />
              Quality Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="min_rating">Minimum Rating</Label>
              <Select
                value={preferences.quality_preferences.min_rating.toString()}
                onValueChange={value =>
                  onChange({
                    quality_preferences: {
                      ...preferences.quality_preferences,
                      min_rating: parseInt(value),
                    },
                  })
                }
              >
                <SelectTrigger id="min_rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="verified_only"
                  checked={preferences.quality_preferences.verified_only}
                  onCheckedChange={checked =>
                    onChange({
                      quality_preferences: {
                        ...preferences.quality_preferences,
                        verified_only: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="verified_only">
                  Only show verified contractors
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="premium_preferred"
                  checked={preferences.quality_preferences.premium_preferred}
                  onCheckedChange={checked =>
                    onChange({
                      quality_preferences: {
                        ...preferences.quality_preferences,
                        premium_preferred: checked,
                      },
                    })
                  }
                />
                <Label htmlFor="premium_preferred">
                  Prefer premium services
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Event Preferences Component
function EventPreferences({
  preferences,
  onChange,
}: {
  preferences: any;
  onChange: (updates: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Event Preferences</h3>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Typical Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attendee_count">Typical Attendee Count</Label>
                <Input
                  id="attendee_count"
                  type="number"
                  value={preferences.typical_attendee_count}
                  onChange={e =>
                    onChange({
                      typical_attendee_count: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="duration">Typical Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={preferences.typical_duration_hours}
                  onChange={e =>
                    onChange({
                      typical_duration_hours: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Notification Preferences Component
function NotificationPreferences({
  preferences,
  onChange,
}: {
  preferences: any;
  onChange: (updates: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="email_notifications"
                  checked={preferences.email_notifications}
                  onCheckedChange={checked =>
                    onChange({
                      email_notifications: checked,
                    })
                  }
                />
                <Label htmlFor="email_notifications">Email notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="push_notifications"
                  checked={preferences.push_notifications}
                  onCheckedChange={checked =>
                    onChange({
                      push_notifications: checked,
                    })
                  }
                />
                <Label htmlFor="push_notifications">Push notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sms_notifications"
                  checked={preferences.sms_notifications}
                  onCheckedChange={checked =>
                    onChange({
                      sms_notifications: checked,
                    })
                  }
                />
                <Label htmlFor="sms_notifications">SMS notifications</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="notification_frequency">
                Notification Frequency
              </Label>
              <Select
                value={preferences.notification_frequency}
                onValueChange={value =>
                  onChange({
                    notification_frequency: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// UI Preferences Component
function UIPreferences({
  preferences,
  onChange,
}: {
  preferences: any;
  onChange: (updates: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Interface Preferences</h3>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={value =>
                    onChange({
                      theme: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="default_view">Default View</Label>
                <Select
                  value={preferences.default_view}
                  onValueChange={value =>
                    onChange({
                      default_view: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="map">Map</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="items_per_page">Items per Page</Label>
              <Select
                value={preferences.items_per_page.toString()}
                onValueChange={value =>
                  onChange({
                    items_per_page: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show_advanced_filters"
                checked={preferences.show_advanced_filters}
                onCheckedChange={checked =>
                  onChange({
                    show_advanced_filters: checked,
                  })
                }
              />
              <Label htmlFor="show_advanced_filters">
                Show advanced filters by default
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Learning Preferences Component
function LearningPreferences({
  preferences,
  onChange,
}: {
  preferences: any;
  onChange: (updates: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Learning & Privacy</h3>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Learning Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_data_collection"
                  checked={preferences.allow_data_collection}
                  onCheckedChange={checked =>
                    onChange({
                      allow_data_collection: checked,
                    })
                  }
                />
                <Label htmlFor="allow_data_collection">
                  Allow data collection for learning
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_personalization"
                  checked={preferences.allow_personalization}
                  onCheckedChange={checked =>
                    onChange({
                      allow_personalization: checked,
                    })
                  }
                />
                <Label htmlFor="allow_personalization">
                  Allow personalization
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_ab_testing"
                  checked={preferences.allow_ab_testing}
                  onCheckedChange={checked =>
                    onChange({
                      allow_ab_testing: checked,
                    })
                  }
                />
                <Label htmlFor="allow_ab_testing">
                  Participate in A/B testing
                </Label>
              </div>
            </div>
            <div>
              <Label htmlFor="feedback_frequency">Feedback Frequency</Label>
              <Select
                value={preferences.feedback_frequency}
                onValueChange={value =>
                  onChange({
                    feedback_frequency: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">
                    Always ask for feedback
                  </SelectItem>
                  <SelectItem value="sometimes">
                    Ask for feedback occasionally
                  </SelectItem>
                  <SelectItem value="never">Never ask for feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
