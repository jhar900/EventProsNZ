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
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before checking localStorage (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only check localStorage after component is mounted (prevents hydration mismatch)
    if (!mounted) return;

    // Show content immediately if we have cached user data
    const cachedUser = localStorage.getItem('user_data');

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
  }, [user, isLoading, requireAuth, redirectTo, router, mounted]);

  // Show content immediately if we have user data (even if still loading)
  // Only block if we're definitely redirecting
  if (shouldRedirect) {
    return null; // Will redirect
  }

  // Check for cached user data to show content immediately (only after mount)
  const hasCachedUser =
    mounted &&
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

  // Show content immediately with subtle loading indicator instead of blocking
  if (isLoading && isChecking && !hasCachedUser) {
    return (
      <div className="relative">
        {/* Subtle loading indicator at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 z-50">
          <div
            className="h-full bg-blue-600 animate-pulse"
            style={{ width: '30%' }}
          />
        </div>
        {/* Show content immediately - navigation feels instant */}
        <div className="opacity-100">{children}</div>
      </div>
    );
  }

  return <>{children}</>;
}

export { AuthGuard };
export default AuthGuard;
