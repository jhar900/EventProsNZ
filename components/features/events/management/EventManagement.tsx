'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChangeNotifications } from './ChangeNotifications';
import { EventDuplication } from './EventDuplication';
import { EventDashboard } from './EventDashboard';
import { ProgressTracking } from './ProgressTracking';
import { EventCompletion } from './EventCompletion';
import { ContractorCommunication } from './ContractorCommunication';
import { EventAnalytics } from './EventAnalytics';
import { MilestoneTracker } from './MilestoneTracker';
import { EventDocuments } from './EventDocuments';
import { FeedbackCollection } from './FeedbackCollection';
import { NotificationCenter } from './NotificationCenter';
import { EventTimeline } from './EventTimeline';
import { EventTasks } from './EventTasks';
import { CreateEventModal } from '../CreateEventModal';
import { EditEventModal } from '../EditEventModal';
import { AddEventTeamMembersModal } from '../AddEventTeamMembersModal';
import { useEventManagement } from '@/hooks/useEventManagement';
import { useAuth } from '@/hooks/useAuth';
import { Event, EVENT_STATUS } from '@/types/events';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EventManagementProps {
  eventId?: string;
  initialTab?: string;
}

interface EventTeamMember {
  id: string;
  eventId: string;
  teamMemberId: string | null;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  avatarUrl: string | null;
  isCreator?: boolean;
}

export function EventManagement({
  eventId,
  initialTab = 'overview',
}: EventManagementProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [eventJustEdited, setEventJustEdited] = useState<string | null>(null);
  const [showAddTeamMembersModal, setShowAddTeamMembersModal] = useState(false);
  const [eventTeamMembers, setEventTeamMembers] = useState<EventTeamMember[]>(
    []
  );
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [eventContractors, setEventContractors] = useState<any[]>([]);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [showDraftTooltip, setShowDraftTooltip] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRemoveTeamMemberModal, setShowRemoveTeamMemberModal] =
    useState(false);
  const [teamMemberToRemove, setTeamMemberToRemove] = useState<string | null>(
    null
  );
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  const {
    events,
    currentEvent,
    isLoading,
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
  } = useEventManagement();

  useEffect(() => {
    if (eventId) {
      console.log('Initial load: Loading event with eventId:', eventId);
      loadEvent(eventId);
    } else {
      loadEvents();
    }
  }, [eventId, loadEvent, loadEvents]);

  useEffect(() => {
    // Always prioritize currentEvent (from loadEvent) as it includes full relations like event_dates
    if (currentEvent) {
      // Always update selectedEvent from currentEvent to ensure event_dates are included
      // This ensures that after a hard refresh, we get the full event data with event_dates
      const eventDates = (currentEvent as any).event_dates;
      console.log('Setting selectedEvent from currentEvent:', {
        eventId: currentEvent.id,
        hasEventDates: !!eventDates,
        eventDates: eventDates,
        eventDatesType: typeof eventDates,
        eventDatesIsArray: Array.isArray(eventDates),
        eventDatesLength: Array.isArray(eventDates)
          ? eventDates.length
          : 'not an array',
        allKeys: Object.keys(currentEvent),
      });

      // Explicitly preserve event_dates when setting selectedEvent
      // Ensure event_dates is always an array
      const eventWithDates = {
        ...currentEvent,
        event_dates: Array.isArray(eventDates) ? eventDates : [],
      };

      // Only update if the event ID matches or if selectedEvent doesn't exist or doesn't have event_dates
      const shouldUpdate =
        !selectedEvent ||
        selectedEvent.id !== currentEvent.id ||
        !Array.isArray((selectedEvent as any).event_dates) ||
        (selectedEvent as any).event_dates.length !==
          eventWithDates.event_dates.length;

      if (shouldUpdate) {
        console.log(
          'Updating selectedEvent with event_dates:',
          eventWithDates.event_dates
        );
        setSelectedEvent(eventWithDates as any);
        console.log(
          'selectedEvent updated, event_dates count:',
          eventWithDates.event_dates.length
        );
      } else {
        console.log(
          'Skipping update - selectedEvent already has correct event_dates'
        );
      }
    } else if (eventId && !currentEvent) {
      // If we have eventId but currentEvent is not set, always load the full event with event_dates
      // This handles the case where the page loads with an eventId but currentEvent hasn't been set yet
      console.log(
        'No currentEvent but have eventId, loading full event to get event_dates:',
        eventId
      );
      loadEvent(eventId);
    }

    // Separate check: if we have events list but no currentEvent and eventId matches
    if (eventId && events.length > 0 && !currentEvent) {
      // Fallback: If we have eventId and events list but no currentEvent, load the full event
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        // Always load the full event to get event_dates (events list doesn't have them)
        console.log(
          'Loading full event for eventId to get event_dates:',
          eventId
        );
        loadEvent(eventId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent, eventId, events, loadEvent]);

  // Reload event when modal closes after edit
  useEffect(() => {
    if (
      eventJustEdited &&
      !showEditEventModal &&
      eventJustEdited !== currentEvent?.id
    ) {
      console.log(
        'Event was just edited, reloading with event_dates:',
        eventJustEdited
      );
      loadEvent(eventJustEdited);
      setEventJustEdited(null);
    }
  }, [eventJustEdited, showEditEventModal, loadEvent, currentEvent?.id]);

  // Load event team members and contractors when tab is active and event is selected
  useEffect(() => {
    if (
      selectedEvent &&
      activeTab === 'contractors' &&
      selectedEvent.status !== 'draft'
    ) {
      loadEventTeamMembers();
      loadEventContractors();
    }
  }, [selectedEvent?.id, activeTab, selectedEvent?.status]);

  // Reset to overview tab if event is in draft status and user tries to access other tabs
  useEffect(() => {
    if (selectedEvent?.status === 'draft' && activeTab !== 'overview') {
      setActiveTab('overview');
    }
  }, [selectedEvent?.status, activeTab]);

  const loadEventTeamMembers = async () => {
    if (!selectedEvent?.id || !user?.id) return;

    setIsLoadingTeamMembers(true);
    try {
      const headers: HeadersInit = {};
      if (user.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/events/${selectedEvent.id}/team-members`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load event team members');
      }

      setEventTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error('Error loading event team members:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load event team members';
      toast.error(errorMessage);
    } finally {
      setIsLoadingTeamMembers(false);
    }
  };

  const loadEventContractors = async () => {
    if (!selectedEvent?.id || !user?.id) return;

    setIsLoadingContractors(true);
    try {
      const headers: HeadersInit = {};
      if (user.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/events/${selectedEvent.id}/contractors`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        setEventContractors(data.contractors || []);
      } else {
        setEventContractors([]);
      }
    } catch (error) {
      console.error('Error loading event contractors:', error);
      setEventContractors([]);
    } finally {
      setIsLoadingContractors(false);
    }
  };

  const handleRemoveTeamMember = async (eventTeamMemberId: string) => {
    // Don't allow removing the event creator
    const member = eventTeamMembers.find(m => m.id === eventTeamMemberId);
    if (member?.isCreator) {
      return;
    }

    if (!selectedEvent?.id || !user?.id) return;

    // Check if team member has tasks assigned
    setIsLoadingTasks(true);
    try {
      const headers: HeadersInit = {};
      if (user.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/events/${selectedEvent.id}/team-members/${eventTeamMemberId}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok && data.tasks && data.tasks.length > 0) {
        // Team member has tasks, show warning modal
        setAssignedTasks(data.tasks);
        setTeamMemberToRemove(eventTeamMemberId);
        setShowRemoveTeamMemberModal(true);
      } else {
        // No tasks, proceed with normal confirmation
        if (
          !confirm(
            'Are you sure you want to remove this team member from the event?'
          )
        ) {
          return;
        }
        await performRemoveTeamMember(eventTeamMemberId);
      }
    } catch (error) {
      console.error('Error checking team member tasks:', error);
      // If check fails, proceed with normal confirmation
      if (
        !confirm(
          'Are you sure you want to remove this team member from the event?'
        )
      ) {
        return;
      }
      await performRemoveTeamMember(eventTeamMemberId);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const performRemoveTeamMember = async (eventTeamMemberId: string) => {
    if (!selectedEvent?.id || !user?.id) return;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(
        `/api/events/${selectedEvent.id}/team-members/${eventTeamMemberId}`,
        {
          method: 'DELETE',
          headers,
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to remove team member from event'
        );
      }

      toast.success('Team member removed from event successfully');
      loadEventTeamMembers();
      setShowRemoveTeamMemberModal(false);
      setTeamMemberToRemove(null);
      setAssignedTasks([]);
    } catch (error) {
      console.error('Error removing team member from event:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to remove team member from event';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
      accepted:
        'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
      onboarding:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      invited: 'border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200',
      declined:
        'bg-destructive text-destructive-foreground hover:bg-destructive/80',
      inactive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    };

    const labels: Record<string, string> = {
      active: 'Active',
      accepted: 'Accepted',
      onboarding: 'Onboarding',
      invited: 'Invited',
      declined: 'Declined',
      inactive: 'Declined',
    };

    const displayStatus = status === 'inactive' ? 'declined' : status;

    return (
      <Badge className={variants[displayStatus] || 'outline'}>
        {labels[displayStatus] || status}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getAllStatuses = (): string[] => {
    // Return all possible statuses as shown in the tooltip
    return [
      'draft',
      'planning',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
    ];
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedEvent?.id || !user?.id || newStatus === selectedEvent.status) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const headers: HeadersInit = {};
      if (user.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/events/${selectedEvent.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Update the selected event with new status
      setSelectedEvent({
        ...selectedEvent,
        status: newStatus,
      });

      // Reload events list to reflect the change
      loadEvents();

      toast.success('Event status updated successfully');
    } catch (error) {
      console.error('Error updating event status:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update event status';

      toast.error(errorMessage);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Selection - Only show when no event is selected */}
      {!selectedEvent && (
        <Card>
          <CardHeader className={selectedEvent ? 'pb-3' : ''}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={selectedEvent ? 'text-lg' : ''}>
                  Select an Event
                </CardTitle>
                {!selectedEvent && (
                  <CardDescription>
                    Choose an event to manage or view its details
                  </CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateEventModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`grid gap-4 ${
                selectedEvent
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'md:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {events.map(event => (
                <Card
                  key={event.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''
                  } ${selectedEvent ? 'p-2' : ''}`}
                  onClick={() => {
                    // Load the full event to get event_dates instead of using the list event
                    loadEvent(event.id);
                  }}
                >
                  <CardContent className={selectedEvent ? 'p-3' : 'p-4'}>
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex-1 ${selectedEvent ? 'space-y-1' : 'space-y-2'}`}
                      >
                        <div className="flex items-center gap-2">
                          <h3
                            className={
                              selectedEvent
                                ? 'font-medium text-sm line-clamp-1'
                                : 'font-semibold'
                            }
                          >
                            {event.title}
                          </h3>
                          {event.status === 'draft' && (
                            <Badge
                              variant="outline"
                              className={
                                selectedEvent ? 'text-xs px-1 py-0' : 'text-xs'
                              }
                            >
                              Draft
                            </Badge>
                          )}
                        </div>
                        <p
                          className={
                            selectedEvent
                              ? 'text-xs text-muted-foreground'
                              : 'text-sm text-muted-foreground'
                          }
                        >
                          {event.event_date
                            ? new Date(event.event_date).toLocaleDateString()
                            : 'Date not set'}
                        </p>
                        <Badge
                          className={`${getStatusColor(event.status)} ${
                            selectedEvent ? 'text-xs' : ''
                          }`}
                        >
                          {getStatusIcon(event.status)}
                          <span className="ml-1 capitalize">
                            {event.status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </div>
                      {!selectedEvent && (
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {!selectedEvent && (
                      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />$
                          {event.budget_total?.toLocaleString() || '0'}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {event.attendee_count || 'N/A'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedEvent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEvent(null)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-4">
            {selectedEvent && (selectedEvent as any).logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={(selectedEvent as any).logo_url}
                  alt={`${selectedEvent.title} logo`}
                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedEvent ? selectedEvent.title : 'Event Management'}
              </h1>
              <p className="text-muted-foreground">
                {selectedEvent
                  ? 'Manage your event details and progress'
                  : 'Manage your events throughout their lifecycle'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard - Show when no event is selected */}
      {!selectedEvent && (
        <div className="mt-6">
          <EventDashboard />
        </div>
      )}

      {/* Event Management Tabs */}
      {selectedEvent && (
        <Tabs
          value={activeTab}
          onValueChange={value => {
            // Prevent switching to other tabs if event is in draft status
            if (selectedEvent.status === 'draft' && value !== 'overview') {
              // Prevent duplicate notifications (within 1 second)
              const now = Date.now();
              if (now - lastNotificationTime > 1000) {
                toast.info(
                  'Please complete all event details and move the event to planning stage to access this tab'
                );
                setLastNotificationTime(now);
              }
              return;
            }
            setActiveTab(value);
          }}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1 mb-4">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="contractors"
              className={`text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap ${
                selectedEvent.status === 'draft'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              Roles
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className={`text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap ${
                selectedEvent.status === 'draft'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className={`text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap ${
                selectedEvent.status === 'draft'
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Event Information Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Event Information</CardTitle>
                    <CardDescription>
                      Overview of the selected event details
                    </CardDescription>
                  </div>
                  {selectedEvent && user?.id === selectedEvent.user_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditEventModal(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Title */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      Title
                    </div>
                    <div className="text-base font-semibold">
                      {selectedEvent.title}
                    </div>
                  </div>

                  {/* Event Type */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      Event Type
                    </div>
                    <div className="text-base capitalize">
                      {selectedEvent.event_type || 'N/A'}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      Status
                      <Popover
                        open={showStatusTooltip}
                        onOpenChange={setShowStatusTooltip}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full hover:bg-gray-100 p-0.5 focus:outline-none transition-colors"
                            onMouseEnter={() => setShowStatusTooltip(true)}
                            onMouseLeave={() => setShowStatusTooltip(false)}
                            onBlur={() => setShowStatusTooltip(false)}
                          >
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80 p-4"
                          side="right"
                          align="start"
                          onMouseEnter={() => setShowStatusTooltip(true)}
                          onMouseLeave={() => setShowStatusTooltip(false)}
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-sm mb-3">
                                Status Transition Flow
                              </h4>
                            </div>
                            <div className="flex items-start justify-evenly w-full">
                              {[
                                {
                                  status: 'draft',
                                  icon: <AlertCircle className="h-4 w-4" />,
                                  color: 'text-gray-500',
                                },
                                {
                                  status: 'planning',
                                  icon: <Clock className="h-4 w-4" />,
                                  color: 'text-blue-500',
                                },
                                {
                                  status: 'confirmed',
                                  icon: <CheckCircle className="h-4 w-4" />,
                                  color: 'text-green-500',
                                },
                                {
                                  status: 'in_progress',
                                  icon: <Clock className="h-4 w-4" />,
                                  color: 'text-yellow-500',
                                },
                                {
                                  status: 'completed',
                                  icon: <CheckCircle className="h-4 w-4" />,
                                  color: 'text-green-500',
                                },
                              ].map((step, index, array) => (
                                <React.Fragment key={step.status}>
                                  <div className="flex flex-col items-center space-y-1.5 flex-1 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.color}`}
                                    >
                                      {step.icon}
                                    </div>
                                    <span className="text-[10px] font-medium capitalize text-center whitespace-nowrap">
                                      {step.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                  {index < array.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0 mt-3.5" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {user?.id === selectedEvent.user_id &&
                    selectedEvent.status !== 'draft' ? (
                      <Select
                        value={selectedEvent.status || 'draft'}
                        onValueChange={handleStatusUpdate}
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue>
                            <Badge
                              className={getStatusColor(selectedEvent.status)}
                            >
                              {getStatusIcon(selectedEvent.status)}
                              <span className="ml-1 capitalize">
                                {selectedEvent.status?.replace('_', ' ') ||
                                  'N/A'}
                              </span>
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {getAllStatuses().map(status => (
                            <SelectItem key={status} value={status}>
                              <Badge className={getStatusColor(status)}>
                                {getStatusIcon(status)}
                                <span className="ml-1 capitalize">
                                  {status.replace('_', ' ')}
                                </span>
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-1">
                        {selectedEvent.status === 'draft' ? (
                          <Popover
                            open={showDraftTooltip}
                            onOpenChange={setShowDraftTooltip}
                          >
                            <PopoverTrigger asChild>
                              <div
                                onMouseEnter={() => setShowDraftTooltip(true)}
                                onMouseLeave={() => setShowDraftTooltip(false)}
                                className="inline-block"
                              >
                                <Badge
                                  className={getStatusColor(
                                    selectedEvent.status
                                  )}
                                >
                                  {getStatusIcon(selectedEvent.status)}
                                  <span className="ml-1 capitalize">
                                    {selectedEvent.status.replace('_', ' ')}
                                  </span>
                                </Badge>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-80 p-3"
                              side="bottom"
                              align="start"
                              onMouseEnter={() => setShowDraftTooltip(true)}
                              onMouseLeave={() => setShowDraftTooltip(false)}
                            >
                              <p className="text-sm text-muted-foreground">
                                To progress this event to the planning stage and
                                have more functionality in your event dashboard,
                                complete the event creation process
                              </p>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Badge
                            className={getStatusColor(selectedEvent.status)}
                          >
                            {getStatusIcon(selectedEvent.status)}
                            <span className="ml-1 capitalize">
                              {selectedEvent.status.replace('_', ' ')}
                            </span>
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Event Date */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Event Dates
                    </div>
                    <div className="text-base space-y-2">
                      {selectedEvent.event_date ? (
                        <>
                          {/* Collect all dates including main event date */}
                          {(() => {
                            const allDates: Array<{
                              date: Date;
                              startTime: Date | null;
                              endTime: Date | null;
                            }> = [];

                            // Add main event date
                            const mainEventDate = new Date(
                              selectedEvent.event_date
                            );
                            const mainEndDate = (selectedEvent as any).end_date
                              ? new Date((selectedEvent as any).end_date)
                              : null;

                            allDates.push({
                              date: mainEventDate,
                              startTime: mainEventDate,
                              endTime: mainEndDate,
                            });

                            // Add additional dates from event_dates table
                            const eventDates = (selectedEvent as any)
                              .event_dates;
                            console.log(
                              'Event dates from selectedEvent:',
                              eventDates
                            );
                            console.log('Full selectedEvent structure:', {
                              id: selectedEvent.id,
                              title: selectedEvent.title,
                              event_date: selectedEvent.event_date,
                              end_date: (selectedEvent as any).end_date,
                              event_dates: (selectedEvent as any).event_dates,
                              event_datesType: typeof (selectedEvent as any)
                                .event_dates,
                              event_datesIsArray: Array.isArray(
                                (selectedEvent as any).event_dates
                              ),
                              event_datesLength: Array.isArray(
                                (selectedEvent as any).event_dates
                              )
                                ? (selectedEvent as any).event_dates.length
                                : 'not an array',
                              allKeys: Object.keys(selectedEvent),
                            });

                            // Ensure eventDates is an array
                            const eventDatesArray = Array.isArray(eventDates)
                              ? eventDates
                              : [];
                            console.log(
                              'Processing eventDatesArray:',
                              eventDatesArray
                            );

                            if (eventDatesArray.length > 0) {
                              eventDatesArray.forEach((ed: any) => {
                                try {
                                  const dateStr = ed.date; // YYYY-MM-DD
                                  const startTimeStr = ed.start_time; // HH:MM:SS
                                  const endTimeStr = ed.end_time; // HH:MM:SS

                                  console.log('Processing event date:', {
                                    dateStr,
                                    startTimeStr,
                                    endTimeStr,
                                  });

                                  if (!dateStr) {
                                    console.warn(
                                      'Event date missing date string:',
                                      ed
                                    );
                                    return;
                                  }

                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime())) {
                                    console.warn('Invalid date:', dateStr);
                                    return;
                                  }

                                  const startTime = startTimeStr
                                    ? new Date(`${dateStr}T${startTimeStr}`)
                                    : null;
                                  const endTime = endTimeStr
                                    ? new Date(`${dateStr}T${endTimeStr}`)
                                    : null;

                                  if (startTime && isNaN(startTime.getTime())) {
                                    console.warn(
                                      'Invalid start time:',
                                      `${dateStr}T${startTimeStr}`
                                    );
                                  }
                                  if (endTime && isNaN(endTime.getTime())) {
                                    console.warn(
                                      'Invalid end time:',
                                      `${dateStr}T${endTimeStr}`
                                    );
                                  }

                                  allDates.push({
                                    date,
                                    startTime:
                                      startTime && !isNaN(startTime.getTime())
                                        ? startTime
                                        : null,
                                    endTime:
                                      endTime && !isNaN(endTime.getTime())
                                        ? endTime
                                        : null,
                                  });
                                } catch (error) {
                                  console.error(
                                    'Error processing event date:',
                                    ed,
                                    error
                                  );
                                }
                              });
                            }

                            console.log('All dates collected:', allDates);

                            // Sort all dates chronologically
                            allDates.sort(
                              (a, b) => a.date.getTime() - b.date.getTime()
                            );

                            return (
                              <>
                                {allDates.map((dateInfo, index) => (
                                  <div key={index} className="space-y-1">
                                    <div className="font-medium">
                                      {dateInfo.date.toLocaleDateString(
                                        'en-US',
                                        {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        }
                                      )}
                                    </div>
                                    {(dateInfo.startTime ||
                                      dateInfo.endTime) && (
                                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {dateInfo.startTime
                                          ? dateInfo.startTime.toLocaleTimeString(
                                              'en-US',
                                              {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true,
                                              }
                                            )
                                          : 'TBD'}
                                        {dateInfo.endTime && (
                                          <>
                                            {' - '}
                                            {dateInfo.endTime.toLocaleTimeString(
                                              'en-US',
                                              {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true,
                                              }
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        'Not set'
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {(selectedEvent.location ||
                    (selectedEvent as any).location_data?.toBeConfirmed) && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Location
                      </div>
                      <div className="text-base">
                        {(selectedEvent as any).location_data?.toBeConfirmed ||
                        (selectedEvent.location &&
                          (selectedEvent.location.startsWith('{') ||
                            selectedEvent.location.startsWith('[')))
                          ? 'To Be Confirmed'
                          : selectedEvent.location}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  {selectedEvent.duration_hours && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Duration
                      </div>
                      <div className="text-base">
                        {selectedEvent.duration_hours} hours
                      </div>
                    </div>
                  )}

                  {/* Attendee Count */}
                  {selectedEvent.attendee_count && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Attendees
                      </div>
                      <div className="text-base">
                        {selectedEvent.attendee_count.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Budget */}
                  {(selectedEvent.budget_total ||
                    selectedEvent.budget_min ||
                    selectedEvent.budget_max) && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Budget
                      </div>
                      <div className="text-base">
                        {selectedEvent.budget_total
                          ? `$${selectedEvent.budget_total.toLocaleString()}`
                          : selectedEvent.budget_min && selectedEvent.budget_max
                            ? `$${selectedEvent.budget_min.toLocaleString()} - $${selectedEvent.budget_max.toLocaleString()}`
                            : selectedEvent.budget_min
                              ? `From $${selectedEvent.budget_min.toLocaleString()}`
                              : selectedEvent.budget_max
                                ? `Up to $${selectedEvent.budget_max.toLocaleString()}`
                                : 'N/A'}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="space-y-1 md:col-span-2 lg:col-span-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        Description
                      </div>
                      <div className="text-base text-muted-foreground">
                        {selectedEvent.description}
                      </div>
                    </div>
                  )}

                  {/* Special Requirements */}
                  {selectedEvent.requirements && (
                    <div className="space-y-1 md:col-span-2 lg:col-span-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        Special Requirements
                      </div>
                      <div className="text-base text-muted-foreground">
                        {selectedEvent.requirements}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4 space-y-4">
            <EventTasks eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-4">
            <EventDocuments eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            <ChangeNotifications eventId={selectedEvent.id} />
            <NotificationCenter eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="duplication" className="mt-4 space-y-4">
            <EventDuplication eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="completion" className="mt-4 space-y-4">
            <EventCompletion eventId={selectedEvent.id} />
            <FeedbackCollection eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="communication" className="mt-4 space-y-4">
            <ContractorCommunication eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-4">
            <EventAnalytics eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4 space-y-4">
            <EventTimeline eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="contractors" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Event Management Team</CardTitle>
                    {user?.id === selectedEvent.user_id ? (
                      <CardDescription>
                        Manage your event management team members and their
                        roles
                      </CardDescription>
                    ) : (
                      <CardDescription>
                        <div className="space-y-1 mt-2">
                          <div>
                            The event management team is responsible for the
                            planning, management and delivery for this event.
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Only the event creator can add / remove members on
                            the event management team
                          </div>
                        </div>
                      </CardDescription>
                    )}
                  </div>
                  {user?.id === selectedEvent.user_id && (
                    <Button
                      size="sm"
                      onClick={() => setShowAddTeamMembersModal(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTeamMembers ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading team members...
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="pl-2">Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        {user?.id === selectedEvent.user_id && (
                          <TableHead>Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventTeamMembers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={user?.id === selectedEvent.user_id ? 7 : 6}
                            className="text-center text-muted-foreground py-8"
                          >
                            Loading team members...
                          </TableCell>
                        </TableRow>
                      ) : (
                        eventTeamMembers.map(member => {
                          const initials = getInitials(member.name);
                          return (
                            <TableRow key={member.id}>
                              <TableCell className="pr-2">
                                <Avatar className="h-8 w-8">
                                  {member.avatarUrl &&
                                  member.avatarUrl.trim() ? (
                                    <AvatarImage
                                      src={member.avatarUrl}
                                      alt={member.name}
                                    />
                                  ) : null}
                                  <AvatarFallback className="text-xs">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                              </TableCell>
                              <TableCell className="pl-2">
                                <span className="font-medium">
                                  {member.name}
                                </span>
                              </TableCell>
                              <TableCell>{member.role}</TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>{member.phone || 'N/A'}</TableCell>
                              <TableCell>
                                {getStatusBadge(member.status)}
                              </TableCell>
                              {user?.id === selectedEvent.user_id && (
                                <TableCell>
                                  {member.isCreator ? (
                                    <span className="text-xs text-muted-foreground">
                                      Creator
                                    </span>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveTeamMember(member.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Contractors Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Contractors</CardTitle>
                    <CardDescription>
                      Contractors matched or assigned to this event
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingContractors ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading contractors...
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="pl-2">Company Name</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventContractors.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground py-8"
                          >
                            No contractors matched yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        eventContractors.map(contractor => {
                          const initials = contractor.company_name
                            ? contractor.company_name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'N/A';
                          return (
                            <TableRow key={contractor.id}>
                              <TableCell className="pr-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                              </TableCell>
                              <TableCell className="pl-2">
                                <span className="font-medium">
                                  {contractor.company_name}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {contractor.service_categories
                                    ?.slice(0, 3)
                                    .map((cat: string, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {cat}
                                      </Badge>
                                    ))}
                                  {contractor.service_categories?.length >
                                    3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +
                                      {contractor.service_categories.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{contractor.email || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    contractor.status === 'hired'
                                      ? 'bg-green-100 text-green-800'
                                      : contractor.status === 'interested'
                                        ? 'bg-blue-100 text-blue-800'
                                        : contractor.status === 'declined'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {contractor.status
                                    ? contractor.status
                                        .charAt(0)
                                        .toUpperCase() +
                                      contractor.status.slice(1)
                                    : 'Pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        open={showCreateEventModal}
        onOpenChange={setShowCreateEventModal}
        onSuccess={eventId => {
          // Refresh events list after successful creation
          loadEvents();
          setShowCreateEventModal(false);
        }}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        open={showEditEventModal}
        onOpenChange={setShowEditEventModal}
        eventId={selectedEvent?.id || null}
        onSuccess={async eventId => {
          if (selectedEvent?.id) {
            setEventJustEdited(selectedEvent.id);
          }
          setShowEditEventModal(false);
          // Reload the specific event to get updated data including event_dates
          if (selectedEvent?.id) {
            console.log('Reloading event after edit:', selectedEvent.id);
            // Directly fetch the event to verify event_dates are in the response and update immediately
            try {
              const headers: HeadersInit = {};
              if (user?.id) {
                headers['x-user-id'] = user.id;
              }
              const response = await fetch(`/api/events/${selectedEvent.id}`, {
                headers,
                credentials: 'include',
              });
              const data = await response.json();
              console.log('Direct API response:', {
                success: data.success,
                hasEvent: !!data.event,
                hasEventDates: !!(data.event as any)?.event_dates,
                eventDates: (data.event as any)?.event_dates,
                eventDatesLength: Array.isArray(
                  (data.event as any)?.event_dates
                )
                  ? (data.event as any).event_dates.length
                  : 'not an array',
              });

              // If event_dates are in the response, manually update selectedEvent immediately
              if (data.success && data.event) {
                console.log(
                  'Manually updating selectedEvent with full event data including event_dates'
                );
                const updatedEvent = {
                  ...data.event,
                  event_dates: (data.event as any).event_dates || [],
                };
                setSelectedEvent(updatedEvent as any);
                console.log(
                  'selectedEvent updated, event_dates:',
                  (updatedEvent as any).event_dates
                );
              }
            } catch (error) {
              console.error('Error fetching event directly:', error);
            }
            // Also call loadEvent to update currentEvent for consistency
            await loadEvent(selectedEvent.id);
          }
          // Refresh events list (but don't let it overwrite selectedEvent)
          await loadEvents();
        }}
      />

      {/* Add Team Members Modal */}
      {selectedEvent && (
        <AddEventTeamMembersModal
          isOpen={showAddTeamMembersModal}
          onClose={() => setShowAddTeamMembersModal(false)}
          eventId={selectedEvent.id}
          onSuccess={() => {
            loadEventTeamMembers();
          }}
        />
      )}

      {/* Remove Team Member Warning Modal */}
      <Dialog
        open={showRemoveTeamMemberModal}
        onOpenChange={setShowRemoveTeamMemberModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              This team member has tasks assigned to them for this event. If you
              continue, they will be removed from these tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Assigned Tasks:</p>
              {assignedTasks.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {assignedTasks.map(task => (
                    <li key={task.id} className="text-sm text-muted-foreground">
                      {task.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No tasks found</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveTeamMemberModal(false);
                setTeamMemberToRemove(null);
                setAssignedTasks([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (teamMemberToRemove) {
                  performRemoveTeamMember(teamMemberToRemove);
                }
              }}
            >
              Continue and Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
