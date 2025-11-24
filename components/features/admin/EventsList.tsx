'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  event_manager_id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_total: number | null;
  event_type: string | null;
  duration_hours: number | null;
  attendee_count: number | null;
  status:
    | 'draft'
    | 'planning'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled';
  created_at: string;
  updated_at: string;
  event_manager: {
    email: string;
    created_at: string;
    profile: {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
    business_profile: {
      company_name: string | null;
    } | null;
  } | null;
}

interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, [page, statusFilter, eventTypeFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (eventTypeFilter) {
        params.append('eventType', eventTypeFilter);
      }

      const response = await fetch(`/api/admin/events?${params.toString()}`);

      if (response.ok) {
        const data: EventsResponse = await response.json();
        setEvents(data.events);
        setTotal(data.total);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load events');
      }
    } catch (err) {
      setError('An error occurred while loading events');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    const statusConfig = {
      draft: {
        className: 'bg-gray-100 text-gray-800',
        label: 'Draft',
      },
      planning: {
        className: 'bg-blue-100 text-blue-800',
        label: 'Planning',
      },
      confirmed: {
        className: 'bg-green-100 text-green-800',
        label: 'Confirmed',
      },
      in_progress: {
        className: 'bg-yellow-100 text-yellow-800',
        label: 'In Progress',
      },
      completed: {
        className: 'bg-purple-100 text-purple-800',
        label: 'Completed',
      },
      cancelled: {
        className: 'bg-red-100 text-red-800',
        label: 'Cancelled',
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-red-600">{error}</div>
          <Button onClick={loadEvents} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="event-type-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Event Type
            </label>
            <input
              id="event-type-filter"
              type="text"
              value={eventTypeFilter}
              onChange={e => {
                setEventTypeFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by event type..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <Button
              onClick={() => {
                setStatusFilter('');
                setEventTypeFilter('');
                setPage(1);
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Events ({total})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {events.map(event => (
            <div key={event.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {event.title}
                    </h3>
                    {getStatusBadge(event.status)}
                  </div>
                  {/* Event Manager Info */}
                  {event.event_manager && (
                    <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-200">
                      {event.event_manager.profile?.avatar_url ? (
                        <img
                          src={event.event_manager.profile.avatar_url}
                          alt={
                            event.event_manager.profile.first_name &&
                            event.event_manager.profile.last_name
                              ? `${event.event_manager.profile.first_name} ${event.event_manager.profile.last_name}`
                              : 'Event Manager'
                          }
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white font-semibold text-sm">
                          {event.event_manager.profile?.first_name?.[0] ||
                            event.event_manager.email[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {event.event_manager.profile?.first_name &&
                          event.event_manager.profile?.last_name
                            ? `${event.event_manager.profile.first_name} ${event.event_manager.profile.last_name}`
                            : event.event_manager.email}
                        </div>
                        {event.event_manager.business_profile?.company_name && (
                          <div className="text-sm text-gray-600">
                            {event.event_manager.business_profile.company_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {event.event_manager.email}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Event Date: </span>
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Event Type: </span>
                      <span>{event.event_type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Location: </span>
                      <span>{event.location || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Attendees: </span>
                      <span>{event.attendee_count || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Duration: </span>
                      <span>
                        {event.duration_hours
                          ? `${event.duration_hours} hours`
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Budget: </span>
                      <span>
                        {event.budget_total
                          ? formatCurrency(event.budget_total)
                          : event.budget_min && event.budget_max
                            ? `${formatCurrency(event.budget_min)} - ${formatCurrency(event.budget_max)}`
                            : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {event.description && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p className="font-medium mb-1">Description:</p>
                      <p className="line-clamp-2">{event.description}</p>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Created: {formatDate(event.created_at)}
                    {event.updated_at !== event.created_at && (
                      <span className="ml-4">
                        Updated: {formatDate(event.updated_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(page - 1) * limit + 1} to{' '}
              {Math.min(page * limit, total)} of {total} events
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {events.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 text-center">
            <p className="text-gray-500">No events found.</p>
          </div>
        </div>
      )}
    </div>
  );
}
