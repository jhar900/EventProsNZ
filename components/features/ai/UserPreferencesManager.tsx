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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  User,
  Settings,
  Heart,
  MapPin,
  DollarSign,
  Star,
  Clock,
  Bell,
  Shield,
  Award,
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Edit,
  Save,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Zap,
  Activity,
  Users,
  Globe,
  Lock,
  Unlock,
} from 'lucide-react';

interface UserPreference {
  id: string;
  userId: string;
  preferenceType:
    | 'service_category'
    | 'price_range'
    | 'location'
    | 'event_type'
    | 'contractor_rating'
    | 'availability'
    | 'personalization_level';
  preferenceData: any;
  weight: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed: Date;
  usageCount: number;
}

interface UserPreferenceProfile {
  userId: string;
  preferences: UserPreference[];
  behaviorPatterns: {
    preferredEventTypes: string[];
    preferredServiceCategories: string[];
    averageBudget: number;
    preferredLocations: string[];
    timePreferences: {
      preferredDays: string[];
      preferredTimes: string[];
      advanceBookingDays: number;
    };
    qualityPreferences: {
      minRating: number;
      preferVerified: boolean;
      preferPremium: boolean;
    };
    communicationPreferences: {
      preferredContactMethod: 'email' | 'phone' | 'sms';
      responseTimeExpectation: string;
      notificationFrequency: 'immediate' | 'daily' | 'weekly';
    };
  };
  learningInsights: {
    mostUsedServices: Array<{ service: string; count: number }>;
    seasonalPatterns: Record<string, number>;
    budgetPatterns: Array<{ eventType: string; averageBudget: number }>;
    locationPatterns: Array<{ location: string; frequency: number }>;
  };
  lastUpdated: Date;
}

interface UserPreferencesManagerProps {
  userId: string;
  onPreferencesUpdate?: (preferences: UserPreference[]) => void;
  onProfileUpdate?: (profile: UserPreferenceProfile) => void;
  className?: string;
}

export function UserPreferencesManager({
  userId,
  onPreferencesUpdate,
  onProfileUpdate,
  className = '',
}: UserPreferencesManagerProps) {
  const [profile, setProfile] = useState<UserPreferenceProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preferences');
  const [editingPreference, setEditingPreference] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/user-preferences/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load user preferences');
      }
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to load preferences'
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    preferenceType: UserPreference['preferenceType'],
    preferenceData: any,
    weight: number
  ) => {
    try {
      const response = await fetch(`/api/ai/user-preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferenceType,
          preferenceData,
          weight,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preference');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile.profile);
      onPreferencesUpdate?.(updatedProfile.profile.preferences);
      onProfileUpdate?.(updatedProfile.profile);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update preference'
      );
    }
  };

  const removePreference = async (
    preferenceType: UserPreference['preferenceType']
  ) => {
    try {
      const response = await fetch(`/api/ai/user-preferences/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferenceType }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove preference');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile.profile);
      onPreferencesUpdate?.(updatedProfile.profile.preferences);
      onProfileUpdate?.(updatedProfile.profile);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to remove preference'
      );
    }
  };

  const getPreferenceIcon = (type: string) => {
    switch (type) {
      case 'service_category':
        return <Target className="h-4 w-4" />;
      case 'price_range':
        return <DollarSign className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'event_type':
        return <Calendar className="h-4 w-4" />;
      case 'contractor_rating':
        return <Star className="h-4 w-4" />;
      case 'availability':
        return <Clock className="h-4 w-4" />;
      case 'personalization_level':
        return <User className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getPreferenceColor = (type: string) => {
    switch (type) {
      case 'service_category':
        return 'bg-blue-100 text-blue-800';
      case 'price_range':
        return 'bg-green-100 text-green-800';
      case 'location':
        return 'bg-purple-100 text-purple-800';
      case 'event_type':
        return 'bg-orange-100 text-orange-800';
      case 'contractor_rating':
        return 'bg-yellow-100 text-yellow-800';
      case 'availability':
        return 'bg-red-100 text-red-800';
      case 'personalization_level':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading preferences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!profile && !loading) {
    return (
      <Alert className={className}>
        <Info className="h-4 w-4" />
        <AlertDescription>No preferences found for this user.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">User Preferences</h3>
          <p className="text-muted-foreground">
            Manage and customize user preferences for personalized
            recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUserProfile}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-4">
        <div className="grid w-full grid-cols-4 border-b">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'preferences'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'behavior'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('behavior')}
          >
            Behavior
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'insights'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {activeTab === 'preferences' && (
          <div className="space-y-4">
            {/* Preferences Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {profile?.preferences?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Preferences
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {profile?.preferences?.filter(p => p.isActive).length ||
                          0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Active
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.round(
                          ((profile?.preferences?.reduce(
                            (sum, p) => sum + p.weight,
                            0
                          ) || 0) /
                            (profile?.preferences?.length || 1)) *
                            100
                        )}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Weight
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {profile?.preferences?.reduce(
                          (sum, p) => sum + p.usageCount,
                          0
                        ) || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Usage
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preferences List */}
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>
                  Manage individual preferences and their importance weights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile?.preferences?.map((preference, index) => (
                    <div key={preference.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPreferenceIcon(preference.preferenceType)}
                            <h4 className="font-semibold capitalize">
                              {preference.preferenceType.replace('_', ' ')}
                            </h4>
                            <Badge
                              className={getPreferenceColor(
                                preference.preferenceType
                              )}
                            >
                              {Math.round(preference.weight * 100)}% weight
                            </Badge>
                            {preference.isActive ? (
                              <Badge variant="secondary">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-muted-foreground mb-2">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(
                                preference.preferenceData,
                                null,
                                0
                              )}
                            </pre>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Created:{' '}
                              {new Date(
                                new Date(preference.createdAt).getTime() +
                                  index * 24 * 60 * 60 * 1000
                              ).toLocaleDateString('en-US', {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span>
                              Last used:{' '}
                              {new Date(
                                new Date(preference.lastUsed).getTime() +
                                  index * 24 * 60 * 60 * 1000
                              ).toLocaleDateString('en-US', {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span>Usage count: {preference.usageCount}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPreference(preference.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              removePreference(preference.preferenceType)
                            }
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="space-y-4">
            {/* Behavior Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Behavior Patterns</CardTitle>
                <CardDescription>
                  Insights into user behavior and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preferred Event Types */}
                <div>
                  <h4 className="font-semibold mb-3">Preferred Event Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.behaviorPatterns?.preferredEventTypes?.map(
                      eventType => (
                        <Badge key={eventType} variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {eventType}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                {/* Preferred Service Categories */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Preferred Service Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.behaviorPatterns?.preferredServiceCategories?.map(
                      category => (
                        <Badge key={category} variant="outline">
                          <Target className="h-3 w-3 mr-1" />
                          {category}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                {/* Budget Information */}
                <div>
                  <h4 className="font-semibold mb-3">Budget Patterns</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        $
                        {profile?.behaviorPatterns?.averageBudget?.toLocaleString() ||
                          0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Average Budget
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {profile?.behaviorPatterns?.timePreferences
                          ?.advanceBookingDays || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Advance Booking (days)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {profile?.behaviorPatterns?.preferredLocations
                          ?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Preferred Locations
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quality Preferences */}
                <div>
                  <h4 className="font-semibold mb-3">Quality Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>
                        Min Rating:{' '}
                        {profile?.behaviorPatterns?.qualityPreferences
                          ?.minRating || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile?.behaviorPatterns?.qualityPreferences
                        ?.preferVerified ? (
                        <Shield className="h-4 w-4 text-green-500" />
                      ) : (
                        <Unlock className="h-4 w-4 text-gray-500" />
                      )}
                      <span>
                        Verified:{' '}
                        {profile?.behaviorPatterns?.qualityPreferences
                          ?.preferVerified
                          ? 'Yes'
                          : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile?.behaviorPatterns?.qualityPreferences
                        ?.preferPremium ? (
                        <Award className="h-4 w-4 text-purple-500" />
                      ) : (
                        <Users className="h-4 w-4 text-gray-500" />
                      )}
                      <span>
                        Premium:{' '}
                        {profile?.behaviorPatterns?.qualityPreferences
                          ?.preferPremium
                          ? 'Yes'
                          : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Communication Preferences */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Communication Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      {profile?.behaviorPatterns?.communicationPreferences
                        ?.preferredContactMethod === 'email' && (
                        <Mail className="h-4 w-4" />
                      )}
                      {profile?.behaviorPatterns?.communicationPreferences
                        ?.preferredContactMethod === 'phone' && (
                        <Phone className="h-4 w-4" />
                      )}
                      {profile?.behaviorPatterns?.communicationPreferences
                        ?.preferredContactMethod === 'sms' && (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      <span>
                        Contact:{' '}
                        {
                          profile?.behaviorPatterns?.communicationPreferences
                            ?.preferredContactMethod
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Response:{' '}
                        {
                          profile?.behaviorPatterns?.communicationPreferences
                            ?.responseTimeExpectation
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>
                        Notifications:{' '}
                        {
                          profile?.behaviorPatterns?.communicationPreferences
                            ?.notificationFrequency
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {/* Learning Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Insights</CardTitle>
                <CardDescription>
                  AI-generated insights from user behavior analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Most Used Services */}
                <div>
                  <h4 className="font-semibold mb-3">Most Used Services</h4>
                  <div className="space-y-2">
                    {profile?.learningInsights?.mostUsedServices
                      ?.slice(0, 5)
                      ?.map((service, index) => (
                        <div
                          key={service.service}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              #{index + 1}
                            </span>
                            <span>{service.service}</span>
                          </div>
                          <Badge variant="outline">{service.count} times</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Seasonal Patterns */}
                <div>
                  <h4 className="font-semibold mb-3">Seasonal Patterns</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(
                      profile?.learningInsights?.seasonalPatterns || {}
                    ).map(([season, frequency]) => (
                      <div key={season} className="text-center">
                        <div className="text-2xl font-bold capitalize">
                          {season}
                        </div>
                        <Progress value={frequency * 100} className="mt-2" />
                        <div className="text-sm text-muted-foreground mt-1">
                          {Math.round(frequency * 100)}% activity
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Patterns */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Budget Patterns by Event Type
                  </h4>
                  <div className="space-y-2">
                    {profile?.learningInsights?.budgetPatterns?.map(pattern => (
                      <div
                        key={pattern.eventType}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="capitalize">{pattern.eventType}</span>
                        <span className="font-medium">
                          ${pattern.averageBudget.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Patterns */}
                <div>
                  <h4 className="font-semibold mb-3">Location Patterns</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.learningInsights?.locationPatterns?.map(
                      pattern => (
                        <Badge key={pattern.location} variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {pattern.location} ({pattern.frequency})
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Preference Settings</CardTitle>
                <CardDescription>
                  Configure how preferences are used and updated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-learning">Auto-learning</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically update preferences based on user behavior
                    </p>
                  </div>
                  <Switch id="auto-learning" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="preference-decay">Preference Decay</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce preference weights over time if not used
                    </p>
                  </div>
                  <Switch id="preference-decay" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="privacy-mode">Privacy Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Limit data collection for privacy
                    </p>
                  </div>
                  <Switch id="privacy-mode" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="export-data">Export Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow user to export their preference data
                    </p>
                  </div>
                  <Switch id="export-data" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
