'use client';

import { useState, useCallback } from 'react';
import {
  Event,
  EventVersion,
  EventMilestone,
  EventNotification,
  EventFeedback,
} from '@/types/events';

interface EventManagementStore {
  events: Event[];
  currentEvent: Event | null;
  versions: EventVersion[];
  milestones: EventMilestone[];
  notifications: EventNotification[];
  feedback: EventFeedback[];
  dashboard: any;
  isLoading: boolean;
  error: string | null;
}

interface EventFilters {
  status?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface MilestoneData {
  milestone_name: string;
  milestone_date: string;
  description?: string;
}

interface MilestoneUpdate {
  status?: string;
  description?: string;
}

interface FeedbackData {
  contractor_id: string;
  rating: number;
  feedback?: string;
}

interface DuplicationData {
  new_title: string;
  new_date: string;
  changes?: any;
}

export function useEventManagement() {
  const [state, setState] = useState<EventManagementStore>({
    events: [],
    currentEvent: null,
    versions: [],
    milestones: [],
    notifications: [],
    feedback: [],
    dashboard: null,
    isLoading: false,
    error: null,
  });

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Load events with filtering
  const loadEvents = useCallback(async (filters?: EventFilters) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.eventType)
        queryParams.append('eventType', filters.eventType);
      if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/events?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, events: data.events }));
      } else {
        setError(data.message || 'Failed to load events');
      }
    } catch (error) {
      setError('Failed to load events');
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load specific event
  const loadEvent = useCallback(async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, currentEvent: data.event }));
      } else {
        setError(data.message || 'Failed to load event');
      }
    } catch (error) {
      setError('Failed to load event');
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update event status
  const updateEventStatus = useCallback(
    async (eventId: string, status: string, reason?: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, reason }),
        });

        const data = await response.json();

        if (data.success) {
          setState(prev => ({
            ...prev,
            currentEvent: data.event,
            events: prev.events.map(event =>
              event.id === eventId ? data.event : event
            ),
          }));
        } else {
          setError(data.message || 'Failed to update event status');
        }
      } catch (error) {
        setError('Failed to update event status');
        console.error('Error updating event status:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create version
  const createVersion = useCallback(
    async (eventId: string, changes: any, reason?: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ changes, reason }),
        });

        const data = await response.json();

        if (data.success) {
          setState(prev => ({
            ...prev,
            versions: [data.version, ...prev.versions],
          }));
        } else {
          setError(data.message || 'Failed to create version');
        }
      } catch (error) {
        setError('Failed to create version');
        console.error('Error creating version:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create milestone
  const createMilestone = useCallback(
    async (eventId: string, milestone: MilestoneData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}/milestones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(milestone),
        });

        const data = await response.json();

        if (data.success) {
          setState(prev => ({
            ...prev,
            milestones: [...prev.milestones, data.milestone],
          }));
        } else {
          setError(data.message || 'Failed to create milestone');
        }
      } catch (error) {
        setError('Failed to create milestone');
        console.error('Error creating milestone:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update milestone
  const updateMilestone = useCallback(
    async (milestoneId: string, updates: MilestoneUpdate) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/events/${state.currentEvent?.id}/milestones/${milestoneId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          }
        );

        const data = await response.json();

        if (data.success) {
          setState(prev => ({
            ...prev,
            milestones: prev.milestones.map(milestone =>
              milestone.id === milestoneId ? data.milestone : milestone
            ),
          }));
        } else {
          setError(data.message || 'Failed to update milestone');
        }
      } catch (error) {
        setError('Failed to update milestone');
        console.error('Error updating milestone:', error);
      } finally {
        setLoading(false);
      }
    },
    [state.currentEvent?.id]
  );

  // Complete event
  const completeEvent = useCallback(
    async (eventId: string, completionData: any, feedback?: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}/completion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ completion_data: completionData, feedback }),
        });

        const data = await response.json();

        if (data.success) {
          setState(prev => ({
            ...prev,
            currentEvent: data.event,
            events: prev.events.map(event =>
              event.id === eventId ? data.event : event
            ),
          }));
        } else {
          setError(data.message || 'Failed to complete event');
        }
      } catch (error) {
        setError('Failed to complete event');
        console.error('Error completing event:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Submit feedback
  const submitFeedback = useCallback(
    async (eventId: string, feedback: FeedbackData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedback),
        });

        const data = await response.json();

        if (data.success) {
          setState(prev => ({
            ...prev,
            feedback: [...prev.feedback, data.feedback],
          }));
        } else {
          setError(data.message || 'Failed to submit feedback');
        }
      } catch (error) {
        setError('Failed to submit feedback');
        console.error('Error submitting feedback:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Duplicate event
  const duplicateEvent = useCallback(
    async (eventId: string, duplicationData: DuplicationData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/events/${eventId}/duplicate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(duplicationData),
        });

        const data = await response.json();

        if (data.success) {
          setState(prev => ({
            ...prev,
            events: [data.duplicated_event, ...prev.events],
          }));
        } else {
          setError(data.message || 'Failed to duplicate event');
        }
      } catch (error) {
        setError('Failed to duplicate event');
        console.error('Error duplicating event:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load dashboard
  const loadDashboard = useCallback(
    async (userId: string, period: string = 'month') => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/events/dashboard?userId=${userId}&period=${period}`
        );
        const data = await response.json();

        if (data.success) {
          setState(prev => ({ ...prev, dashboard: data.dashboard }));
        } else {
          setError(data.message || 'Failed to load dashboard');
        }
      } catch (error) {
        setError('Failed to load dashboard');
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    // State
    events: state.events,
    currentEvent: state.currentEvent,
    versions: state.versions,
    milestones: state.milestones,
    notifications: state.notifications,
    feedback: state.feedback,
    dashboard: state.dashboard,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadEvents,
    loadEvent,
    updateEventStatus,
    createVersion,
    createMilestone,
    updateMilestone,
    completeEvent,
    submitFeedback,
    duplicateEvent,
    loadDashboard,
  };
}
