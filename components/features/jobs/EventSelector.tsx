'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Link2, Loader2 } from 'lucide-react';

export interface EventData {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  end_date?: string;
  location: string;
  description?: string;
}

interface EventSelectorProps {
  userId: string;
  selectedEventId?: string;
  onSelect: (event: EventData | null) => void;
}

export function EventSelector({
  userId,
  selectedEventId,
  onSelect,
}: EventSelectorProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchEvents = useCallback(
    async (force = false) => {
      // Debounce: skip if fetched within last 5 seconds (unless forced)
      const now = Date.now();
      if (!force && now - lastFetchTimeRef.current < 5000) {
        return;
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        // Fetch user's events (API doesn't support comma-separated status, so filter client-side)
        const response = await fetch(`/api/events?userId=${userId}`, {
          headers: {
            'x-user-id': userId,
          },
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const result = await response.json();

        // Filter to only planning and confirmed events (exclude drafts, cancelled, etc.)
        const filteredEvents = (result.events || []).filter(
          (event: EventData & { status?: string }) =>
            event.status === 'planning' || event.status === 'confirmed'
        );
        setEvents(filteredEvents);
        lastFetchTimeRef.current = Date.now();
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error fetching events:', error);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (userId) {
      fetchEvents(true); // Force fetch on mount
    }
    return () => {
      // Cleanup: abort any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, fetchEvents]);

  const handleSelectChange = (value: string) => {
    if (value === 'none') {
      onSelect(null);
    } else {
      const selectedEvent = events.find(e => e.id === value);
      if (selectedEvent) {
        onSelect(selectedEvent);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Empty state - user has no events (only show if no error)
  if (!loading && !error && events.length === 0) {
    return (
      <Card className="border-dashed border-gray-300 bg-gray-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Link2 className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-500">Link to an Event</h4>
              <p className="text-sm text-gray-400 mt-1">
                Create an event first to link this job posting and show
                applicants event details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Link2 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">Link to an Event</h4>
            <p className="text-sm text-blue-700 mt-1 mb-3">
              Link this job to an event to show applicants event details and
              auto-fill job information.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading events...</span>
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <Select
                value={selectedEventId || 'none'}
                onValueChange={handleSelectChange}
                onOpenChange={open => {
                  // Re-fetch events when dropdown opens to get fresh data
                  if (open) {
                    fetchEvents();
                  }
                }}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select an event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-500">No event linked</span>
                  </SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{event.title}</span>
                        <span className="text-gray-400 text-sm">
                          ({formatDate(event.event_date)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
