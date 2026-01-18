'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
  status: 'invited' | 'onboarding' | 'active';
}

interface AddEventTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSuccess?: () => void;
}

export function AddEventTeamMembersModal({
  isOpen,
  onClose,
  eventId,
  onSuccess,
}: AddEventTeamMembersModalProps) {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadTeamMembers();
    }
  }, [isOpen, user?.id]);

  const loadTeamMembers = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (user.id) {
        headers['x-user-id'] = user.id;
      }

      // Use the dedicated endpoint that only returns team members from team_members table
      // (excludes invitations from team_member_invitations table)
      const response = await fetch('/api/team-members/for-events', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team members');
      }

      // This endpoint only returns team members from team_members table
      // All IDs are valid for event assignment
      const teamMembersList = data.teamMembers || [];
      console.log('Team members for event assignment:', teamMembersList);
      setTeamMembers(teamMembersList);
    } catch (error) {
      console.error('Error loading team members:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load team members';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (teamMemberId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamMemberId)) {
        newSet.delete(teamMemberId);
      } else {
        newSet.add(teamMemberId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === teamMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(teamMembers.map(tm => tm.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one team member');
      return;
    }

    // Filter out invitations - only include team members that exist in team_members table
    // Invitations have IDs from team_member_invitations table, which don't work for event assignment
    // We can identify them by checking if they're in the teamMembers list that came from team_members table
    // Actually, the API mixes both, so we need to filter by checking which ones are valid
    // For now, let's send all and let the backend validate, but add better error handling

    const teamMemberIds = Array.from(selectedIds);
    console.log('Submitting team member IDs:', teamMemberIds);
    console.log(
      'Selected team members:',
      teamMembers.filter(tm => selectedIds.has(tm.id))
    );

    setIsSubmitting(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/events/${eventId}/team-members`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          teamMemberIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        // Provide more helpful error message
        if (data.error === 'No team members found with the provided IDs') {
          throw new Error(
            'Selected team members are pending invitations and cannot be added to events. ' +
              'They must accept the invitation first.'
          );
        }
        throw new Error(data.error || 'Failed to add team members to event');
      }

      toast.success(
        data.message ||
          `Successfully added ${data.added || selectedIds.size} team member(s) to the event`
      );
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error adding team members to event:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to add team members to event';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Team Members to Event</DialogTitle>
          <DialogDescription>
            Select team members from your profile to add to this event
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No team members found. Add team members from your profile first.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Checkbox
                    checked={
                      teamMembers.length > 0 &&
                      selectedIds.size === teamMembers.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span>Select All</span>
                </label>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} of {teamMembers.length} selected
                </span>
              </div>

              <div className="space-y-2">
                {teamMembers.map(member => {
                  const initials = getInitials(member.name);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.has(member.id)}
                        onCheckedChange={() => handleToggle(member.id)}
                      />
                      <Avatar className="h-10 w-10">
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
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.role} • {member.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            disabled={isSubmitting || selectedIds.size === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${selectedIds.size > 0 ? selectedIds.size : ''} Team Member${selectedIds.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
