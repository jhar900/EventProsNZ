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
  const {
    status,
    isLoading: completionLoading,
    error: completionError,
  } = useProfileCompletion();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for cached completion status to show content immediately
  const getCachedCompletionStatus = (): boolean | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('profile_completion_status');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid (less than 5 minutes old)
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed.isComplete;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  };

  // Cache completion status when we get it
  useEffect(() => {
    if (status) {
      try {
        localStorage.setItem(
          'profile_completion_status',
          JSON.stringify({
            isComplete: status.isComplete,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        // Ignore cache errors
      }
    }
  }, [status]);

  // List of paths that should be excluded from onboarding check
  const excludedPaths = [
    '/onboarding',
    '/login',
    '/register',
    '/api',
    '/_next',
    '/favicon',
    '/events', // Allow access to events pages even if onboarding incomplete
  ];

  // Check if current path should be excluded
  const isExcludedPath = excludedPaths.some(path => pathname.startsWith(path));

  useEffect(() => {
    // Skip check if path is excluded or onboarding not required
    if (isExcludedPath || !requireOnboarding) {
      setIsChecking(false);
      return;
    }

    // Check for cached completion status - if we have it, show content immediately
    const cachedIsComplete = getCachedCompletionStatus();
    if (cachedIsComplete !== null && user) {
      // We have cached data, show content immediately
      // Only redirect if cached status says incomplete
      if (user.role !== 'admin' && !cachedIsComplete) {
        let onboardingRoute = '/onboarding/event-manager';
        if (user.role === 'contractor') {
          onboardingRoute = '/onboarding/contractor';
        } else if (user.role === 'event_manager') {
          onboardingRoute = '/onboarding/event-manager';
        }
        if (!pathname.startsWith('/onboarding')) {
          setShouldRedirect(true);
          router.push(onboardingRoute);
          return;
        }
      }
      setIsChecking(false);
      // Still fetch fresh data in background, but don't block UI
      return;
    }

    // If no cached data, wait for auth but don't wait too long for completion
    if (authLoading) {
      return;
    }

    // Add very short timeout to prevent blocking - show content immediately
    const timeout = setTimeout(() => {
      if (isChecking) {
        // If we've been checking for more than 200ms, allow access
        // This makes navigation feel instant
        setIsChecking(false);
      }
    }, 200);

    // Wait for completion status, but with very short timeout
    if (completionLoading) {
      return () => clearTimeout(timeout);
    }

    // If no user, let AuthGuard handle it
    if (!user) {
      setIsChecking(false);
      return () => clearTimeout(timeout);
    }

    // If there's an error fetching completion status, don't redirect
    // This prevents redirects when the API is temporarily unavailable
    // Only redirect if we have a status and it's incomplete
    if (completionError) {
      console.warn(
        'Error fetching profile completion status:',
        completionError
      );
      // Allow access if there's an error - better UX than blocking users
      setIsChecking(false);
      return () => clearTimeout(timeout);
    }

    // Check if profile is complete
    // Only redirect if we have a status and it's confirmed incomplete
    // Don't redirect if status is null (might be an error, not incomplete)
    // Admins can bypass onboarding requirement
    if (
      user &&
      user.role !== 'admin' &&
      !completionLoading &&
      status && // Only redirect if we have a status (not null)
      !status.isComplete
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
        return () => clearTimeout(timeout);
      }
    }

    // If we have a user and status is complete (or admin), allow access
    if (user && (status?.isComplete || user.role === 'admin')) {
      setIsChecking(false);
      return () => clearTimeout(timeout);
    }

    // If no status yet but user exists and we're still loading, allow access immediately
    // Don't block navigation - show content and check in background
    if (user && !status && completionLoading) {
      setIsChecking(false); // Allow access immediately
      return () => clearTimeout(timeout);
    }

    // If no status and not loading (but no error), allow access to prevent blocking
    // This handles edge cases where status fetch fails silently
    if (user && !status && !completionLoading && !completionError) {
      setIsChecking(false);
      return () => clearTimeout(timeout);
    }

    // Default: allow access (don't block) - navigation should always feel instant
    setIsChecking(false);
    return () => clearTimeout(timeout);
  }, [
    user,
    status,
    authLoading,
    completionLoading,
    completionError,
    requireOnboarding,
    isExcludedPath,
    pathname,
    router,
  ]);

  // Show loading state while checking (only after mount to prevent hydration mismatch)
  if (!mounted) {
    // Return consistent loading state for SSR - but show content optimistically
    return (
      <AuthGuard>
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 z-50">
            <div
              className="h-full bg-blue-600 animate-pulse"
              style={{ width: '30%' }}
            />
          </div>
          {children}
        </div>
      </AuthGuard>
    );
  }

  // Show content immediately - never block navigation
  // Only redirect if we're definitely redirecting
  if (shouldRedirect) {
    return null;
  }

  // Always show content immediately with subtle loading indicator if checking
  // This makes navigation feel instant
  const cachedIsComplete = getCachedCompletionStatus();
  const isCheckingWithNoCache =
    isChecking &&
    !isExcludedPath &&
    requireOnboarding &&
    cachedIsComplete === null;

  if (isCheckingWithNoCache) {
    // Show children immediately with a subtle top loading bar
    return (
      <AuthGuard>
        <div className="relative">
          {/* Subtle loading indicator at top - non-blocking */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200 z-50">
            <div
              className="h-full bg-blue-600 animate-pulse"
              style={{ width: '30%' }}
            />
          </div>
          {/* Show content immediately - navigation feels instant */}
          <div className="opacity-100">{children}</div>
        </div>
      </AuthGuard>
    );
  }

  // Wrap children with AuthGuard to ensure authentication
  return <AuthGuard>{children}</AuthGuard>;
}

export { OnboardingGuard };
export default OnboardingGuard;
