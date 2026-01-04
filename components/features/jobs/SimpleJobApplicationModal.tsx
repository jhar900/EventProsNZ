'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SimpleJobApplicationForm } from './SimpleJobApplicationForm';
import { Job } from '@/types/jobs';

interface SimpleJobApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onSuccess?: (application: any) => void;
}

export function SimpleJobApplicationModal({
  open,
  onOpenChange,
  job,
  onSuccess,
}: SimpleJobApplicationModalProps) {
  console.log(
    '[SimpleJobApplicationModal] Render - open:',
    open,
    'job:',
    job?.id
  );

  const handleSuccess = (application: any) => {
    // Don't close modal automatically - let the form show success message
    if (onSuccess) {
      onSuccess(application);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!job) {
    console.log('[SimpleJobApplicationModal] No job, returning null');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Job</DialogTitle>
        </DialogHeader>
        <SimpleJobApplicationForm
          key={job.id}
          jobId={job.id}
          jobTitle={job.title}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
