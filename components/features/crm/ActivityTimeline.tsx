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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Calendar,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  StickyNote,
  Bell,
  CheckCircle,
  XCircle,
  User,
  Filter,
  Download,
} from 'lucide-react';
import { useCRM } from '@/hooks/useCRM';

interface TimelineItem {
  id: string;
  type: 'interaction' | 'message' | 'note' | 'reminder';
  created_at: string;
  // Interaction fields
  interaction_type?: string;
  interaction_data?: any;
  interaction_notes?: string;
  // Message fields
  message_type?: string;
  content?: string;
  message_data?: any;
  is_read?: boolean;
  read_at?: string;
  // Note fields
  note_type?: string;
  note_content?: string;
  tags?: string[];
  is_important?: boolean;
  // Reminder fields
  reminder_type?: string;
  reminder_date?: string;
  reminder_message?: string;
  is_completed?: boolean;
  completed_at?: string;
  // Contact info
  contact: {
    id: string;
    contact_type: string;
    relationship_status: string;
    contact_user: {
      id: string;
      email: string;
      role: string;
    };
    contact_profile: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  };
}

interface TimelineFilters {
  contact_id?: string;
  date_from?: string;
  date_to?: string;
}

interface TimelineSummary {
  period: string;
  date_from: string;
  date_to: string;
  contact_info: {
    id: string;
    created_at: string;
    last_interaction: string | null;
    total_interaction_count: number;
  };
  activity_summary: {
    total_activities: number;
    total_interactions: number;
    total_messages: number;
    total_notes: number;
    total_reminders: number;
    activity_frequency: number;
  };
  breakdown: {
    interactions: Record<string, number>;
    messages: Record<string, number>;
    notes: Record<string, number>;
    reminders: Record<string, number>;
  };
  metrics: {
    read_messages: number;
    unread_messages: number;
    important_notes: number;
    completed_reminders: number;
    pending_reminders: number;
  };
}

export function ActivityTimeline() {
  const { isLoading, error, contacts } = useCRM();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [selectedContact, setSelectedContact] = useState<string>('');

  // Load timeline when contact is selected
  useEffect(() => {
    const loadTimeline = async () => {
      if (!selectedContact) return;

      try {
        const params = new URLSearchParams();
        params.append('contact_id', selectedContact);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);

        const response = await fetch(`/api/crm/timeline?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setTimeline(data.timeline);
        }
      } catch (err) {
        // Error is handled by the hook
      }
    };

    loadTimeline();
  }, [selectedContact, filters]);

  // Load summary
  useEffect(() => {
    const loadSummary = async () => {
      if (!selectedContact) return;

      try {
        const params = new URLSearchParams();
        params.append('contact_id', selectedContact);
        params.append('period', 'month');

        const response = await fetch(
          `/api/crm/timeline/summary?${params.toString()}`
        );
        const data = await response.json();

        if (data.success) {
          setSummary(data.summary);
        }
      } catch (err) {
        // Silently fail for summary
      }
    };

    loadSummary();
  }, [selectedContact]);

  const handleFilterChange = (key: keyof TimelineFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const getTimelineIcon = (item: TimelineItem) => {
    switch (item.type) {
      case 'interaction':
        switch (item.interaction_type) {
          case 'call':
            return <Phone className="h-4 w-4" />;
          case 'email':
            return <Mail className="h-4 w-4" />;
          case 'meeting':
            return <Calendar className="h-4 w-4" />;
          default:
            return <User className="h-4 w-4" />;
        }
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      case 'reminder':
        return <Bell className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTimelineColor = (item: TimelineItem) => {
    switch (item.type) {
      case 'interaction':
        return 'bg-blue-100 text-blue-800';
      case 'message':
        return 'bg-green-100 text-green-800';
      case 'note':
        return 'bg-yellow-100 text-yellow-800';
      case 'reminder':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderTimelineItem = (item: TimelineItem) => {
    const isToday =
      new Date(item.created_at).toDateString() === new Date().toDateString();
    const isYesterday =
      new Date(item.created_at).toDateString() ===
      new Date(Date.now() - 86400000).toDateString();

    return (
      <div key={item.id} className="flex items-start space-x-4 pb-4">
        <div className="flex-shrink-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${getTimelineColor(item)}`}
          >
            {getTimelineIcon(item)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className={getTimelineColor(item)}>{item.type}</Badge>
              {item.interaction_type && (
                <Badge variant="outline">{item.interaction_type}</Badge>
              )}
              {item.message_type && (
                <Badge variant="outline">{item.message_type}</Badge>
              )}
              {item.note_type && (
                <Badge variant="outline">{item.note_type}</Badge>
              )}
              {item.reminder_type && (
                <Badge variant="outline">{item.reminder_type}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {isToday
                ? 'Today'
                : isYesterday
                  ? 'Yesterday'
                  : formatDate(item.created_at)}{' '}
              at {formatTime(item.created_at)}
            </div>
          </div>

          <div className="mt-2">
            {item.type === 'interaction' && (
              <div>
                <p className="text-sm">
                  {item.interaction_notes || 'Interaction recorded'}
                </p>
                {item.interaction_data && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Data: {JSON.stringify(item.interaction_data)}
                  </div>
                )}
              </div>
            )}

            {item.type === 'message' && (
              <div>
                <p className="text-sm">{item.content}</p>
                <div className="mt-1 flex items-center space-x-2">
                  {item.is_read ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {item.is_read ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            )}

            {item.type === 'note' && (
              <div>
                <p className="text-sm">{item.note_content}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {item.is_important && (
                  <div className="mt-1">
                    <Badge variant="destructive" className="text-xs">
                      Important
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {item.type === 'reminder' && (
              <div>
                <p className="text-sm">
                  {item.reminder_message || 'Reminder set'}
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  {item.is_completed ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Clock className="h-3 w-3 text-yellow-600" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {item.is_completed ? 'Completed' : 'Pending'}
                  </span>
                  {item.reminder_date && (
                    <span className="text-xs text-muted-foreground">
                      Due: {formatDate(item.reminder_date)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Activity Timeline
          </h2>
          <p className="text-muted-foreground">
            View activity timeline for your contacts
          </p>
        </div>
      </div>

      {/* Contact Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Contact</CardTitle>
          <CardDescription>
            Choose a contact to view their activity timeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select
                value={selectedContact}
                onValueChange={setSelectedContact}
              >
                <SelectTrigger aria-label="Select Contact">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Load contacts for selection */}
                  <SelectItem value="1">John Doe</SelectItem>
                  <SelectItem value="2">Jane Smith</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <input
                type="date"
                placeholder="From Date"
                value={filters.date_from || ''}
                onChange={e => handleFilterChange('date_from', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                placeholder="To Date"
                value={filters.date_to || ''}
                onChange={e => handleFilterChange('date_to', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>
              Overview of contact activity for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {summary.activity_summary.total_activities}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Activities
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {summary.activity_summary.total_interactions}
                </div>
                <div className="text-sm text-muted-foreground">
                  Interactions
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {summary.activity_summary.total_messages}
                </div>
                <div className="text-sm text-muted-foreground">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {summary.activity_summary.total_notes}
                </div>
                <div className="text-sm text-muted-foreground">Notes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Timeline */}
      {selectedContact && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>
              Chronological view of all activities for this contact
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading timeline...</span>
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No activity found</h3>
                <p className="text-muted-foreground">
                  This contact has no recorded activities
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {timeline.map(renderTimelineItem)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Contact Selected */}
      {!selectedContact && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Select a Contact</h3>
            <p className="text-muted-foreground">
              Choose a contact from the dropdown above to view their activity
              timeline
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
