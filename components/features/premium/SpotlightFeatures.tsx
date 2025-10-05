'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, Star, Zap, Plus, Edit, Trash2 } from 'lucide-react';

interface SpotlightFeature {
  id: string;
  user_id: string;
  feature_type: string;
  feature_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SpotlightFeaturesProps {
  userId?: string;
}

export function SpotlightFeatures({ userId }: SpotlightFeaturesProps) {
  const [spotlightFeatures, setSpotlightFeatures] = useState<
    SpotlightFeature[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFeature, setNewFeature] = useState({
    feature_type: '',
    feature_data: '',
  });

  useEffect(() => {
    loadSpotlightFeatures();
  }, [userId]);

  const loadSpotlightFeatures = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/features/spotlight?user_id=${userId || ''}`
      );
      if (!response.ok) {
        throw new Error('Failed to load spotlight features');
      }

      const data = await response.json();
      setSpotlightFeatures(data.spotlight_features || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeature.feature_type) return;

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/features/spotlight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_type: newFeature.feature_type,
          feature_data: newFeature.feature_data
            ? JSON.parse(newFeature.feature_data)
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create spotlight feature');
      }

      const data = await response.json();
      setSpotlightFeatures(prev => [data.spotlight_feature, ...prev]);
      setNewFeature({ feature_type: '', feature_data: '' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const getFeatureIcon = (featureType: string) => {
    switch (featureType) {
      case 'homepage_featured':
        return <Eye className="h-5 w-5 text-blue-500" />;
      case 'priority_listing':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'custom_branding':
        return <Zap className="h-5 w-5 text-purple-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFeatureName = (featureType: string) => {
    switch (featureType) {
      case 'homepage_featured':
        return 'Homepage Featured';
      case 'priority_listing':
        return 'Priority Listing';
      case 'custom_branding':
        return 'Custom Branding';
      default:
        return featureType
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getFeatureDescription = (featureType: string) => {
    switch (featureType) {
      case 'homepage_featured':
        return 'Get featured on the homepage for maximum visibility';
      case 'priority_listing':
        return 'Your listings appear first in search results';
      case 'custom_branding':
        return 'Customize your profile with your brand colors and logo';
      default:
        return 'Custom spotlight feature';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading spotlight features...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-6 w-6 text-yellow-500" />
              <span>Spotlight Features</span>
            </CardTitle>
            <CardDescription>
              Premium features to make your profile stand out
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Feature</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create Feature Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create Spotlight Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFeature} className="space-y-4">
                <div>
                  <Label htmlFor="feature_type">Feature Type</Label>
                  <Input
                    id="feature_type"
                    value={newFeature.feature_type}
                    onChange={e =>
                      setNewFeature(prev => ({
                        ...prev,
                        feature_type: e.target.value,
                      }))
                    }
                    placeholder="e.g., homepage_featured"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="feature_data">Feature Data (JSON)</Label>
                  <Textarea
                    id="feature_data"
                    value={newFeature.feature_data}
                    onChange={e =>
                      setNewFeature(prev => ({
                        ...prev,
                        feature_data: e.target.value,
                      }))
                    }
                    placeholder='{"title": "Featured Contractor", "description": "..."}'
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Create Feature
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Spotlight Features List */}
        {spotlightFeatures.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Spotlight Features
            </h3>
            <p className="text-gray-500 mb-4">
              You don&apos;t have any spotlight features yet. Create one to get
              started.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Feature
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {spotlightFeatures.map(feature => (
              <div
                key={feature.id}
                className="flex items-start space-x-3 p-4 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getFeatureIcon(feature.feature_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {getFeatureName(feature.feature_type)}
                    </h4>
                    <Badge
                      variant={feature.is_active ? 'default' : 'secondary'}
                      className={
                        feature.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {feature.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getFeatureDescription(feature.feature_type)}
                  </p>
                  {feature.feature_data && (
                    <div className="mt-2">
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(feature.feature_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mt-3">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature Benefits */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">
            Spotlight Benefits
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Get featured on the homepage for maximum visibility</li>
            <li>• Priority placement in search results</li>
            <li>• Custom branding and profile customization</li>
            <li>• Enhanced analytics and insights</li>
            <li>• Dedicated support and early access to new features</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
