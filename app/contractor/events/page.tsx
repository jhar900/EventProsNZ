'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  User,
  Building2,
  Tag,
  ArrowLeft,
  FileText,
} from 'lucide-react';

interface ContractorEvent {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  eventType: string;
  eventStatus: string;
  location: string | null;
  durationHours: number | null;
  attendeeCount: number | null;
  role: string | null;
  notes: string | null;
  managerName: string;
  managerCompany: string | null;
  assignedAt: string;
}

export default function ContractorEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ContractorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ContractorEvent | null>(
    null
  );

  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/contractor/events', {
          headers: { 'x-user-id': user!.id },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Failed to fetch contractor events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-NZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (hours: number | null) => {
    if (!hours) return null;
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  const getEventTypeLabel = (type: string) => {
    return type
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planning: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      planning: 'Planning',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  // Split events into upcoming and past
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(e => {
    if (!e.eventDate) return true; // TBD dates go to upcoming
    return new Date(e.eventDate) >= now;
  });
  const pastEvents = events.filter(e => {
    if (!e.eventDate) return false;
    return new Date(e.eventDate) < now;
  });

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['contractor']}>
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
            <p
              className={`mt-1 text-sm text-gray-500 transition-all duration-300 ${selectedEvent ? 'opacity-0 h-0 mt-0' : 'opacity-100'}`}
            >
              Events you have been assigned to as a contractor.
            </p>
          </div>

          <div className="flex">
            {/* Events List - Slides out when event selected */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                selectedEvent ? 'w-0 opacity-0' : 'w-full opacity-100'
              }`}
            >
              <div className="w-full">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
                      >
                        <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : events.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No events yet
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      When an event manager assigns you to an event, it will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {upcomingEvents.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                          Upcoming Events ({upcomingEvents.length})
                        </h2>
                        <div className="space-y-4">
                          {upcomingEvents.map(event => (
                            <EventCard
                              key={event.id}
                              event={event}
                              formatDate={formatDate}
                              formatDuration={formatDuration}
                              getEventTypeLabel={getEventTypeLabel}
                              getStatusBadge={getStatusBadge}
                              onClick={() => setSelectedEvent(event)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {pastEvents.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-500 mb-4">
                          Past Events ({pastEvents.length})
                        </h2>
                        <div className="space-y-4 opacity-75">
                          {pastEvents.map(event => (
                            <EventCard
                              key={event.id}
                              event={event}
                              formatDate={formatDate}
                              formatDuration={formatDuration}
                              getEventTypeLabel={getEventTypeLabel}
                              getStatusBadge={getStatusBadge}
                              onClick={() => setSelectedEvent(event)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Event Detail - Slides in when event selected */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                selectedEvent ? 'w-full opacity-100' : 'w-0 opacity-0'
              }`}
            >
              {selectedEvent && (
                <EventDetail
                  event={selectedEvent}
                  formatDate={formatDate}
                  formatDuration={formatDuration}
                  getEventTypeLabel={getEventTypeLabel}
                  getStatusBadge={getStatusBadge}
                  onBack={() => setSelectedEvent(null)}
                />
              )}
            </div>
          </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}

function EventCard({
  event,
  formatDate,
  formatDuration,
  getEventTypeLabel,
  getStatusBadge,
  onClick,
}: {
  event: ContractorEvent;
  formatDate: (d: string | null) => string;
  formatDuration: (h: number | null) => string | null;
  getEventTypeLabel: (t: string) => string;
  getStatusBadge: (s: string) => React.ReactNode;
  onClick?: () => void;
}) {
  const duration = formatDuration(event.durationHours);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {event.title}
            </h3>
            {getStatusBadge(event.eventStatus)}
          </div>

          {event.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatDate(event.eventDate)}</span>
            </div>

            {duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{duration}</span>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate max-w-[250px]">{event.location}</span>
              </div>
            )}

            {event.attendeeCount && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{event.attendeeCount} attendees</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-gray-400" />
              <span>{getEventTypeLabel(event.eventType)}</span>
            </div>
          </div>

          {/* Manager and role info */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <User className="h-4 w-4 text-gray-400" />
              <span>Managed by {event.managerName}</span>
            </div>

            {event.managerCompany && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{event.managerCompany}</span>
              </div>
            )}

            {event.role && (
              <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                <span>Role: {event.role}</span>
              </div>
            )}
          </div>

          {event.notes && (
            <p className="mt-2 text-sm text-gray-500 italic">
              Note: {event.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EventDetail({
  event,
  formatDate,
  formatDuration,
  getEventTypeLabel,
  getStatusBadge,
  onBack,
}: {
  event: ContractorEvent;
  formatDate: (d: string | null) => string;
  formatDuration: (h: number | null) => string | null;
  getEventTypeLabel: (t: string) => string;
  getStatusBadge: (s: string) => React.ReactNode;
  onBack: () => void;
}) {
  const duration = formatDuration(event.durationHours);

  return (
    <div className="w-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to events</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                {getStatusBadge(event.eventStatus)}
                <span className="text-sm text-gray-500">
                  <Tag className="h-3.5 w-3.5 inline mr-1" />
                  {getEventTypeLabel(event.eventType)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="p-6 space-y-6">
          {/* Date, time, location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Date
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {formatDate(event.eventDate)}
                </p>
              </div>
            </div>

            {duration && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Duration
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">{duration}</p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Location
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {event.location}
                  </p>
                </div>
              </div>
            )}

            {event.attendeeCount && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Attendees
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {event.attendeeCount}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Description
                  </p>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Your assignment */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Your Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.role && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-indigo-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Role
                    </p>
                    <p className="text-sm text-indigo-600 font-medium mt-0.5">
                      {event.role}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Assigned
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {formatDate(event.assignedAt)}
                  </p>
                </div>
              </div>
            </div>

            {event.notes && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {event.notes}
                </p>
              </div>
            )}
          </div>

          {/* Manager info */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Event Manager
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-900">
                  {event.managerName}
                </span>
              </div>
              {event.managerCompany && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {event.managerCompany}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
