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
} from 'lucide-react';
import { EventStatusTracking } from './EventStatusTracking';
import { EventVersionHistory } from './EventVersionHistory';
import { ChangeNotifications } from './ChangeNotifications';
import { EventDuplication } from './EventDuplication';
import { EventDashboard } from './EventDashboard';
import { ProgressTracking } from './ProgressTracking';
import { EventCompletion } from './EventCompletion';
import { ContractorCommunication } from './ContractorCommunication';
import { EventAnalytics } from './EventAnalytics';
import { StatusTransition } from './StatusTransition';
import { MilestoneTracker } from './MilestoneTracker';
import { FeedbackCollection } from './FeedbackCollection';
import { NotificationCenter } from './NotificationCenter';
import { EventTimeline } from './EventTimeline';
import { CreateEventModal } from '../CreateEventModal';
import { EditEventModal } from '../EditEventModal';
import { AddEventTeamMembersModal } from '../AddEventTeamMembersModal';
import { useEventManagement } from '@/hooks/useEventManagement';
import { useAuth } from '@/hooks/useAuth';
import { Event, EVENT_STATUS } from '@/types/events';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface EventManagementProps {
  eventId?: string;
  initialTab?: string;
}

interface EventTeamMember {
  id: string;
  eventId: string;
  teamMemberId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  avatarUrl: string | null;
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
  const [showAddTeamMembersModal, setShowAddTeamMembersModal] = useState(false);
  const [eventTeamMembers, setEventTeamMembers] = useState<EventTeamMember[]>(
    []
  );
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);

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
      loadEvent(eventId);
    } else {
      loadEvents();
    }
  }, [eventId, loadEvent, loadEvents]);

  useEffect(() => {
    if (currentEvent) {
      setSelectedEvent(currentEvent);
    } else if (eventId && events.length > 0) {
      // If we have eventId but currentEvent is not set, try to find it in events list
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setSelectedEvent(foundEvent);
      }
    }
  }, [currentEvent, eventId, events]);

  // Load event team members when tab is active and event is selected
  useEffect(() => {
    if (selectedEvent && activeTab === 'contractors') {
      loadEventTeamMembers();
    }
  }, [selectedEvent?.id, activeTab]);

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

  const handleRemoveTeamMember = async (eventTeamMemberId: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this team member from the event?'
      )
    ) {
      return;
    }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Selection - Always show at top */}
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
                onClick={() => setSelectedEvent(event)}
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

      {/* Header */}
      <div className="flex items-center justify-between">
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
        {selectedEvent && (
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

      {/* Event Management Tabs */}
      {selectedEvent && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contractors">Roles</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <EventDashboard eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <EventStatusTracking eventId={selectedEvent.id} />
            <StatusTransition eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            <EventVersionHistory eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <ProgressTracking eventId={selectedEvent.id} />
            <MilestoneTracker eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <ChangeNotifications eventId={selectedEvent.id} />
            <NotificationCenter eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="duplication" className="space-y-4">
            <EventDuplication eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="completion" className="space-y-4">
            <EventCompletion eventId={selectedEvent.id} />
            <FeedbackCollection eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <ContractorCommunication eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <EventAnalytics eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <EventTimeline eventId={selectedEvent.id} />
          </TabsContent>

          <TabsContent value="contractors" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Event Management Team</CardTitle>
                    <CardDescription>
                      Manage your event management team members and their roles
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddTeamMembersModal(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventTeamMembers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            No team members added yet
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
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveTeamMember(member.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
        onSuccess={eventId => {
          // Refresh events list after successful update
          loadEvents();
          if (selectedEvent) {
            loadEvent(selectedEvent.id);
          }
          setShowEditEventModal(false);
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
    </div>
  );
}
