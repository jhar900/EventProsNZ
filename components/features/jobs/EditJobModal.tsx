'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { JobForm } from '@/components/features/jobs/JobForm';
import { JobPreview } from '@/components/features/jobs/JobPreview';
import { JobFormData } from '@/types/jobs';
import { Job } from '@/types/jobs';
import { Edit, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onSuccess?: (jobId: string) => void;
}

export function EditJobModal({
  open,
  onOpenChange,
  job,
  onSuccess,
}: EditJobModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [jobData, setJobData] = useState<JobFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes or job changes
  useEffect(() => {
    if (!open) {
      setStep('form');
      setJobData(null);
      setError(null);
      setIsSubmitting(false);
    } else if (job) {
      // Pre-populate form with job data
      setJobData({
        title: job.title,
        description: job.description,
        service_category: job.service_category,
        location: job.location || '',
        is_remote: job.is_remote || false,
        budget_range_min: job.budget_range_min,
        budget_range_max: job.budget_range_max,
        coordinates: job.coordinates,
        special_requirements: job.special_requirements || '',
        contact_email: job.contact_email || '',
        contact_phone: job.contact_phone || '',
        response_preferences: job.response_preferences || '',
        timeline_start_date: job.timeline_start_date || '',
        timeline_end_date: job.timeline_end_date || '',
        event_id: job.event_id,
      });
    }
  }, [open, job]);

  // Handle form submission
  const handleFormSubmit = (data: JobFormData) => {
    setJobData(data);
    setStep('preview');
  };

  // Handle preview submission
  const handlePreviewSubmit = async () => {
    if (!jobData || !job) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Include user ID in header as fallback if cookies fail
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(jobData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || 'Failed to update job'
        );
      }

      // Close modal and reset state
      onOpenChange(false);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result.job?.id || job.id);
      }

      // Refresh the page to show updated job
      router.refresh();
    } catch (error) {
      console.error('Job update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update job');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit from preview
  const handleEdit = () => {
    setStep('form');
  };

  // Handle cancel
  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Posting</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`flex items-center gap-2 ${
              step === 'form' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'form' ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Edit className="h-4 w-4" />
            </div>
            <span className="font-medium">Edit</span>
          </div>
          <div className="flex-1 h-px bg-gray-200"></div>
          <div
            className={`flex items-center gap-2 ${
              step === 'preview' ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'preview' ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Eye className="h-4 w-4" />
            </div>
            <span className="font-medium">Preview</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {step === 'form' ? (
          <JobForm
            initialData={jobData || undefined}
            onSuccess={handleFormSubmit}
            onCancel={handleCancel}
            isEditing={true}
            jobId={job.id}
          />
        ) : (
          jobData && (
            <JobPreview
              jobData={jobData}
              onEdit={handleEdit}
              onSubmit={handlePreviewSubmit}
              isEditing={true}
              isSubmitting={isSubmitting}
            />
          )
        )}

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] rounded-lg">
            <Card className="p-6">
              <CardContent className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Updating job posting...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
