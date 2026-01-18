'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { format, isBefore, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TeamMember {
  id: string;
  teamMemberId?: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
}

interface Contractor {
  id: string;
  company_name: string;
  user_id: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  team_members?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
  }>;
  contractors?: Array<{
    id: string;
    company_name: string;
    user_id: string;
  }>;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  task: Task | null;
  onSuccess?: () => void;
}

export function EditTaskModal({
  isOpen,
  onClose,
  eventId,
  task,
  onSuccess,
}: EditTaskModalProps) {
  const { user } = useAuth();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<
    'todo' | 'in_progress' | 'completed' | 'cancelled'
  >('todo');
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | 'urgent'
  >('medium');
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<
    Set<string>
  >(new Set());
  const [selectedContractorIds, setSelectedContractorIds] = useState<
    Set<string>
  >(new Set());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load task data when modal opens and team members/contractors are loaded
  useEffect(() => {
    if (isOpen && task) {
      setTaskTitle(task.title || '');
      setTaskDescription(task.description || '');
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
    }
  }, [isOpen, task]);

  // Set selected team members and contractors after they're loaded
  useEffect(() => {
    if (isOpen && task && teamMembers.length > 0) {
      // Set selected team members (using event_team_members.id for selection)
      if (task.team_members && task.team_members.length > 0) {
        const teamMemberIds = new Set(
          teamMembers
            .filter(tm => {
              // Match by team_member_id from the task
              return task.team_members?.some(t => {
                // t.id is the team_member_id from team_members table
                return t.id === tm.teamMemberId;
              });
            })
            .map(tm => tm.id)
        );
        setSelectedTeamMemberIds(teamMemberIds);
      } else {
        setSelectedTeamMemberIds(new Set());
      }
    }
  }, [isOpen, task, teamMembers]);

  useEffect(() => {
    if (isOpen && task && contractors.length > 0) {
      // Set selected contractors
      if (task.contractors && task.contractors.length > 0) {
        setSelectedContractorIds(new Set(task.contractors.map(c => c.id)));
      } else {
        setSelectedContractorIds(new Set());
      }
    }
  }, [isOpen, task, contractors]);

  useEffect(() => {
    if (isOpen && eventId) {
      loadTeamMembers();
      loadContractors();
    }
  }, [isOpen, eventId]);

  const loadTeamMembers = async () => {
    if (!user?.id) return;

    setIsLoadingTeamMembers(true);
    try {
      const headers: HeadersInit = {};
      if (user.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/events/${eventId}/team-members`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team members');
      }

      const teamMembersList = (data.teamMembers || []).map((tm: any) => ({
        id: tm.id,
        teamMemberId: tm.teamMemberId || tm.team_member_id,
        name: tm.name,
        email: tm.email,
        role: tm.role,
        avatar_url: tm.avatarUrl || tm.avatar_url || null,
      }));
      setTeamMembers(teamMembersList);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setIsLoadingTeamMembers(false);
    }
  };

  const loadContractors = async () => {
    if (!user?.id) return;

    setIsLoadingContractors(true);
    try {
      const response = await fetch(`/api/events/${eventId}/matching`, {
        method: 'GET',
        headers: {
          'x-user-id': user.id,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.matches) {
        const contractorsList = data.matches
          .map((match: any) => ({
            id: match.contractor_id || match.contractor?.id,
            company_name:
              match.contractor?.company_name ||
              match.contractor?.name ||
              'Unknown',
            user_id: match.contractor?.user_id,
          }))
          .filter((c: Contractor) => c.id);
        setContractors(contractorsList);
      }
    } catch (error) {
      console.error('Error loading contractors:', error);
    } finally {
      setIsLoadingContractors(false);
    }
  };

  const handleSubmit = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!task?.id) {
      toast.error('Task ID is missing');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const taskData: any = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        due_date: dueDate ? dueDate.toISOString() : null,
        status,
        priority,
      };

      // Add assignments if selected
      if (selectedTeamMemberIds.size > 0) {
        const selectedTeamMembers = teamMembers.filter(tm =>
          selectedTeamMemberIds.has(tm.id)
        );
        taskData.team_member_ids = selectedTeamMembers
          .map(tm => tm.teamMemberId || tm.id)
          .filter(Boolean);
      } else {
        taskData.team_member_ids = [];
      }

      if (selectedContractorIds.size > 0) {
        taskData.contractor_ids = Array.from(selectedContractorIds);
      } else {
        taskData.contractor_ids = [];
      }

      const response = await fetch(`/api/events/${eventId}/tasks/${task.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      toast.success('Task updated successfully');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update task';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTeamMember = (teamMemberId: string) => {
    setSelectedTeamMemberIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamMemberId)) {
        newSet.delete(teamMemberId);
      } else {
        newSet.add(teamMemberId);
      }
      return newSet;
    });
  };

  const handleToggleContractor = (contractorId: string) => {
    setSelectedContractorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contractorId)) {
        newSet.delete(contractorId);
      } else {
        newSet.add(contractorId);
      }
      return newSet;
    });
  };

  const handleSelectAllTeamMembers = () => {
    if (selectedTeamMemberIds.size === teamMembers.length) {
      setSelectedTeamMemberIds(new Set());
    } else {
      setSelectedTeamMemberIds(new Set(teamMembers.map(tm => tm.id)));
    }
  };

  const handleSelectAllContractors = () => {
    if (selectedContractorIds.size === contractors.length) {
      setSelectedContractorIds(new Set());
    } else {
      setSelectedContractorIds(new Set(contractors.map(c => c.id)));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClose = () => {
    setTaskTitle('');
    setTaskDescription('');
    setDueDate(undefined);
    setStatus('todo');
    setPriority('medium');
    setSelectedTeamMemberIds(new Set());
    setSelectedContractorIds(new Set());
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details and assignments.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-task-title">Task Title *</Label>
            <Input
              id="edit-task-title"
              placeholder="Enter task title"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-task-description">Description</Label>
            <textarea
              id="edit-task-description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter task description (optional)"
              value={taskDescription}
              onChange={e => setTaskDescription(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value: any) => setStatus(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(value: any) => setPriority(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={date => isBefore(date, startOfDay(new Date()))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Team Members Assignment */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assign to Team Members (Optional)</Label>
                {teamMembers.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllTeamMembers}
                    className="h-auto py-1 text-xs"
                  >
                    {selectedTeamMemberIds.size === teamMembers.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                )}
              </div>
              {isLoadingTeamMembers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                  {teamMembers.map(member => {
                    const initials = getInitials(member.name);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedTeamMemberIds.has(member.id)}
                          onCheckedChange={() =>
                            handleToggleTeamMember(member.id)
                          }
                        />
                        <Avatar className="h-8 w-8">
                          {member.avatar_url && member.avatar_url.trim() ? (
                            <AvatarImage
                              src={member.avatar_url}
                              alt={member.name}
                            />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {member.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.role} • {member.email}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Contractors Assignment */}
          {contractors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Assign to Contractors (Optional)</Label>
                {contractors.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllContractors}
                    className="h-auto py-1 text-xs"
                  >
                    {selectedContractorIds.size === contractors.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                )}
              </div>
              {isLoadingContractors ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                  {contractors.map(contractor => (
                    <div
                      key={contractor.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedContractorIds.has(contractor.id)}
                        onCheckedChange={() =>
                          handleToggleContractor(contractor.id)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {contractor.company_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !taskTitle.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
