'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Event {
  id: string;
  title: string;
  event_date: string | null;
  event_type: string | null;
  status: string;
}

interface AddToEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractorId: string;
  contractorName: string;
}

export function AddToEventsModal({
  isOpen,
  onClose,
  contractorId,
  contractorName,
}: AddToEventsModalProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [initialEventIds, setInitialEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contractorId) {
      fetchEventsAndLinks();
    }
  }, [isOpen, contractorId]);

  const fetchEventsAndLinks = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {};
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/contractors/${contractorId}/events`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch events');
      }

      setEvents(data.events || []);
      setSelectedEventIds(data.linkedEventIds || []);
      setInitialEventIds(data.linkedEventIds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEvent = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/contractors/${contractorId}/events`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ eventIds: selectedEventIds }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update events');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify([...selectedEventIds].sort()) !==
    JSON.stringify([...initialEventIds].sort());

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add to Events</DialogTitle>
          <p className="text-sm text-gray-500">
            Select events to link {contractorName} to
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            </div>
          ) : error ? (
            <div className="flex items-center text-red-600 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No events available</p>
              <p className="text-sm mt-1">
                Create an event first, then you can link contractors to it.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(event => (
                <label
                  key={event.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedEventIds.includes(event.id)}
                    onCheckedChange={() => handleToggleEvent(event.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {event.title}
                      </span>
                      <Badge
                        className={`text-xs ${getStatusColor(event.status)}`}
                      >
                        {event.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(event.event_date)}
                      {event.event_type && (
                        <span className="ml-2 text-gray-400">
                          {event.event_type}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
