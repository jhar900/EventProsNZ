import { useState, useEffect } from 'react';
import {
  Event,
  EventTemplate,
  EventDraft,
  CreateEventRequest,
  EventCreationResponse,
  EventTemplateResponse,
  EventDraftResponse,
} from '@/types/events';

interface UseEventCreationOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
}

interface UseEventCreationReturn {
  // State
  isLoading: boolean;
  error: string | null;
  success: string | null;

  // Templates
  templates: EventTemplate[];
  loadTemplates: (eventType?: string) => Promise<void>;

  // Drafts
  draft: EventDraft | null;
  loadDraft: () => Promise<void>;
  saveDraft: (
    eventData: Partial<CreateEventRequest>,
    stepNumber: number
  ) => Promise<boolean>;
  deleteDraft: () => Promise<boolean>;

  // Event Creation
  createEvent: (
    eventData: CreateEventRequest
  ) => Promise<EventCreationResponse | null>;

  // Utilities
  clearError: () => void;
  clearSuccess: () => void;
}

export function useEventCreation({
  autoSave = true,
  autoSaveInterval = 30000,
}: UseEventCreationOptions = {}): UseEventCreationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [draft, setDraft] = useState<EventDraft | null>(null);

  // Load templates
  const loadTemplates = async (eventType?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (eventType) params.append('eventType', eventType);

      const response = await fetch(`/api/events/templates?${params}`);
      const data: EventTemplateResponse = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        setError('Failed to load templates');
      }
    } catch (err) {
      setError('Failed to load templates');
      } finally {
      setIsLoading(false);
    }
  };

  // Load draft
  const loadDraft = async () => {
    try {
      const response = await fetch('/api/events/drafts');
      const data: EventDraftResponse = await response.json();

      if (data.success && data.draft) {
        setDraft(data.draft);
      }
    } catch (err) {
      }
  };

  // Save draft
  const saveDraft = async (
    eventData: Partial<CreateEventRequest>,
    stepNumber: number
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/events/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventData,
          stepNumber,
        }),
      });

      const data: EventDraftResponse = await response.json();

      if (data.success) {
        setDraft(data.draft);
        return true;
      } else {
        setError('Failed to save draft');
        return false;
      }
    } catch (err) {
      setError('Failed to save draft');
      return false;
    }
  };

  // Delete draft
  const deleteDraft = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/events/drafts', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDraft(null);
        return true;
      } else {
        setError('Failed to delete draft');
        return false;
      }
    } catch (err) {
      setError('Failed to delete draft');
      return false;
    }
  };

  // Create event
  const createEvent = async (
    eventData: CreateEventRequest
  ): Promise<EventCreationResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data: EventCreationResponse = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Event created successfully');
        // Clear draft after successful creation
        if (draft) {
          await deleteDraft();
        }
        return data;
      } else {
        setError(data.message || 'Failed to create event');
        return null;
      }
    } catch (err) {
      setError('Failed to create event');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Clear success
  const clearSuccess = () => {
    setSuccess(null);
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !draft) return;

    const interval = setInterval(() => {
      if (draft.event_data) {
        saveDraft(draft.event_data, draft.step_number);
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, draft]);

  // Load initial draft
  useEffect(() => {
    loadDraft();
  }, []);

  return {
    // State
    isLoading,
    error,
    success,

    // Templates
    templates,
    loadTemplates,

    // Drafts
    draft,
    loadDraft,
    saveDraft,
    deleteDraft,

    // Event Creation
    createEvent,

    // Utilities
    clearError,
    clearSuccess,
  };
}
