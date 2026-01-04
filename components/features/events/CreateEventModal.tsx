'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EventCreationWizard } from './EventCreationWizard';
import { useRouter } from 'next/navigation';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (eventId: string) => void;
}

export function CreateEventModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateEventModalProps) {
  const router = useRouter();

  const handleComplete = (eventId: string) => {
    // Close the modal
    onOpenChange(false);

    // Call the onSuccess callback if provided
    if (onSuccess) {
      onSuccess(eventId);
    } else {
      // Default behavior: refresh the page or navigate to the event
      router.refresh();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <EventCreationWizard
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
