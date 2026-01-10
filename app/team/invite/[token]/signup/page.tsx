'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RegisterForm from '@/components/features/auth/RegisterForm';
import AuthGuard from '@/components/features/auth/AuthGuard';
import Link from 'next/link';

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

export default function TeamInviteSignupPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

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

  const validateInvitation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/team-members/invite/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid invitation');
      }

      // If user already exists, redirect to login
      if (data.userExists) {
        router.push(`/team/invite/${token}`);
        return;
      }

      setInvitationData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to validate invitation';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSuccess = async (newUser: any) => {
    if (!invitationData || !token) return;

    // Accept the invitation (link team member relationship)
    await acceptInvitation(token);

    // Set flag in localStorage to indicate user came from team invitation
    if (typeof window !== 'undefined') {
      localStorage.setItem('from-team-invitation', 'true');
    }

    // New users always go to onboarding
    if (newUser?.role === 'contractor') {
      router.push('/onboarding/contractor');
    } else {
      router.push('/onboarding/event-manager');
    }
  };

  const acceptInvitation = async (inviteToken: string) => {
    try {
      const response = await fetch('/api/team-members/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: inviteToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to accept invitation:', error);
        // Don't throw - we'll still redirect, the relationship might already exist
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      // Don't throw - continue with redirect
    }
  };

  if (isLoading) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          {/* Hero background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
            </div>
          </div>
          <div className="relative z-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Validating invitation...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requireAuth={false}>
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          {/* Hero background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
            </div>
          </div>
          <div className="relative z-10 max-w-md w-full space-y-8 text-center px-4">
            <div>
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
            <Link
              href="/login"
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
            >
              Go to Login
            </Link>
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
          </div>
        </div>

        {/* Content - Two column layout */}
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Welcome text */}
            <div className="text-left space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Welcome to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                  Event Pros NZ
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed">
                {invitationData.invitation.eventManagerName ? (
                  <>
                    You&apos;ve been invited by{' '}
                    <strong className="text-orange-600">
                      {invitationData.invitation.eventManagerName}
                    </strong>{' '}
                    to join for the{' '}
                    <strong className="text-orange-600">
                      {invitationData.invitation.role}
                    </strong>{' '}
                    role
                  </>
                ) : (
                  <>
                    You&apos;ve been invited to join as a{' '}
                    <strong className="text-orange-600">
                      {invitationData.invitation.role}
                    </strong>
                  </>
                )}
              </p>
              <p className="text-lg text-gray-600">
                Create your account to get started and begin collaborating on
                amazing events.
              </p>
            </div>

            {/* Right side - Signup form */}
            <div className="w-full">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-orange-100">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <img
                    src="/logo.png"
                    alt="Event Pros NZ"
                    className="h-16 sm:h-20 lg:h-20 w-auto object-contain"
                  />
                </div>

                <RegisterForm
                  onSuccess={handleSignupSuccess}
                  onError={err => setError(err)}
                  initialEmail={invitationData.invitation.email}
                  initialFirstName={invitationData.invitation.firstName}
                  initialLastName={invitationData.invitation.lastName}
                  hideRole={true}
                  hideSignInLink={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
