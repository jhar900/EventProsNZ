'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import AuthGuard from './AuthGuard';

interface OnboardingGuardProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

/**
 * OnboardingGuard ensures users complete their profile before accessing protected routes.
 * It wraps AuthGuard and adds profile completion checking.
 */
function OnboardingGuard({
  children,
  requireOnboarding = true,
}: OnboardingGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { status, isLoading: completionLoading } = useProfileCompletion();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // List of paths that should be excluded from onboarding check
  const excludedPaths = [
    '/onboarding',
    '/login',
    '/register',
    '/api',
    '/_next',
    '/favicon',
  ];

  // Check if current path should be excluded
  const isExcludedPath = excludedPaths.some(path => pathname.startsWith(path));

  useEffect(() => {
    // Skip check if path is excluded or onboarding not required
    if (isExcludedPath || !requireOnboarding) {
      setIsChecking(false);
      return;
    }

    // Wait for both auth and completion status to load
    if (authLoading || completionLoading) {
      return;
    }

    // If no user, let AuthGuard handle it
    if (!user) {
      setIsChecking(false);
      return;
    }

    // Check if profile is complete
    // If status is null and we're not loading, assume incomplete (will redirect)
    // Admins can bypass onboarding requirement
    if (
      user &&
      user.role !== 'admin' &&
      !completionLoading &&
      (!status || !status.isComplete)
    ) {
      // Determine the correct onboarding route based on user role
      let onboardingRoute = '/onboarding/event-manager';
      if (user.role === 'contractor') {
        onboardingRoute = '/onboarding/contractor';
      } else if (user.role === 'event_manager') {
        onboardingRoute = '/onboarding/event-manager';
      }

      // Only redirect if we're not already on an onboarding page
      if (!pathname.startsWith('/onboarding')) {
        setShouldRedirect(true);
        router.push(onboardingRoute);
        return;
      }
    }

    // If we have a user and status is complete (or admin), allow access
    if (user && (status?.isComplete || user.role === 'admin')) {
      setIsChecking(false);
      return;
    }

    // If no status yet but user exists and we're still loading, keep checking
    if (user && !status && completionLoading) {
      return;
    }

    setIsChecking(false);
  }, [
    user,
    status,
    authLoading,
    completionLoading,
    requireOnboarding,
    isExcludedPath,
    pathname,
    router,
  ]);

  // Show loading state while checking (only after mount to prevent hydration mismatch)
  if (!mounted) {
    // Return consistent loading state for SSR
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (isChecking && !isExcludedPath && requireOnboarding) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Checking profile...</span>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // If redirecting, show nothing (redirect will happen)
  if (shouldRedirect) {
    return null;
  }

  // Wrap children with AuthGuard to ensure authentication
  return <AuthGuard>{children}</AuthGuard>;
}

export { OnboardingGuard };
export default OnboardingGuard;
