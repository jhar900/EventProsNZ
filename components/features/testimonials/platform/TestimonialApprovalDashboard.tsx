'use client';

import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TestimonialCard } from './TestimonialCard';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Flag,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Testimonial {
  id: string;
  rating: number;
  feedback: string;
  category: 'event_manager' | 'contractor';
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  is_verified: boolean;
  is_public: boolean;
  created_at: string;
  approved_at?: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string;
  };
}

interface TestimonialApprovalDashboardProps {
  onTestimonialUpdate?: () => void;
}

export function TestimonialApprovalDashboard({
  onTestimonialUpdate,
}: TestimonialApprovalDashboardProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>(
    []
  );
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);
  const [moderationStatus, setModerationStatus] = useState<
    'approved' | 'rejected' | 'flagged'
  >('approved');
  const [moderationNotes, setModerationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [showOnlyUnverified, setShowOnlyUnverified] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/testimonials/platform');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch testimonials');
      }

      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch testimonials'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async () => {
    if (!selectedTestimonial) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/testimonials/platform/${selectedTestimonial.id}/moderate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: moderationStatus,
            notes: moderationNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to moderate testimonial');
      }

      toast.success('Testimonial moderated successfully');

      // Reset form
      setSelectedTestimonial(null);
      setModerationNotes('');
      setModerationStatus('approved');

      // Refresh testimonials
      await fetchTestimonials();

      if (onTestimonialUpdate) {
        onTestimonialUpdate();
      }
    } catch (error) {
      console.error('Error moderating testimonial:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to moderate testimonial'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'flag') => {
    if (selectedTestimonials.length === 0) {
      toast.error('Please select testimonials to perform bulk action');
      return;
    }

    setIsSubmitting(true);

    try {
      const promises = selectedTestimonials.map(id =>
        fetch(`/api/testimonials/platform/${id}/moderate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status:
              action === 'approve'
                ? 'approved'
                : action === 'reject'
                  ? 'rejected'
                  : 'flagged',
            notes: `Bulk ${action} action`,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const failed = responses.filter(r => !r.ok);

      if (failed.length > 0) {
        toast.error(`Failed to process ${failed.length} testimonials`);
      } else {
        toast.success(
          `Successfully ${action}d ${selectedTestimonials.length} testimonials`
        );
        setSelectedTestimonials([]);
        await fetchTestimonials();
      }
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      flagged: 0,
    };

    testimonials.forEach(testimonial => {
      counts[testimonial.status]++;
    });

    return counts;
  };

  const getFilteredTestimonials = () => {
    return testimonials.filter(testimonial => {
      // Search filter
      if (
        searchTerm &&
        !testimonial.feedback
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !testimonial.user.first_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !testimonial.user.last_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && testimonial.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && testimonial.category !== categoryFilter) {
        return false;
      }

      // Rating filter
      if (ratingFilter !== 'all') {
        const rating = parseInt(ratingFilter);
        if (testimonial.rating !== rating) {
          return false;
        }
      }

      // Verification filter
      if (showOnlyUnverified && testimonial.is_verified) {
        return false;
      }

      return true;
    });
  };

  const statusCounts = getStatusCounts();
  const filteredTestimonials = getFilteredTestimonials();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchTestimonials} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800"
              >
                Pending
              </Badge>
              <span className="text-2xl font-bold">{statusCounts.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Approved
              </Badge>
              <span className="text-2xl font-bold">
                {statusCounts.approved}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-red-100 text-red-800">
                Rejected
              </Badge>
              <span className="text-2xl font-bold">
                {statusCounts.rejected}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800"
              >
                Flagged
              </Badge>
              <span className="text-2xl font-bold">{statusCounts.flagged}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search testimonials..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="event_manager">Event Managers</SelectItem>
                  <SelectItem value="contractor">Contractors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rating">Rating</Label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unverified"
                checked={showOnlyUnverified}
                onCheckedChange={setShowOnlyUnverified}
              />
              <Label htmlFor="unverified">Show only unverified</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTestimonials.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedTestimonials.length} testimonial(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('reject')}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('flag')}
                  disabled={isSubmitting}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Flag All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Testimonials List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Testimonials ({filteredTestimonials.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTestimonials}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredTestimonials.map(testimonial => (
              <div
                key={testimonial.id}
                className={`cursor-pointer transition-colors border rounded-lg p-4 ${
                  selectedTestimonial?.id === testimonial.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTestimonial(testimonial)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedTestimonials.includes(testimonial.id)}
                    onCheckedChange={checked => {
                      if (checked) {
                        setSelectedTestimonials([
                          ...selectedTestimonials,
                          testimonial.id,
                        ]);
                      } else {
                        setSelectedTestimonials(
                          selectedTestimonials.filter(
                            id => id !== testimonial.id
                          )
                        );
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <TestimonialCard
                      testimonial={testimonial}
                      showStatus={true}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Moderation Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Moderation</h3>

          {selectedTestimonial ? (
            <Card>
              <CardHeader>
                <CardTitle>Moderate Testimonial</CardTitle>
                <CardDescription>
                  Review and approve or reject this testimonial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Testimonial Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <TestimonialCard
                    testimonial={selectedTestimonial}
                    showStatus={true}
                  />
                </div>

                {/* Moderation Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="status">Moderation Status</Label>
                    <Select
                      value={moderationStatus}
                      onValueChange={value =>
                        setModerationStatus(
                          value as 'approved' | 'rejected' | 'flagged'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                        <SelectItem value="flagged">Flag for Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Moderation Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about your moderation decision..."
                      value={moderationNotes}
                      onChange={e => setModerationNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedTestimonial(null);
                        setModerationNotes('');
                        setModerationStatus('approved');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleModerate}
                      disabled={isSubmitting}
                      className={
                        moderationStatus === 'approved'
                          ? 'bg-green-600 hover:bg-green-700'
                          : moderationStatus === 'rejected'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-orange-600 hover:bg-orange-700'
                      }
                    >
                      {isSubmitting
                        ? 'Processing...'
                        : `Mark as ${moderationStatus}`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Select a testimonial to moderate
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
