'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export interface ContactPerson {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  isCurrentUser?: boolean;
}

interface ContactPersonSelectorProps {
  userId: string;
  userProfile?: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    avatar_url?: string | null;
  };
  userEmail?: string;
  selectedEventId?: string;
  selectedContactPersonId?: string;
  onSelect: (contactPerson: ContactPerson | null) => void;
}

export function ContactPersonSelector({
  userId,
  userProfile,
  userEmail,
  selectedEventId,
  selectedContactPersonId,
  onSelect,
}: ContactPersonSelectorProps) {
  const [teamMembers, setTeamMembers] = useState<ContactPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const lastEventIdRef = useRef<string | undefined>(undefined);

  // Build current user as a contact person option
  const currentUser: ContactPerson = {
    id: userId,
    name:
      userProfile?.first_name && userProfile?.last_name
        ? `${userProfile.first_name} ${userProfile.last_name}`.trim()
        : userEmail || 'You',
    email: userEmail || '',
    phone: userProfile?.phone,
    avatar_url: userProfile?.avatar_url,
    isCurrentUser: true,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchTeamMembers = useCallback(
    async (force = false) => {
      // Debounce: skip if fetched within last 5 seconds (unless forced or event changed)
      const now = Date.now();
      const eventChanged = lastEventIdRef.current !== selectedEventId;
      if (!force && !eventChanged && now - lastFetchTimeRef.current < 5000) {
        return;
      }

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      lastEventIdRef.current = selectedEventId;

      try {
        setLoading(true);
        setError(null);

        let members: ContactPerson[] = [];

        if (selectedEventId) {
          // Fetch team members linked to this event
          const response = await fetch(
            `/api/events/${selectedEventId}/team-members`,
            {
              headers: {
                'x-user-id': userId,
              },
              signal: abortControllerRef.current.signal,
            }
          );

          // Handle 403 gracefully - user may not have team members or may be a contractor
          if (response.status === 403) {
            setTeamMembers([]);
            lastFetchTimeRef.current = Date.now();
            return;
          }

          if (!response.ok) {
            throw new Error('Failed to fetch event team members');
          }

          const result = await response.json();

          // Transform to ContactPerson format, excluding the current user (they're added separately)
          members = (result.teamMembers || [])
            .filter((tm: any) => !tm.isCreator) // Exclude creator since that's the current user
            .map((tm: any) => ({
              id: tm.teamMemberId || tm.id,
              name: tm.name,
              email: tm.email,
              phone: tm.phone !== 'N/A' ? tm.phone : null,
              avatar_url: tm.avatarUrl,
              isCurrentUser: false,
            }));
        } else {
          // Fetch all team members for this user
          const response = await fetch('/api/team-members', {
            headers: {
              'x-user-id': userId,
            },
            signal: abortControllerRef.current.signal,
          });

          // Handle 403 gracefully - user may be a contractor (no team members)
          if (response.status === 403) {
            setTeamMembers([]);
            lastFetchTimeRef.current = Date.now();
            return;
          }

          if (!response.ok) {
            throw new Error('Failed to fetch team members');
          }

          const result = await response.json();

          // Filter to only active/accepted team members and transform to ContactPerson format
          members = (result.teamMembers || [])
            .filter(
              (tm: any) => tm.status === 'active' || tm.status === 'accepted'
            )
            .map((tm: any) => ({
              id: tm.id,
              name: tm.name,
              email: tm.email,
              phone: tm.phone,
              avatar_url: tm.avatar_url,
              isCurrentUser: false,
            }));
        }

        setTeamMembers(members);
        lastFetchTimeRef.current = Date.now();
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Error fetching team members:', error);
        // Don't show error for team members - just means user doesn't have any
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    },
    [userId, selectedEventId]
  );

  // Fetch team members when component mounts or event changes
  useEffect(() => {
    fetchTeamMembers(true);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTeamMembers]);

  // Set default selection to current user if no contact person selected
  useEffect(() => {
    if (!selectedContactPersonId) {
      onSelect(currentUser);
    }
  }, []);

  const handleSelectChange = (value: string) => {
    if (value === userId) {
      onSelect(currentUser);
    } else {
      const selectedMember = teamMembers.find(m => m.id === value);
      if (selectedMember) {
        onSelect(selectedMember);
      }
    }
  };

  // Find the currently selected contact person
  const selectedPerson =
    selectedContactPersonId === userId
      ? currentUser
      : teamMembers.find(m => m.id === selectedContactPersonId) || currentUser;

  // Combine current user with team members for the dropdown
  const allOptions = [currentUser, ...teamMembers];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-gray-600" />
        <Label className="text-lg font-medium">Contact Person</Label>
      </div>

      <Card className="border-gray-200">
        <CardContent className="py-4">
          {/* Selected Contact Person Display */}
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-12 w-12">
              {selectedPerson.avatar_url ? (
                <AvatarImage
                  src={selectedPerson.avatar_url}
                  alt={selectedPerson.name}
                />
              ) : null}
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {getInitials(selectedPerson.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">
                {selectedPerson.name}
                {selectedPerson.isCurrentUser && (
                  <span className="ml-2 text-sm text-gray-500">(You)</span>
                )}
              </p>
              <p className="text-sm text-gray-500">{selectedPerson.email}</p>
              {selectedPerson.phone && (
                <p className="text-sm text-gray-500">{selectedPerson.phone}</p>
              )}
            </div>
          </div>

          {/* Team Member Selector - only show if there are team members */}
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading team members...</span>
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : teamMembers.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">
                {selectedEventId
                  ? 'Select a team member linked to this event'
                  : 'Or select a team member'}
              </Label>
              <Select
                value={selectedContactPersonId || userId}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select contact person" />
                </SelectTrigger>
                <SelectContent>
                  {allOptions.map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {person.avatar_url ? (
                            <AvatarImage
                              src={person.avatar_url}
                              alt={person.name}
                            />
                          ) : null}
                          <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                            {getInitials(person.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{person.name}</span>
                        {person.isCurrentUser && (
                          <span className="text-gray-400 text-sm">(You)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {selectedEventId
                ? 'No other team members are linked to this event.'
                : 'Add team members in your profile to assign them as contact persons.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
