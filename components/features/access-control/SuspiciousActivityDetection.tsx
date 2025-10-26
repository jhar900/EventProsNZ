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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangleIcon,
  ShieldIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ActivityIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface SuspiciousActivity {
  id: string;
  user_id: string;
  activity_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  user_email?: string;
}

interface SuspiciousActivityDetectionProps {
  userId?: string;
}

export default function SuspiciousActivityDetection({
  userId,
}: SuspiciousActivityDetectionProps) {
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<SuspiciousActivity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<
    'resolved' | 'false_positive'
  >('resolved');
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    investigating: 0,
    resolved: 0,
    false_positive: 0,
  });

  // Load activities on component mount
  useEffect(() => {
    loadActivities();
    loadStats();
  }, [userId]);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);

      const response = await fetch(
        `/api/access/suspicious-activities?${params}`
      );
      if (!response.ok) {
        throw new Error('Failed to load suspicious activities');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load activities'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/access/suspicious-activities/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const resolveActivity = async (activityId: string) => {
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution notes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/access/suspicious-activities/${activityId}/resolve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: resolutionStatus,
            resolution_notes: resolutionNotes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve activity');
      }

      setSuccess('Suspicious activity resolved successfully');
      setIsDialogOpen(false);
      setResolutionNotes('');
      loadActivities();
      loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to resolve activity'
      );
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive',
    } as const;

    return (
      <Badge
        variant={variants[severity as keyof typeof variants] || 'secondary'}
      >
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      investigating: 'default',
      resolved: 'secondary',
      false_positive: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (activity: SuspiciousActivity) => {
    switch (activity.status) {
      case 'open':
        return <AlertTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'investigating':
        return <EyeIcon className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'false_positive':
        return <XCircleIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'all') return true;
    return activity.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5" />
            Suspicious Activity Detection
          </CardTitle>
          <CardDescription>
            Monitor and manage suspicious activities and security alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
              <TabsTrigger value="investigating">
                Investigating ({stats.investigating})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({stats.resolved})
              </TabsTrigger>
              <TabsTrigger value="false_positive">
                False Positive ({stats.false_positive})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map(activity => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        {activity.activity_type.replace('_', ' ').toUpperCase()}
                      </TableCell>
                      <TableCell>
                        {activity.user_email || activity.user_id}
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(activity.severity)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(activity)}
                          {getStatusBadge(activity.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {JSON.stringify(activity.details).substring(0, 50)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(activity.created_at),
                          'MMM dd, yyyy HH:mm'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setIsDialogOpen(true);
                            }}
                            disabled={
                              activity.status === 'resolved' ||
                              activity.status === 'false_positive'
                            }
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {activity.status === 'open' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsDialogOpen(true);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredActivities.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No suspicious activities found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Details & Resolution</DialogTitle>
            <DialogDescription>
              Review suspicious activity details and resolve the issue
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Activity Type</Label>
                  <p className="text-sm font-medium">
                    {selectedActivity.activity_type
                      .replace('_', ' ')
                      .toUpperCase()}
                  </p>
                </div>
                <div>
                  <Label>Severity</Label>
                  <div className="mt-1">
                    {getSeverityBadge(selectedActivity.severity)}
                  </div>
                </div>
                <div>
                  <Label>User</Label>
                  <p className="text-sm">
                    {selectedActivity.user_email || selectedActivity.user_id}
                  </p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">
                    {format(
                      new Date(selectedActivity.created_at),
                      'MMM dd, yyyy HH:mm'
                    )}
                  </p>
                </div>
              </div>

              <div>
                <Label>Details</Label>
                <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-auto max-h-40">
                  {JSON.stringify(selectedActivity.details, null, 2)}
                </pre>
              </div>

              {selectedActivity.status === 'open' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolution-status">Resolution Status</Label>
                    <Select
                      value={resolutionStatus}
                      onValueChange={(value: 'resolved' | 'false_positive') =>
                        setResolutionStatus(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="false_positive">
                          False Positive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="resolution-notes">Resolution Notes</Label>
                    <Textarea
                      id="resolution-notes"
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      placeholder="Describe how this activity was resolved or why it's a false positive..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => resolveActivity(selectedActivity.id)}
                      disabled={loading}
                    >
                      {loading ? 'Resolving...' : 'Resolve Activity'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedActivity.status !== 'open' && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    This activity has already been resolved
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="mt-2"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
