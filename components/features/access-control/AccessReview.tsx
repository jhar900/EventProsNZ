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
import { Input } from '@/components/ui/input';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangleIcon,
  ShieldIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  FileTextIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AccessReview {
  id: string;
  reviewer_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  review_notes?: string;
  created_at: string;
  completed_at?: string;
  expires_at: string;
  user_email?: string;
  reviewer_email?: string;
  user_roles?: any[];
  user_permissions?: any[];
}

interface AccessReviewProps {
  userId?: string;
}

export default function AccessReview({ userId }: AccessReviewProps) {
  const [reviews, setReviews] = useState<AccessReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<AccessReview | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<
    'approved' | 'rejected' | 'needs_review'
  >('approved');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    needs_review: 0,
  });

  // Load reviews on component mount
  useEffect(() => {
    loadReviews();
    loadStats();
  }, [userId]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);

      const response = await fetch(`/api/access/access-reviews?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load access reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/access/access-reviews/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const createReview = async () => {
    if (!selectedUser || !expirationDate) {
      setError('Please select user and expiration date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/access/access-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser,
          expires_at: expirationDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create access review');
      }

      setSuccess('Access review created successfully');
      setIsCreateDialogOpen(false);
      setSelectedUser('');
      setExpirationDate(undefined);
      loadReviews();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create review');
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (reviewId: string) => {
    if (!reviewNotes.trim()) {
      setError('Please provide review notes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/access/access-reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          review_notes: reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update review');
      }

      setSuccess('Access review updated successfully');
      setIsDialogOpen(false);
      setReviewNotes('');
      loadReviews();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      approved: 'secondary',
      rejected: 'destructive',
      needs_review: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (review: AccessReview) => {
    switch (review.status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'needs_review':
        return <EyeIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <FileTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const filteredReviews = reviews.filter(review => {
    if (activeTab === 'all') return true;
    return review.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5" />
            Access Review System
          </CardTitle>
          <CardDescription>
            Manage user access reviews and cleanup processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({stats.rejected})
              </TabsTrigger>
              <TabsTrigger value="needs_review">
                Needs Review ({stats.needs_review})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Access Reviews</h3>
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <UserIcon className="h-4 w-4 mr-2" />
                      Create Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Access Review</DialogTitle>
                      <DialogDescription>
                        Create a new access review for a user
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="user-select">User</Label>
                        <Input
                          id="user-select"
                          value={selectedUser}
                          onChange={e => setSelectedUser(e.target.value)}
                          placeholder="Enter user ID or email"
                        />
                      </div>
                      <div>
                        <Label>Expiration Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !expirationDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {expirationDate
                                ? format(expirationDate, 'PPP')
                                : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={expirationDate}
                              onSelect={setExpirationDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={createReview} disabled={loading}>
                          {loading ? 'Creating...' : 'Create Review'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

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
                    <TableHead>User</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map(review => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.user_email || review.user_id}
                      </TableCell>
                      <TableCell>
                        {review.reviewer_email || review.reviewer_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(review)}
                          {getStatusBadge(review.status)}
                          {isExpired(review.expires_at) && (
                            <Badge variant="destructive">EXPIRED</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={cn(
                            'text-sm',
                            isExpired(review.expires_at) && 'text-red-500'
                          )}
                        >
                          {format(new Date(review.expires_at), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(review.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReview(review);
                              setIsDialogOpen(true);
                            }}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {review.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReview(review);
                                setIsDialogOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredReviews.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No access reviews found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Access Review Details</DialogTitle>
            <DialogDescription>
              Review user access and make a decision
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <p className="text-sm font-medium">
                    {selectedReview.user_email || selectedReview.user_id}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedReview.status)}
                  </div>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">
                    {format(
                      new Date(selectedReview.created_at),
                      'MMM dd, yyyy HH:mm'
                    )}
                  </p>
                </div>
                <div>
                  <Label>Expires</Label>
                  <p
                    className={cn(
                      'text-sm',
                      isExpired(selectedReview.expires_at) && 'text-red-500'
                    )}
                  >
                    {format(
                      new Date(selectedReview.expires_at),
                      'MMM dd, yyyy HH:mm'
                    )}
                  </p>
                </div>
              </div>

              {/* User Roles and Permissions */}
              <div className="space-y-4">
                <div>
                  <Label>User Roles</Label>
                  <div className="mt-2 space-y-2">
                    {selectedReview.user_roles?.map((role, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox checked={true} disabled />
                        <span className="text-sm">{role.name}</span>
                        <Badge variant="outline">
                          {role.permissions?.length || 0} permissions
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">
                        No roles assigned
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>User Permissions</Label>
                  <div className="mt-2 space-y-2">
                    {selectedReview.user_permissions?.map(
                      (permission, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox checked={true} disabled />
                          <span className="text-sm">{permission.name}</span>
                          <Badge variant="outline">
                            {permission.resource}:{permission.action}
                          </Badge>
                        </div>
                      )
                    ) || (
                      <p className="text-sm text-muted-foreground">
                        No direct permissions assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedReview.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="review-status">Review Decision</Label>
                    <Select
                      value={reviewStatus}
                      onValueChange={(
                        value: 'approved' | 'rejected' | 'needs_review'
                      ) => setReviewStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve Access</SelectItem>
                        <SelectItem value="rejected">Reject Access</SelectItem>
                        <SelectItem value="needs_review">
                          Needs Further Review
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="review-notes">Review Notes</Label>
                    <Textarea
                      id="review-notes"
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      placeholder="Provide detailed notes about your review decision..."
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
                      onClick={() => updateReview(selectedReview.id)}
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Review'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedReview.status !== 'pending' && (
                <div className="space-y-4">
                  {selectedReview.review_notes && (
                    <div>
                      <Label>Review Notes</Label>
                      <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                        {selectedReview.review_notes}
                      </p>
                    </div>
                  )}

                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      This review has already been completed
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="mt-2"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
