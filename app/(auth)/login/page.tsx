'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/features/auth/LoginForm';
import AuthGuard from '@/components/features/auth/AuthGuard';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const handleSuccess = (user: any) => {
    // Redirect based on user role
    if (user?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      // Both contractors and event managers use the main dashboard
      router.push('/dashboard');
    }
  };

  const handleError = (error: string) => {
    console.error('Login error:', error);
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Event Pros NZ</h1>
            <p className="mt-2 text-sm text-gray-600">
              New Zealand&apos;s Event Ecosystem
            </p>
          </div>

          <LoginForm onSuccess={handleSuccess} onError={handleError} />
        </div>
      </div>
    </AuthGuard>
  );
}
