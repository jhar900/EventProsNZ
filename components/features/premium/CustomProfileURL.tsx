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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link, Check, X, Edit, ExternalLink } from 'lucide-react';

interface CustomProfileURLProps {
  userId?: string;
}

interface CustomProfileURL {
  id: string;
  user_id: string;
  custom_url: string;
  tier_required: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function CustomProfileURL({ userId }: CustomProfileURLProps) {
  const [customUrl, setCustomUrl] = useState<CustomProfileURL | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    loadCustomUrl();
  }, [userId]);

  const loadCustomUrl = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/features/custom-url?user_id=${userId || ''}`
      );
      if (!response.ok) {
        throw new Error('Failed to load custom URL');
      }

      const data = await response.json();
      setCustomUrl(data.custom_url);
      setHasAccess(data.has_custom_url_access);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/features/custom-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          custom_url: newUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create custom URL');
      }

      const data = await response.json();
      setCustomUrl(data.custom_url);
      setNewUrl('');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUrl = () => {
    setNewUrl(customUrl?.custom_url || '');
    setIsEditing(true);
  };

  const validateUrl = (url: string) => {
    const regex = /^[a-zA-Z0-9-]{3,30}$/;
    return regex.test(url);
  };

  const getUrlStatus = () => {
    if (!customUrl) return null;
    if (customUrl.is_active) return 'active';
    return 'inactive';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading custom URL...</span>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-6 w-6 text-purple-500" />
            <span>Custom Profile URL</span>
          </CardTitle>
          <CardDescription>
            Get a custom URL for your profile (eventpros.co.nz/your-name)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Custom URLs Not Available
            </h3>
            <p className="text-gray-500 mb-4">
              Upgrade to Spotlight plan to get a custom profile URL.
            </p>
            <Button>Upgrade to Spotlight</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Link className="h-6 w-6 text-purple-500" />
          <span>Custom Profile URL</span>
        </CardTitle>
        <CardDescription>
          Get a custom URL for your profile to make it easier to share
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Custom URL */}
        {customUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Link className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">
                    eventpros.co.nz/{customUrl.custom_url}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created{' '}
                    {new Date(customUrl.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    getUrlStatus() === 'active' ? 'default' : 'secondary'
                  }
                  className={
                    getUrlStatus() === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {getUrlStatus() === 'active' ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
                <Button size="sm" variant="outline" onClick={handleEditUrl}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://eventpros.co.nz/${customUrl.custom_url}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Visit Your Profile
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Custom URL Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create a custom URL to make your profile easier to find and share.
            </p>
            <Button onClick={() => setIsEditing(true)}>
              Create Custom URL
            </Button>
          </div>
        )}

        {/* Create/Edit Form */}
        {isEditing && (
          <form onSubmit={handleCreateUrl} className="space-y-4">
            <div>
              <Label htmlFor="custom_url">Custom URL</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  eventpros.co.nz/
                </span>
                <Input
                  id="custom_url"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="your-company-name"
                  className="flex-1"
                  required
                />
              </div>
              {newUrl && !validateUrl(newUrl) && (
                <p className="text-sm text-red-500 mt-1">
                  URL must be 3-30 characters, letters, numbers, and hyphens
                  only
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Choose a URL that represents your business (e.g.,
                your-company-name)
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={isCreating || !validateUrl(newUrl)}
              >
                {isCreating && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {customUrl ? 'Update URL' : 'Create URL'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setNewUrl('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Benefits */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">
            Custom URL Benefits
          </h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Easy to remember and share with clients</li>
            <li>• Professional appearance in marketing materials</li>
            <li>• Better SEO for your profile</li>
            <li>• Brand consistency across platforms</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
