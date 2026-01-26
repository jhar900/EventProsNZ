'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EventCreationWizard } from './EventCreationWizard';
import { useEventCreationStore } from '@/stores/event-creation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface EditEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  onSuccess?: (eventId: string) => void;
}

export function EditEventModal({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: EditEventModalProps) {
  const { user } = useAuth();
  const { loadEventData, resetWizard } = useEventCreationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load event data when modal opens
  useEffect(() => {
    if (open && eventId && user?.id) {
      setIsLoading(true);
      setError(null);
      loadEventData(eventId, user.id)
        .then(() => {
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error loading event data:', err);
          setError(err.message || 'Failed to load event data');
          setIsLoading(false);
        });
    } else if (!open) {
      // Reset wizard when modal closes
      resetWizard();
      setError(null);
    }
  }, [open, eventId, user?.id, loadEventData, resetWizard]);

  const handleComplete = (updatedEventId: string) => {
    // Close the modal
    onOpenChange(false);

    // Call the onSuccess callback if provided
    if (onSuccess) {
      onSuccess(updatedEventId);
    }
  };

  const handleCancel = () => {
    // When canceling, check if we should reload the event (e.g., after saving draft)
    // This ensures the overview tab shows updated data
    if (eventId && onSuccess) {
      // Small delay to ensure draft save is complete
      setTimeout(() => {
        onSuccess(eventId);
      }, 100);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading event data...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Close
            </button>
          </div>
        ) : (
          <EventCreationWizard
            eventId={eventId || undefined}
            isEditMode={true}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
