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
import {
  Loader2,
  Rocket,
  Star,
  Plus,
  Send,
  Clock,
  CheckCircle,
  X,
} from 'lucide-react';

interface EarlyAccessProps {
  userId?: string;
}

interface EarlyAccessFeature {
  id: string;
  feature_name: string;
  feature_description: string;
  tier_required: string;
  is_active: boolean;
  created_at: string;
}

interface EarlyAccessRequest {
  id: string;
  user_id: string;
  feature_name: string;
  reason: string;
  status: string;
  created_at: string;
}

export function EarlyAccess({ userId }: EarlyAccessProps) {
  const [earlyAccessFeatures, setEarlyAccessFeatures] = useState<
    EarlyAccessFeature[]
  >([]);
  const [userRequests, setUserRequests] = useState<EarlyAccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    feature_name: '',
    reason: '',
  });

  useEffect(() => {
    loadEarlyAccessFeatures();
    loadUserRequests();
  }, [userId]);

  const loadEarlyAccessFeatures = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/features/early-access?user_id=${userId || ''}`
      );
      if (!response.ok) {
        throw new Error('Failed to load early access features');
      }

      const data = await response.json();
      setEarlyAccessFeatures(data.early_access_features || []);
      setHasAccess(data.has_early_access);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserRequests = async () => {
    try {
      // This would typically be a separate endpoint for user requests
      // For now, we'll simulate with empty array
      setUserRequests([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.feature_name || !newRequest.reason) return;

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/features/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_name: newRequest.feature_name,
          reason: newRequest.reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create early access request');
      }

      const data = await response.json();
      setUserRequests(prev => [data.request, ...prev]);
      setNewRequest({ feature_name: '', reason: '' });
      setShowRequestForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading early access features...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="h-6 w-6 text-purple-500" />
            <span>Early Access</span>
          </CardTitle>
          <CardDescription>
            Get early access to new platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Early Access Not Available
            </h3>
            <p className="text-gray-500 mb-4">
              Upgrade to Showcase or Spotlight plan to get early access to new
              features.
            </p>
            <Button>Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Early Access Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="h-6 w-6 text-purple-500" />
            <span>Early Access Features</span>
          </CardTitle>
          <CardDescription>
            Be the first to try new platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Rocket className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {earlyAccessFeatures.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Available Features
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{userRequests.length}</p>
                <p className="text-sm text-muted-foreground">Your Requests</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Features */}
      {earlyAccessFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Early Access Features</CardTitle>
            <CardDescription>
              New features you can try before they&apos;re released to everyone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {earlyAccessFeatures.map(feature => (
                <div
                  key={feature.id}
                  className="flex items-start space-x-3 p-4 border rounded-lg"
                >
                  <Rocket className="h-5 w-5 text-purple-500 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{feature.feature_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {feature.tier_required}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.feature_description}
                    </p>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        Try Feature
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewRequest(prev => ({
                            ...prev,
                            feature_name: feature.feature_name,
                          }));
                          setShowRequestForm(true);
                        }}
                      >
                        Request Access
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Early Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Request Early Access</span>
              </CardTitle>
              <CardDescription>
                Request access to specific features or suggest new ones
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowRequestForm(!showRequestForm)}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Request</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showRequestForm ? (
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <Label htmlFor="feature_name">Feature Name</Label>
                <Input
                  id="feature_name"
                  value={newRequest.feature_name}
                  onChange={e =>
                    setNewRequest(prev => ({
                      ...prev,
                      feature_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Advanced Analytics Dashboard"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason for Request</Label>
                <Textarea
                  id="reason"
                  value={newRequest.reason}
                  onChange={e =>
                    setNewRequest(prev => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Explain why you need early access to this feature..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Request Early Access
              </h3>
              <p className="text-gray-500 mb-4">
                Submit a request for early access to specific features.
              </p>
              <Button onClick={() => setShowRequestForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Requests */}
      {userRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Early Access Requests</CardTitle>
            <CardDescription>
              Track the status of your early access requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRequests.map(request => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{request.feature_name}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {request.reason}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Submitted {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={getStatusColor(request.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(request.status)}
                        <span>{request.status}</span>
                      </div>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Early Access Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Early Access Benefits</CardTitle>
          <CardDescription>Why early access is valuable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Rocket className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="font-medium">First to Try</h4>
                  <p className="text-sm text-muted-foreground">
                    Be among the first to experience new features
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="font-medium">Influence Development</h4>
                  <p className="text-sm text-muted-foreground">
                    Your feedback helps shape the final product
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="font-medium">Competitive Advantage</h4>
                  <p className="text-sm text-muted-foreground">
                    Stay ahead of the competition with new tools
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="font-medium">Priority Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Get dedicated support for early access features
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
