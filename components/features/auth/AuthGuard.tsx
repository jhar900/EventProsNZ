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

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    if (!requireAuth && user) {
      // If user is authenticated but this route doesn't require auth (like login page)
      router.push('/dashboard');
      return;
    }

    setIsChecking(false);
  }, [user, isLoading, requireAuth, redirectTo, router]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect
  }

  if (!requireAuth && user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

export { AuthGuard };
export default AuthGuard;
