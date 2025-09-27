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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  History,
  User,
  Calendar,
  GitCommit,
  Eye,
  RotateCcw,
  Plus,
} from 'lucide-react';

interface EventVersionHistoryProps {
  eventId: string;
}

interface EventVersion {
  id: string;
  version_number: number;
  changes: any;
  created_by: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export function EventVersionHistory({ eventId }: EventVersionHistoryProps) {
  const [versions, setVersions] = useState<EventVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChanges, setNewChanges] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadVersions();
  }, [eventId]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newChanges.trim()) return;

    try {
      setIsCreating(true);
      const changes = {
        action: 'manual_update',
        changes: newChanges,
        reason: reason || undefined,
      };

      const response = await fetch(`/api/events/${eventId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          changes,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewChanges('');
        setReason('');
        setShowCreateForm(false);
        await loadVersions();
      } else {
        console.error('Error creating version:', data.message);
      }
    } catch (error) {
      console.error('Error creating version:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangeTypeColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'duplicated':
        return 'bg-purple-100 text-purple-800';
      case 'manual_update':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      case 'duplicated':
        return 'Duplicated';
      case 'manual_update':
        return 'Manual Update';
      default:
        return 'Modified';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Version Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitCommit className="h-5 w-5 mr-2" />
            Create New Version
          </CardTitle>
          <CardDescription>
            Record a new version of this event with your changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Version
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="changes">Changes Description</Label>
                <Textarea
                  id="changes"
                  placeholder="Describe the changes made to this event..."
                  value={newChanges}
                  onChange={e => setNewChanges(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for these changes..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCreateVersion}
                  disabled={!newChanges.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Version'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewChanges('');
                    setReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Version History
          </CardTitle>
          <CardDescription>
            Track all changes made to this event over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No versions recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        v{version.version_number}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={getChangeTypeColor(
                            version.changes?.action || 'updated'
                          )}
                        >
                          {getChangeTypeLabel(
                            version.changes?.action || 'updated'
                          )}
                        </Badge>
                        {version.changes?.original_event_id && (
                          <Badge variant="outline">
                            From Event #
                            {version.changes.original_event_id.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(version.created_at)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-1" />
                      {version.profiles
                        ? `${version.profiles.first_name} ${version.profiles.last_name}`
                        : 'Unknown User'}
                    </div>
                    {version.changes?.changes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          {version.changes.changes}
                        </p>
                      </div>
                    )}
                    {version.changes?.reason && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Reason:</strong> {version.changes.reason}
                      </div>
                    )}
                    <div className="mt-3 flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {index > 0 && (
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Compare
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
