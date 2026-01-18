'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Briefcase } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface InvitationDetails {
  eventManagerName: string | null;
  eventManagerAvatar: string | null;
  eventManagerCompanyName: string | null;
  role: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export function TeamInvitationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] =
    useState<InvitationDetails | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const fetchInvitationDetails = async (token: string) => {
    setIsLoadingDetails(true);
    setError(null);

    try {
      const response = await fetch(`/api/team-members/invite/${token}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitation details');
      }

      const data = await response.json();

      // If user has already accepted, close modal and show message
      if (data.alreadyAccepted) {
        setError('You have already accepted this invitation.');
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          localStorage.removeItem('pending-team-invitation-token');
          window.location.reload();
        }, 2000);
        return;
      }

      if (data.invitation) {
        setInvitationDetails({
          eventManagerName: data.invitation.eventManagerName,
          eventManagerAvatar: data.invitation.eventManagerAvatar || null,
          eventManagerCompanyName:
            data.invitation.eventManagerCompanyName || null,
          role: data.invitation.role,
          email: data.invitation.email,
          firstName: data.invitation.firstName,
          lastName: data.invitation.lastName,
        });
      }
    } catch (err) {
      console.error('Error fetching invitation details:', err);
      // Don't set error state here - we'll still show the modal, just without details
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const checkForPendingInvitation = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch('/api/team-members/pending', {
        credentials: 'include',
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      // If user has already accepted, don't show the modal
      if (data.alreadyAccepted) {
        console.log(
          '[TeamInvitationModal] User has already accepted invitation, not showing modal'
        );
        // Clear any existing token
        localStorage.removeItem('pending-team-invitation-token');
        return;
      }

      if (data.hasPendingInvitation && data.invitationToken) {
        // Check if we already have this token in localStorage
        const existingToken = localStorage.getItem(
          'pending-team-invitation-token'
        );

        // Only set if we don't already have it (to avoid overwriting signup flow)
        if (!existingToken) {
          localStorage.setItem(
            'pending-team-invitation-token',
            data.invitationToken
          );
          setInvitationToken(data.invitationToken);
          setIsOpen(true);
          fetchInvitationDetails(data.invitationToken);
          console.log(
            '[TeamInvitationModal] Found pending invitation for logged-in user'
          );
        }
      }
    } catch (err) {
      console.error('Error checking for pending invitation:', err);
      // Don't show error to user - this is a background check
    }
  };

  const checkForInvitation = () => {
    if (typeof window === 'undefined') return;

    // Don't check if modal is already open or if we just accepted/declined
    if (isOpen || success) return;

    const token = localStorage.getItem('pending-team-invitation-token');
    console.log(
      '[TeamInvitationModal] Checking for invitation token:',
      token ? 'Found' : 'Not found'
    );

    if (token) {
      setInvitationToken(token);
      setIsOpen(true);
      // Fetch invitation details when modal opens
      fetchInvitationDetails(token);
      console.log('[TeamInvitationModal] Opening modal with token');
    } else if (user?.email && !success) {
      // If no token in localStorage but user is logged in, check for pending invitations
      // Only check if we haven't just accepted/declined
      checkForPendingInvitation();
    }
  };

  useEffect(() => {
    // Don't check if we just accepted/declined
    if (success) return;

    // Check immediately
    checkForInvitation();

    // Also check after short delays in case localStorage wasn't ready or user just navigated
    const timeouts = [
      setTimeout(() => !success && checkForInvitation(), 500),
      setTimeout(() => !success && checkForInvitation(), 1000),
      setTimeout(() => !success && checkForInvitation(), 2000),
    ];

    // Check when window gains focus (user might have navigated away and back)
    const handleFocus = () => {
      if (!success) checkForInvitation();
    };
    window.addEventListener('focus', handleFocus);

    // Also check periodically (every 2 seconds) for the first 10 seconds
    // This handles cases where the user navigates to dashboard before token is set
    let checkCount = 0;
    const interval = setInterval(() => {
      if (checkCount < 5 && !isOpen && !success) {
        checkForInvitation();
        checkCount++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOpen, user?.email, success]); // Add success to dependencies

  const handleAccept = async () => {
    if (!invitationToken) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/team-members/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: invitationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      // Success - remove token and show success message
      setSuccess(true);
      localStorage.removeItem('pending-team-invitation-token');
      setInvitationToken(null); // Clear the token state

      // Set loading to false before closing to avoid race condition
      setIsLoading(false);

      // Close modal immediately and prevent reopening
      setIsOpen(false);

      // Force a hard refresh after a brief delay to ensure the inviter sees the updated team members table
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to accept invitation'
      );
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!invitationToken) {
      localStorage.removeItem('pending-team-invitation-token');
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/team-members/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: invitationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || 'Failed to decline invitation'
        );
      }

      // Success - remove token first
      localStorage.removeItem('pending-team-invitation-token');

      // Set loading to false before closing to avoid race condition with handleClose
      setIsLoading(false);

      // Close modal immediately
      setIsOpen(false);

      // Refresh the page to update any team member lists
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to decline invitation';
      setError(errorMessage);
      console.error('[TeamInvitationModal] Error declining invitation:', err);

      // Still remove token even if API call fails
      localStorage.removeItem('pending-team-invitation-token');

      // Set loading to false before closing
      setIsLoading(false);

      // Close modal after a short delay to show error message
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 2000);
    }
  };

  const handleClose = () => {
    // Only allow closing if not loading
    if (!isLoading) {
      setIsOpen(false);
      // Clear token when manually closing to prevent reopening
      localStorage.removeItem('pending-team-invitation-token');
    }
  };

  // Debug: Log modal state
  useEffect(() => {
    console.log('[TeamInvitationModal] Modal state:', {
      isOpen,
      hasToken: !!invitationToken,
      token: invitationToken,
    });
  }, [isOpen, invitationToken]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Team Invitation</DialogTitle>
          <DialogDescription>
            You have a pending team invitation. Review the details below and
            decide whether to accept it.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <p className="text-sm font-medium text-gray-900">
              Invitation accepted successfully!
            </p>
          </div>
        ) : (
          <>
            {isLoadingDetails ? (
              <div className="py-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">
                  Loading invitation details...
                </p>
              </div>
            ) : invitationDetails ? (
              <div className="space-y-4 py-4">
                {/* Invited By */}
                {invitationDetails.eventManagerName && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-10 flex items-center justify-center">
                      <Avatar className="h-10 w-10">
                        {invitationDetails.eventManagerAvatar &&
                        invitationDetails.eventManagerAvatar.trim() ? (
                          <AvatarImage
                            src={invitationDetails.eventManagerAvatar}
                            alt={invitationDetails.eventManagerName}
                          />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-semibold">
                          {invitationDetails.eventManagerName
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Invited By
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {invitationDetails.eventManagerName}
                        {invitationDetails.eventManagerCompanyName && (
                          <span className="text-gray-500">
                            {' - '}
                            {invitationDetails.eventManagerCompanyName}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Role */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Role</p>
                    <p className="text-sm text-gray-600 mt-1 capitalize">
                      {invitationDetails.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    By accepting this invitation, you&apos;ll be added to{' '}
                    {invitationDetails.eventManagerName || 'the event manager'}
                    &apos;s team and will be able to collaborate on events.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-sm text-gray-600">
                  Unable to load invitation details. You can still accept or
                  decline the invitation.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-600">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Error</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={isLoading || isLoadingDetails}
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isLoading || isLoadingDetails}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLoading ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
