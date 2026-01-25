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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  teamMemberId?: string; // The actual team_member_id from team_members table
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

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSuccess?: () => void;
}

export function AddTaskModal({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}: AddTaskModalProps) {
  const { user } = useAuth();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
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
        id: tm.id, // event_team_members.id (for display/selection)
        teamMemberId: tm.teamMemberId || tm.team_member_id, // actual team_member_id for assignment
        name: tm.name,
        email: tm.email,
        role: tm.role,
        avatar_url: tm.avatarUrl || tm.avatar_url || null,
      }));
      setTeamMembers(teamMembersList);
    } catch (error) {
      console.error('Error loading team members:', error);
      // Don't show error toast, just log it - team members are optional
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
        // Extract contractors from matches
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
      // Don't show error toast, just log it - contractors are optional
    } finally {
      setIsLoadingContractors(false);
    }
  };

  const handleSubmit = async () => {
    if (!taskTitle.trim()) {
      toast.error('Task title is required');
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
      };

      // Add assignments if selected
      // Map event_team_members.id to actual team_member_id
      if (selectedTeamMemberIds.size > 0) {
        const selectedTeamMembers = teamMembers.filter(tm =>
          selectedTeamMemberIds.has(tm.id)
        );
        taskData.team_member_ids = selectedTeamMembers
          .map(tm => tm.teamMemberId || tm.id)
          .filter(Boolean);
      }
      if (selectedContractorIds.size > 0) {
        taskData.contractor_ids = Array.from(selectedContractorIds);
      }

      const response = await fetch(`/api/events/${eventId}/tasks`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      toast.success('Task created successfully');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create task';
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
    setSelectedTeamMemberIds(new Set());
    setSelectedContractorIds(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task for this event. Assign it to a team member or
            contractor if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title *</Label>
            <Input
              id="task-title"
              placeholder="Enter task title"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Enter task description (optional)"
              value={taskDescription}
              onChange={e => setTaskDescription(e.target.value)}
              rows={4}
            />
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

          {/* Show message if no team members or contractors available */}
          {teamMembers.length === 0 &&
            contractors.length === 0 &&
            !isLoadingTeamMembers &&
            !isLoadingContractors && (
              <div className="text-sm text-muted-foreground py-2">
                No team members or contractors available for assignment.
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
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
