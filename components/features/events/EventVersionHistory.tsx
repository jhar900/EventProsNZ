'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  History,
  User,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { EventVersion } from '@/types/events';
import { format } from 'date-fns';

interface EventVersionHistoryProps {
  eventId: string;
}

export function EventVersionHistory({ eventId }: EventVersionHistoryProps) {
  const [versions, setVersions] = useState<EventVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<EventVersion | null>(
    null
  );
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [eventId]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.versions);
        if (data.versions.length > 0) {
          setSelectedVersion(data.versions[0]);
        }
      } else {
        setError(data.message || 'Failed to load version history');
      }
    } catch (err) {
      setError('Failed to load version history');
      } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return dateString;
    }
  };

  const getChangeType = (changes: any) => {
    if (changes.action === 'created') {
      return {
        type: 'created',
        label: 'Created',
        color: 'bg-green-100 text-green-800',
      };
    } else if (
      changes.changed_fields &&
      Object.keys(changes.changed_fields).length > 0
    ) {
      return {
        type: 'updated',
        label: 'Updated',
        color: 'bg-blue-100 text-blue-800',
      };
    } else {
      return {
        type: 'modified',
        label: 'Modified',
        color: 'bg-yellow-100 text-yellow-800',
      };
    }
  };

  const getChangedFields = (changes: any) => {
    if (changes.action === 'created') {
      return ['Event created'];
    }

    const changedFields = changes.changed_fields || {};
    return Object.keys(changedFields).map(field => {
      const fieldName = field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      return `${fieldName} changed`;
    });
  };

  const renderVersionDetails = (version: EventVersion) => {
    const changeInfo = getChangeType(version.changes);
    const changedFields = getChangedFields(version.changes);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={changeInfo.color}>{changeInfo.label}</Badge>
            <span className="text-sm text-muted-foreground">
              Version {version.version_number}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(version.created_at)}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Changes Made:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {changedFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
        </div>

        {version.profiles && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              Changed by {version.profiles.first_name}{' '}
              {version.profiles.last_name}
            </span>
          </div>
        )}

        {showDiff && version.changes.changed_fields && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Detailed Changes:</h4>
            <div className="space-y-3">
              {Object.entries(version.changes.changed_fields).map(
                ([field, value]) => (
                  <div key={field} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium text-sm mb-2">
                      {field
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-sm">
                      <div className="text-red-600">
                        <strong>Old:</strong>{' '}
                        {JSON.stringify(version.changes.old?.[field] || 'N/A')}
                      </div>
                      <div className="text-green-600">
                        <strong>New:</strong> {JSON.stringify(value)}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading version history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (versions.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No version history available for this event.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            {versions.length} version{versions.length !== 1 ? 's' : ''}{' '}
            available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {versions.map((version, index) => {
              const changeInfo = getChangeType(version.changes);
              const isSelected = selectedVersion?.id === version.id;

              return (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className={changeInfo.color}>
                          {changeInfo.label}
                        </Badge>
                        <span className="font-medium">
                          Version {version.version_number}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(version.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {version.profiles && (
                        <div className="text-sm text-muted-foreground">
                          {version.profiles.first_name}{' '}
                          {version.profiles.last_name}
                        </div>
                      )}
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Version Details */}
      {selectedVersion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Version {selectedVersion.version_number} Details
                </CardTitle>
                <CardDescription>
                  {formatDate(selectedVersion.created_at)}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiff(!showDiff)}
              >
                {showDiff ? 'Hide' : 'Show'} Detailed Changes
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderVersionDetails(selectedVersion)}</CardContent>
        </Card>
      )}

      {/* Navigation */}
      {selectedVersion && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = versions.findIndex(
                v => v.id === selectedVersion.id
              );
              if (currentIndex < versions.length - 1) {
                setSelectedVersion(versions[currentIndex + 1]);
              }
            }}
            disabled={
              versions.findIndex(v => v.id === selectedVersion.id) >=
              versions.length - 1
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous Version
          </Button>

          <div className="text-sm text-muted-foreground">
            Version {selectedVersion.version_number} of {versions.length}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = versions.findIndex(
                v => v.id === selectedVersion.id
              );
              if (currentIndex > 0) {
                setSelectedVersion(versions[currentIndex - 1]);
              }
            }}
            disabled={versions.findIndex(v => v.id === selectedVersion.id) <= 0}
          >
            Next Version
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
