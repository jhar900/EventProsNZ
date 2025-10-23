'use client';

import { useState } from 'react';
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
import { TestimonialCard } from './TestimonialCard';
import { toast } from 'sonner';

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

interface TestimonialModerationProps {
  testimonials: Testimonial[];
  onTestimonialUpdate?: () => void;
}

export function TestimonialModeration({
  testimonials,
  onTestimonialUpdate,
}: TestimonialModerationProps) {
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);
  const [moderationStatus, setModerationStatus] = useState<
    'approved' | 'rejected' | 'flagged'
  >('approved');
  const [moderationNotes, setModerationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const statusCounts = getStatusCounts();

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Testimonials List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Testimonials</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {testimonials.map(testimonial => (
              <div
                key={testimonial.id}
                className={`cursor-pointer transition-colors ${
                  selectedTestimonial?.id === testimonial.id
                    ? 'ring-2 ring-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTestimonial(testimonial)}
              >
                <TestimonialCard testimonial={testimonial} showStatus={true} />
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
