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
import { Plus } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  status: 'invited' | 'onboarding' | 'active';
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

      const response = await fetch('/api/team-members', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team members');
      }

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
    const variants = {
      invited: 'outline' as const,
      onboarding: 'secondary' as const,
      active: 'default' as const,
    };

    const labels = {
      invited: 'Invited',
      onboarding: 'Onboarding',
      active: 'Active',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No team members added yet
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                  </TableRow>
                ))
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
    </Card>
  );
}
