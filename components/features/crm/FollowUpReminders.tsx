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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Loader2,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Bell,
  CheckCircle,
  Clock,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { useCRM } from '@/hooks/useCRM';

interface Reminder {
  id: string;
  reminder_type:
    | 'call'
    | 'email'
    | 'meeting'
    | 'follow_up'
    | 'deadline'
    | 'other';
  reminder_date: string;
  reminder_message: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
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

interface ReminderFilters {
  reminder_type?: string;
  contact_id?: string;
  is_completed?: boolean;
}

export function FollowUpReminders() {
  const {
    reminders,
    isLoading,
    error,
    loadReminders,
    createReminder,
    updateReminder,
  } = useCRM();
  const [filters, setFilters] = useState<ReminderFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newReminder, setNewReminder] = useState({
    contact_id: '',
    reminder_type: 'follow_up' as const,
    reminder_date: '',
    reminder_message: '',
  });

  // Load reminders
  useEffect(() => {
    loadReminders(filters);
  }, [filters, loadReminders]);

  const handleFilterChange = (
    key: keyof ReminderFilters,
    value: string | boolean
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' || value === false ? undefined : value,
    }));
  };

  const handleCreateReminder = async () => {
    if (!newReminder.contact_id || !newReminder.reminder_date) return;

    try {
      await createReminder(newReminder);
      setNewReminder({
        contact_id: '',
        reminder_type: 'follow_up',
        reminder_date: '',
        reminder_message: '',
      });
      setIsCreating(false);
      // Reload reminders
      loadReminders(filters);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleToggleReminder = async (
    reminderId: string,
    isCompleted: boolean
  ) => {
    try {
      await updateReminder(reminderId, {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      });
      // Reload reminders
      loadReminders(filters);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'follow_up':
        return 'bg-yellow-100 text-yellow-800';
      case 'deadline':
        return 'bg-red-100 text-red-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <CalendarIcon className="h-4 w-4" />;
      case 'follow_up':
        return <MessageSquare className="h-4 w-4" />;
      case 'deadline':
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
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

  const isOverdue = (reminderDate: string, isCompleted: boolean) => {
    if (isCompleted) return false;
    return new Date(reminderDate) < new Date();
  };

  const isDueSoon = (reminderDate: string, isCompleted: boolean) => {
    if (isCompleted) return false;
    const now = new Date();
    const reminder = new Date(reminderDate);
    const diffHours = (reminder.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Follow-up Reminders
          </h2>
          <p className="text-muted-foreground">
            Manage your follow-up reminders and scheduling
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search your reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reminders..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.reminder_type || 'all'}
              onValueChange={value =>
                handleFilterChange('reminder_type', value)
              }
            >
              <SelectTrigger className="w-[180px]" aria-label="Reminder Type">
                <SelectValue placeholder="Reminder Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.is_completed?.toString() || 'all'}
              onValueChange={value =>
                handleFilterChange('is_completed', value === 'true')
              }
            >
              <SelectTrigger className="w-[180px]" aria-label="Status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="false">Pending</SelectItem>
                <SelectItem value="true">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Reminder Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Reminder</CardTitle>
            <CardDescription>Set a reminder for a contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contact</label>
                <Select
                  value={newReminder.contact_id}
                  onValueChange={value =>
                    setNewReminder(prev => ({ ...prev, contact_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* TODO: Load contacts for selection */}
                    <SelectItem value="1">John Doe</SelectItem>
                    <SelectItem value="2">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Reminder Type</label>
                <Select
                  value={newReminder.reminder_type}
                  onValueChange={value =>
                    setNewReminder(prev => ({
                      ...prev,
                      reminder_type: value as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                Reminder Date & Time
              </label>
              <Input
                type="datetime-local"
                value={newReminder.reminder_date}
                onChange={e =>
                  setNewReminder(prev => ({
                    ...prev,
                    reminder_date: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reminder Message</label>
              <Textarea
                placeholder="Enter reminder message..."
                value={newReminder.reminder_message}
                onChange={e =>
                  setNewReminder(prev => ({
                    ...prev,
                    reminder_message: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateReminder}
                disabled={
                  !newReminder.contact_id ||
                  !newReminder.reminder_date ||
                  isLoading
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Reminder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reminders ({reminders.length})</CardTitle>
          <CardDescription>
            Your follow-up reminders and scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading reminders...</span>
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No reminders found</h3>
              <p className="text-muted-foreground">
                Start by creating your first reminder
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map(reminder => (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              reminder.contact.contact_profile.avatar_url || ''
                            }
                          />
                          <AvatarFallback>
                            {getInitials(
                              reminder.contact.contact_profile.first_name,
                              reminder.contact.contact_profile.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {reminder.contact.contact_profile.first_name}{' '}
                            {reminder.contact.contact_profile.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reminder.contact.contact_user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getReminderTypeIcon(reminder.reminder_type)}
                        <Badge
                          className={getReminderTypeColor(
                            reminder.reminder_type
                          )}
                        >
                          {reminder.reminder_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {reminder.reminder_message ? (
                          <div className="truncate">
                            {reminder.reminder_message}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No message
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span>{formatDate(reminder.reminder_date)}</span>
                          {isOverdue(
                            reminder.reminder_date,
                            reminder.is_completed
                          ) && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                          {isDueSoon(
                            reminder.reminder_date,
                            reminder.is_completed
                          ) && (
                            <Badge variant="secondary" className="text-xs">
                              Due Soon
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {formatTime(reminder.reminder_date)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {reminder.is_completed ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              Completed
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-600">
                              Pending
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!reminder.is_completed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleReminder(reminder.id, true)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Complete
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Reminder
                            </DropdownMenuItem>
                            {reminder.is_completed && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleReminder(reminder.id, false)
                                }
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Mark Pending
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
