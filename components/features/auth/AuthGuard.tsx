'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/login',
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Show content immediately if we have cached user data
    const cachedUser =
      typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;

    if (cachedUser && requireAuth) {
      // We have cached user, show content immediately
      setIsChecking(false);
    }

    // Don't wait too long - use a timeout to show content faster
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsChecking(false);
      }
    }, 100); // Reduced to 100ms for faster perceived performance

    if (!isLoading) {
      clearTimeout(timeout);

      if (requireAuth && !user) {
        setShouldRedirect(true);
        router.push(redirectTo);
        return;
      }

      if (!requireAuth && user) {
        setShouldRedirect(true);
        router.push('/dashboard');
        return;
      }

      setIsChecking(false);
    }

    return () => clearTimeout(timeout);
  }, [user, isLoading, requireAuth, redirectTo, router]);

  // Show content immediately if we have user data (even if still loading)
  // Only block if we're definitely redirecting
  if (shouldRedirect) {
    return null; // Will redirect
  }

  // Check for cached user data to show content immediately
  const hasCachedUser =
    typeof window !== 'undefined' &&
    localStorage.getItem('user_data') &&
    localStorage.getItem('is_authenticated') === 'true';

  // If we have a user and requireAuth, show content immediately
  if (requireAuth && (user || hasCachedUser) && !isChecking) {
    return <>{children}</>;
  }

  // If we don't require auth and no user, show content immediately
  if (!requireAuth && !user && !isChecking) {
    return <>{children}</>;
  }

  // If we have cached user data, show content immediately (optimistic rendering)
  if (requireAuth && hasCachedUser && isChecking) {
    return <>{children}</>;
  }

  // Show minimal loading state that doesn't block the entire page
  if (isLoading && isChecking && !hasCachedUser) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
        {/* Render children in background so they're ready when auth completes */}
        <div className="opacity-0 pointer-events-none">{children}</div>
      </>
    );
  }

  return <>{children}</>;
}

export { AuthGuard };
export default AuthGuard;
