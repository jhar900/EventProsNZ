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
import { useEventManagement } from '@/hooks/useEventManagement';
import { Event, EVENT_STATUS } from '@/types/events';

interface EventManagementProps {
  eventId?: string;
  initialTab?: string;
}

export function EventManagement({
  eventId,
  initialTab = 'overview',
}: EventManagementProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);

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
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        No team members added yet
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
    </div>
  );
}
