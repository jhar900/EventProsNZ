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
import {
  EventSelector,
  EventData,
} from '@/components/features/jobs/EventSelector';
import { ContactPerson } from '@/components/features/jobs/ContactPersonSelector';
import { JobFormData, JobWithDetails } from '@/types/jobs';
import { Edit, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobWithDetails | null;
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
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [selectedContactPerson, setSelectedContactPerson] =
    useState<ContactPerson | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes or job changes
  useEffect(() => {
    if (!open) {
      setStep('form');
      setJobData(null);
      setSelectedEvent(null);
      setSelectedContactPerson(null);
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
        contact_person_id: job.contact_person_id || undefined,
        response_preferences: job.response_preferences || '',
        timeline_start_date: job.timeline_start_date || '',
        timeline_end_date: job.timeline_end_date || '',
        event_id: job.event_id,
      });

      // Pre-select existing event if job has one
      if (job.event) {
        setSelectedEvent({
          id: job.event.id,
          title: job.event.title,
          event_type: job.event.event_type,
          event_date: job.event.event_date,
          location: job.event.location || '',
        });
      } else {
        setSelectedEvent(null);
      }

      // Pre-select contact person if job has one
      if (job.contact_person) {
        setSelectedContactPerson({
          id: job.contact_person.id,
          name: `${job.contact_person.first_name} ${job.contact_person.last_name}`.trim(),
          email: job.contact_person.email,
          phone: job.contact_person.phone,
          avatar_url: job.contact_person.avatar_url,
        });
      } else {
        setSelectedContactPerson(null);
      }
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

    // If jobData has updated_at, the job was already updated by JobForm
    // Just close the modal and call onSuccess
    if ((jobData as any).updated_at) {
      onOpenChange(false);
      if (onSuccess) {
        onSuccess((jobData as any).id || job.id);
      }
      router.refresh();
      return;
    }

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
          <div className="space-y-6">
            {/* Event Selector */}
            {user?.id && (
              <EventSelector
                userId={user.id}
                selectedEventId={selectedEvent?.id}
                onSelect={setSelectedEvent}
              />
            )}

            <JobForm
              initialData={jobData || undefined}
              onSuccess={handleFormSubmit}
              onCancel={handleCancel}
              onContactPersonChange={setSelectedContactPerson}
              isEditing={true}
              jobId={job.id}
              eventData={selectedEvent || undefined}
            />
          </div>
        ) : (
          jobData && (
            <JobPreview
              jobData={jobData}
              eventData={selectedEvent || undefined}
              contactPerson={
                selectedContactPerson
                  ? {
                      id: selectedContactPerson.id,
                      name: selectedContactPerson.name,
                      email: selectedContactPerson.email,
                      phone: selectedContactPerson.phone,
                      avatar_url: selectedContactPerson.avatar_url,
                    }
                  : undefined
              }
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
