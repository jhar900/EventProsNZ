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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
} from 'lucide-react';
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

interface QualityCheck {
  id: string;
  testimonial_id: string;
  check_type: 'profanity' | 'spam' | 'quality' | 'sentiment';
  status: 'passed' | 'failed' | 'warning';
  score: number;
  details: string;
  created_at: string;
}

interface ContentModerationToolsProps {
  testimonial: Testimonial;
  onModerationComplete?: (testimonialId: string, action: string) => void;
}

export function ContentModerationTools({
  testimonial,
  onModerationComplete,
}: ContentModerationToolsProps) {
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningChecks, setRunningChecks] = useState(false);
  const [moderationNotes, setModerationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (testimonial) {
      fetchQualityChecks();
    }
  }, [testimonial]);

  const fetchQualityChecks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/testimonials/platform/${testimonial.id}/quality-checks`
      );
      const data = await response.json();

      if (response.ok) {
        setQualityChecks(data.qualityChecks || []);
      }
    } catch (error) {
      console.error('Error fetching quality checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const runQualityChecks = async () => {
    try {
      setRunningChecks(true);
      const response = await fetch(
        `/api/testimonials/platform/${testimonial.id}/quality-checks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run quality checks');
      }

      setQualityChecks(data.qualityChecks || []);
      toast.success('Quality checks completed');
    } catch (error) {
      console.error('Error running quality checks:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to run quality checks'
      );
    } finally {
      setRunningChecks(false);
    }
  };

  const moderateTestimonial = async (action: 'approve' | 'reject' | 'flag') => {
    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/testimonials/platform/${testimonial.id}/moderate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: action,
            notes: moderationNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to moderate testimonial');
      }

      toast.success(`Testimonial ${action}d successfully`);

      if (onModerationComplete) {
        onModerationComplete(testimonial.id, action);
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

  const getQualityScore = () => {
    if (qualityChecks.length === 0) return 0;

    const totalScore = qualityChecks.reduce(
      (sum, check) => sum + check.score,
      0
    );
    return Math.round(totalScore / qualityChecks.length);
  };

  const getOverallStatus = () => {
    if (qualityChecks.length === 0) return 'unknown';

    const failedChecks = qualityChecks.filter(
      check => check.status === 'failed'
    );
    const warningChecks = qualityChecks.filter(
      check => check.status === 'warning'
    );

    if (failedChecks.length > 0) return 'failed';
    if (warningChecks.length > 0) return 'warning';
    return 'passed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const overallStatus = getOverallStatus();
  const qualityScore = getQualityScore();

  return (
    <div className="space-y-6">
      {/* Quality Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Content Quality Analysis</span>
          </CardTitle>
          <CardDescription>
            Automated quality checks and content moderation tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {qualityScore}%
              </div>
              <div className="text-sm text-gray-600">Quality Score</div>
              <Progress value={qualityScore} className="mt-2" />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                {getStatusIcon(overallStatus)}
                <span className="font-semibold capitalize">
                  {overallStatus}
                </span>
              </div>
              <div className="text-sm text-gray-600">Overall Status</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {qualityChecks.length}
              </div>
              <div className="text-sm text-gray-600">Checks Run</div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={runQualityChecks}
              disabled={runningChecks}
              className="flex items-center space-x-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${runningChecks ? 'animate-spin' : ''}`}
              />
              <span>
                {runningChecks ? 'Running Checks...' : 'Run Quality Checks'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quality Check Results */}
      {qualityChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Check Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityChecks.map(check => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="font-semibold capitalize">
                        {check.check_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {check.details}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(check.status)}>
                      {check.status}
                    </Badge>
                    <div className="text-sm font-semibold">{check.score}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Actions</CardTitle>
          <CardDescription>
            Review quality checks and take moderation action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quality Warnings */}
          {overallStatus === 'failed' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This testimonial failed quality checks and may need manual
                review.
              </AlertDescription>
            </Alert>
          )}

          {overallStatus === 'warning' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This testimonial has quality warnings. Please review before
                approving.
              </AlertDescription>
            </Alert>
          )}

          {/* Moderation Notes */}
          <div>
            <Label htmlFor="moderationNotes">Moderation Notes</Label>
            <Textarea
              id="moderationNotes"
              placeholder="Add notes about your moderation decision..."
              value={moderationNotes}
              onChange={e => setModerationNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => moderateTestimonial('flag')}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Flag className="h-4 w-4 mr-2" />
              Flag for Review
            </Button>

            <Button
              variant="destructive"
              onClick={() => moderateTestimonial('reject')}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>

            <Button
              onClick={() => moderateTestimonial('approve')}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Content Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">
                Testimonial Content
              </Label>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-gray-800 italic">
                  &ldquo;{testimonial.feedback}&rdquo;
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-semibold">Rating</Label>
                <div className="text-gray-600">
                  {testimonial.rating}/5 stars
                </div>
              </div>
              <div>
                <Label className="font-semibold">Category</Label>
                <div className="text-gray-600 capitalize">
                  {testimonial.category.replace('_', ' ')}
                </div>
              </div>
              <div>
                <Label className="font-semibold">Verified</Label>
                <div className="text-gray-600">
                  {testimonial.is_verified ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <Label className="font-semibold">Status</Label>
                <Badge className={getStatusColor(testimonial.status)}>
                  {testimonial.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
