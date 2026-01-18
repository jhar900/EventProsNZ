'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/features/auth/LoginForm';
import AuthGuard from '@/components/features/auth/AuthGuard';

interface InvitationData {
  invitation: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    eventManagerId: string;
    eventManagerName: string | null;
  };
  userExists: boolean;
  isOnboarded: boolean;
  userId: string | null;
}

export default function TeamInvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const { user } = useAuth();

  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  // If user is already logged in and email matches, auto-accept
  useEffect(() => {
    if (
      user &&
      invitationData &&
      user.email === invitationData.invitation.email &&
      !isLoading
    ) {
      // User is already logged in with matching email, accept invitation
      const acceptAndRedirect = async () => {
        const success = await acceptInvitation(token, 3);

        if (!success) {
          setError(
            'Failed to accept invitation. Please try refreshing the page or contact support.'
          );
          return;
        }

        // Set flag in localStorage to indicate user came from team invitation
        if (typeof window !== 'undefined') {
          localStorage.setItem('from-team-invitation', 'true');
        }

        // Check if user needs onboarding
        if (!invitationData.isOnboarded) {
          if (user.role === 'contractor') {
            router.push('/onboarding/contractor');
          } else {
            router.push('/onboarding/event-manager');
          }
        } else {
          router.push('/events');
        }
      };
      acceptAndRedirect();
    }
  }, [user, invitationData, token, isLoading, router]);

  const validateInvitation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/team-members/invite/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid invitation');
      }

      setInvitationData(data);

      // If user doesn't exist, redirect to special signup page
      if (!data.userExists) {
        router.push(`/team/invite/${token}/signup`);
        return;
      }

      // If user exists, show login form (no need to set state, component will render login form)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to validate invitation';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvitation = async (
    inviteToken: string,
    retries: number = 3
  ): Promise<boolean> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Accept Invitation] Attempt ${attempt} of ${retries}...`);
        const response = await fetch('/api/team-members/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token: inviteToken }),
        });

        const data = await response.json();

        if (!response.ok) {
          // If it's a 404 (invitation not found) or 403 (email mismatch), don't retry
          if (response.status === 404 || response.status === 403) {
            console.error(
              `[Accept Invitation] Non-retryable error:`,
              data.error,
              data.details
            );
            return false;
          }

          // For other errors, log and retry if attempts remain
          console.error(
            `[Accept Invitation] Attempt ${attempt} failed:`,
            data.error,
            data.details
          );

          if (attempt < retries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }

          return false;
        }

        console.log(
          `[Accept Invitation] Success on attempt ${attempt}:`,
          data.message
        );
        return true;
      } catch (err) {
        console.error(`[Accept Invitation] Attempt ${attempt} exception:`, err);

        if (attempt < retries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        return false;
      }
    }

    return false;
  };

  const handleLoginSuccess = async (loggedInUser: any) => {
    if (!invitationData || !token) return;

    // Accept the invitation (link team member relationship) with retry
    const success = await acceptInvitation(token, 3);

    if (!success) {
      setError(
        'Login successful, but we had trouble linking your team invitation. Please try refreshing the page or contact support.'
      );
      return;
    }

    // Set flag in localStorage to indicate user came from team invitation
    if (typeof window !== 'undefined') {
      localStorage.setItem('from-team-invitation', 'true');
    }

    // Check if user needs onboarding
    if (!invitationData.isOnboarded) {
      // Redirect to onboarding based on role
      if (loggedInUser?.role === 'contractor') {
        router.push('/onboarding/contractor');
      } else {
        router.push('/onboarding/event-manager');
      }
    } else {
      // User is fully onboarded, go to events page
      router.push('/events');
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Validating invitation...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
          {/* Hero background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
            </div>
          </div>
          <div className="relative z-10 max-w-md w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-orange-100 space-y-8 text-center">
              <div>
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <img
                    src="/logo.png"
                    alt="Event Pros NZ"
                    className="h-16 sm:h-20 lg:h-20 w-auto object-contain"
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Event Pros NZ
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  New Zealand&apos;s Event Ecosystem
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
              >
                Home Page
              </button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!invitationData) {
    return null;
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Event Pros NZ</h1>
            <p className="mt-2 text-sm text-gray-600">
              New Zealand&apos;s Event Ecosystem
            </p>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                {invitationData.invitation.eventManagerName ? (
                  <>
                    You&apos;ve been invited by{' '}
                    <strong>
                      {invitationData.invitation.eventManagerName}
                    </strong>{' '}
                    to join as a{' '}
                    <strong>{invitationData.invitation.role}</strong>
                  </>
                ) : (
                  <>
                    You&apos;ve been invited to join as a{' '}
                    <strong>{invitationData.invitation.role}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <LoginForm
            onSuccess={handleLoginSuccess}
            onError={err => setError(err)}
            onSignUpClick={() => router.push(`/team/invite/${token}/signup`)}
            initialEmail={invitationData.invitation.email}
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push(`/team/invite/${token}/signup`)}
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Create one here
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
