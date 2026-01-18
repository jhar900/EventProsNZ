'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, MoreVertical, Mail, Trash2, Pencil } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
  status:
    | 'invited'
    | 'onboarding'
    | 'active'
    | 'declined'
    | 'inactive'
    | 'accepted';
}

interface TeamMembersManagerProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function TeamMembersManager({
  onSuccess,
  onError,
}: TeamMembersManagerProps) {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRoleValue, setEditRoleValue] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '',
    email: '',
  });

  // Fetch team members on mount and when user is available
  useEffect(() => {
    if (user?.id) {
      loadTeamMembers();
    }
  }, [user?.id]);

  const loadTeamMembers = async () => {
    if (!user?.id) return;

    setIsLoadingMembers(true);
    try {
      const headers: HeadersInit = {};
      if (user.id) {
        headers['x-user-id'] = user.id;
      }

      // Add cache-busting query parameter to ensure fresh data
      const response = await fetch(`/api/team-members?t=${Date.now()}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team members');
      }

      console.log('[TeamMembersManager] Loaded team members:', {
        count: data.teamMembers?.length || 0,
        members:
          data.teamMembers?.map((m: TeamMember) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            status: m.status,
            email: m.email,
          })) || [],
        rawData: data.teamMembers,
      });

      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load team members';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const getStatusBadge = (status: TeamMember['status']) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'outline' | 'destructive'
    > = {
      active: 'default',
      accepted: 'secondary', // Will use custom styling for soft green
      onboarding: 'secondary',
      invited: 'outline',
      declined: 'destructive',
      inactive: 'destructive', // Map inactive to declined for display
    };

    const labels: Record<string, string> = {
      active: 'Active',
      accepted: 'Accepted',
      onboarding: 'Onboarding',
      invited: 'Invited',
      declined: 'Declined',
      inactive: 'Declined', // Map inactive to declined for display
    };

    // Normalize status: map 'inactive' to 'declined' for display
    const displayStatus = status === 'inactive' ? 'declined' : status;

    // Custom styling for accepted status (soft green)
    if (displayStatus === 'accepted') {
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
        >
          {labels[displayStatus] || status}
        </Badge>
      );
    }

    return (
      <Badge variant={variants[displayStatus] || 'outline'}>
        {labels[displayStatus] || status}
      </Badge>
    );
  };

  const handleInviteClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      role: '',
      email: '',
    });
  };

  const handleReinvite = async (memberId: string) => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch('/api/team-members/reinvite', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ invitationId: memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyAccepted) {
          toast.error(
            'This team member has already accepted the invitation. The status should show as "Accepted".'
          );
          // Reload to ensure status is correct
          await loadTeamMembers();
        } else {
          throw new Error(
            data.error || data.details || 'Failed to reinvite team member'
          );
        }
        return;
      }

      toast.success('Invitation resent successfully');
      onSuccess?.('Invitation resent successfully!');
      // Reload team members to reflect the status change
      await loadTeamMembers();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to reinvite team member';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (member: TeamMember) => {
    setEditingMember(member);
    setEditRoleValue(member.role);
    setIsEditRoleModalOpen(true);
  };

  const handleCloseEditRoleModal = () => {
    setIsEditRoleModalOpen(false);
    setEditingMember(null);
    setEditRoleValue('');
  };

  const handleUpdateRole = async () => {
    if (!editingMember || !editRoleValue.trim()) {
      toast.error('Please enter a role');
      return;
    }

    console.log('[TeamMembersManager] Updating role:', {
      memberId: editingMember.id,
      memberName: editingMember.name,
      memberEmail: editingMember.email,
      oldRole: editingMember.role,
      newRole: editRoleValue.trim(),
      memberStatus: editingMember.status,
    });

    setIsLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/team-members/${editingMember.id}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ role: editRoleValue.trim() }),
      });

      const data = await response.json();

      console.log('[TeamMembersManager] Update role response:', {
        ok: response.ok,
        status: response.status,
        data,
        responseText: JSON.stringify(data, null, 2),
      });

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to update role');
      }

      toast.success('Role updated successfully');
      onSuccess?.('Role updated successfully!');

      // Update local state immediately with the new role since we know the update succeeded
      const updatedMembers = teamMembers.map(member =>
        member.id === editingMember.id
          ? { ...member, role: editRoleValue.trim() }
          : member
      );
      setTeamMembers(updatedMembers);

      console.log('[TeamMembersManager] Updated local state:', {
        memberId: editingMember.id,
        newRole: editRoleValue.trim(),
        updatedMember: updatedMembers.find(m => m.id === editingMember.id),
      });

      // Close modal immediately since we've updated local state
      handleCloseEditRoleModal();

      // Reload in the background to sync with server (but don't wait for it)
      // This ensures the UI is updated immediately while we sync with the server
      loadTeamMembers().catch(err => {
        console.error(
          '[TeamMembersManager] Error reloading team members:',
          err
        );
        // Don't show error to user since we've already updated local state
      });

      // Close modal after data is reloaded
      handleCloseEditRoleModal();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update role';
      console.error('[TeamMembersManager] Error updating role:', error);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`/api/team-members/${memberId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || 'Failed to remove team member'
        );
      }

      toast.success('Team member removed successfully');
      onSuccess?.('Team member removed successfully!');
      // Reload team members to reflect the removal
      await loadTeamMembers();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to remove team member';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate email address
    const normalizedEmail = formData.email.toLowerCase().trim();
    const duplicateMember = teamMembers.find(
      member => member.email.toLowerCase().trim() === normalizedEmail
    );

    if (duplicateMember) {
      toast.error(
        `A team member with the email address ${formData.email} has already been added.`
      );
      onError?.(
        `A team member with the email address ${formData.email} has already been added.`
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log('[TeamMembersManager] Sending invite request:', {
        formData,
        url: '/api/team-members/invite',
        hasCredentials: true,
        userId: user?.id,
      });

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add user ID to header as fallback if cookies fail
      if (user?.id) {
        headers['x-user-id'] = user.id;
        console.log('[TeamMembersManager] Adding x-user-id header:', user.id);
      }

      const response = await fetch('/api/team-members/invite', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(formData),
      });

      console.log('[TeamMembersManager] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const data = await response.json();
      console.log('[TeamMembersManager] Response data:', data);

      if (!response.ok) {
        console.error('[TeamMembersManager] Request failed:', {
          status: response.status,
          error: data.error,
          details: data.details,
          code: data.code,
        });
        throw new Error(
          data.error || data.details || 'Failed to send invitation'
        );
      }

      // Show success message
      toast.success(
        `An email has been sent to ${formData.email} inviting them to join your team.`,
        {
          duration: 5000,
        }
      );

      onSuccess?.('Team member invitation sent successfully!');
      handleCloseModal();
      // Reload team members to show the new invitation
      await loadTeamMembers();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send invitation';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your event management team members and their roles
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleInviteClick}>
            <Plus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingMembers ? (
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
              {teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No team members added yet
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map(member => {
                  const initials = member.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="pr-2">
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
                      </TableCell>
                      <TableCell className="pl-2">
                        <span className="font-medium">{member.name}</span>
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditRole(member)}
                              disabled={isLoading}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            {(member.status === 'declined' ||
                              member.status === 'inactive') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleReinvite(member.id)}
                                  disabled={isLoading}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Reinvite
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={isLoading}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Invite Team Member Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Enter the details of the team member you want to invite.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, role: e.target.value }))
                  }
                  placeholder="Enter role"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleModalOpen} onOpenChange={setIsEditRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update the role for {editingMember?.name || 'this team member'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editRole">Role *</Label>
              <Input
                id="editRole"
                value={editRoleValue}
                onChange={e => setEditRoleValue(e.target.value)}
                placeholder="Enter role"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseEditRoleModal}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateRole}
              disabled={isLoading || !editRoleValue.trim()}
            >
              {isLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
