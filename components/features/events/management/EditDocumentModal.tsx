'use client';

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { X, Loader2, Save } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Document } from './EventDocuments';

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

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  document: Document | null;
  onSuccess?: () => void;
}

export function EditDocumentModal({
  isOpen,
  onClose,
  eventId,
  document,
  onSuccess,
}: EditDocumentModalProps) {
  const { user } = useAuth();
  const [documentName, setDocumentName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sharing options
  const [teamMemberSharing, setTeamMemberSharing] = useState<
    'all' | 'selected' | 'none'
  >('all');
  const [contractorSharing, setContractorSharing] = useState<
    'all' | 'selected' | 'none'
  >('none');
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

  useEffect(() => {
    if (isOpen && eventId && user?.id) {
      loadTeamMembers();
      loadContractors();
    }
  }, [isOpen, eventId, user?.id]);

  useEffect(() => {
    if (isOpen && document) {
      // Populate form with existing document data
      setDocumentName(document.name || '');

      // Set sharing options
      if (document.shared_with?.all_team_members) {
        setTeamMemberSharing('all');
      } else if (
        document.shared_with?.team_members &&
        document.shared_with.team_members.length > 0
      ) {
        setTeamMemberSharing('selected');
      } else {
        setTeamMemberSharing('none');
      }

      if (document.shared_with?.all_contractors) {
        setContractorSharing('all');
      } else if (
        document.shared_with?.contractors &&
        document.shared_with.contractors.length > 0
      ) {
        setContractorSharing('selected');
      } else {
        setContractorSharing('none');
      }
    }
  }, [isOpen, document]);

  // Set selected team members and contractors after they're loaded
  useEffect(() => {
    if (
      document &&
      teamMembers.length > 0 &&
      teamMemberSharing === 'selected'
    ) {
      const selectedIds = new Set<string>();
      document.shared_with?.team_members?.forEach(tm => {
        // Find matching team member by id first, then by name
        const matchingMember = teamMembers.find(
          m => m.id === tm.id || m.name === tm.name
        );
        if (matchingMember) {
          selectedIds.add(matchingMember.id);
        }
      });
      setSelectedTeamMemberIds(selectedIds);
    }
  }, [document, teamMembers, teamMemberSharing]);

  useEffect(() => {
    if (
      document &&
      contractors.length > 0 &&
      contractorSharing === 'selected'
    ) {
      const selectedIds = new Set<string>();
      document.shared_with?.contractors?.forEach(contractor => {
        // Find matching contractor by id first, then by company name
        const matchingContractor = contractors.find(
          c =>
            c.id === contractor.id || c.company_name === contractor.company_name
        );
        if (matchingContractor) {
          selectedIds.add(matchingContractor.id);
        }
      });
      setSelectedContractorIds(selectedIds);
    }
  }, [document, contractors, contractorSharing]);

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

  const handleSave = async () => {
    if (!document) return;

    if (!user?.id) {
      toast.error('You must be logged in to update documents');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', documentName || document.name);
      formData.append('event_id', eventId);

      // Add sharing options
      if (teamMemberSharing === 'all') {
        formData.append('share_with_all_team_members', 'true');
      } else if (
        teamMemberSharing === 'selected' &&
        selectedTeamMemberIds.size > 0
      ) {
        const selectedTeamMembers = teamMembers.filter(tm =>
          selectedTeamMemberIds.has(tm.id)
        );
        // Send event_team_members.id (tm.id) so the API can match it correctly
        selectedTeamMembers.forEach(tm => {
          formData.append('team_member_ids[]', tm.id);
        });
      }

      if (contractorSharing === 'all') {
        formData.append('share_with_all_contractors', 'true');
      } else if (
        contractorSharing === 'selected' &&
        selectedContractorIds.size > 0
      ) {
        Array.from(selectedContractorIds).forEach(id => {
          formData.append('contractor_ids[]', id);
        });
      }

      const headers: HeadersInit = {
        'x-user-id': user.id,
      };

      const response = await fetch(
        `/api/events/${eventId}/documents/${document.id}`,
        {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update document');
      }

      toast.success('Document updated successfully');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error updating document:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update document';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
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
    setDocumentName('');
    setError(null);
    setTeamMemberSharing('all');
    setContractorSharing('none');
    setSelectedTeamMemberIds(new Set());
    setSelectedContractorIds(new Set());
    onClose();
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update document name and sharing settings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="document-name">Document Name</Label>
            <Input
              id="document-name"
              placeholder="Enter document name"
              value={documentName}
              onChange={e => setDocumentName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Team Member Sharing Options */}
          <div className="space-y-3 border-t pt-4">
            <Label>Share with Team Members</Label>
            <RadioGroup
              value={teamMemberSharing}
              onValueChange={(value: 'all' | 'selected' | 'none') => {
                setTeamMemberSharing(value);
                if (value !== 'selected') {
                  setSelectedTeamMemberIds(new Set());
                }
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="team-none" />
                <Label
                  htmlFor="team-none"
                  className="font-normal cursor-pointer"
                >
                  No team members
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="team-all" />
                <Label
                  htmlFor="team-all"
                  className="font-normal cursor-pointer"
                >
                  All team members
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="team-selected" />
                <Label
                  htmlFor="team-selected"
                  className="font-normal cursor-pointer"
                >
                  Selected team members
                </Label>
              </div>
            </RadioGroup>

            {/* Team Member Selection */}
            {teamMemberSharing === 'selected' && (
              <div className="ml-6 space-y-2">
                {isLoadingTeamMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No team members found for this event.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Select team members to share with
                      </span>
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
                    </div>
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* Contractor Sharing Options */}
          <div className="space-y-3 border-t pt-4">
            <Label>Share with Contractors</Label>
            <RadioGroup
              value={contractorSharing}
              onValueChange={(value: 'all' | 'selected' | 'none') => {
                setContractorSharing(value);
                if (value !== 'selected') {
                  setSelectedContractorIds(new Set());
                }
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="contractor-none" />
                <Label
                  htmlFor="contractor-none"
                  className="font-normal cursor-pointer"
                >
                  No contractors
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="contractor-all" />
                <Label
                  htmlFor="contractor-all"
                  className="font-normal cursor-pointer"
                >
                  All contractors
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="contractor-selected" />
                <Label
                  htmlFor="contractor-selected"
                  className="font-normal cursor-pointer"
                >
                  Selected contractors
                </Label>
              </div>
            </RadioGroup>

            {/* Contractor Selection */}
            {contractorSharing === 'selected' && (
              <div className="ml-6 space-y-2">
                {isLoadingContractors ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : contractors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No contractors found for this event.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Select contractors to share with
                      </span>
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
                    </div>
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !documentName.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
