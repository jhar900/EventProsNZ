'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RegisterForm from '@/components/features/auth/RegisterForm';
import AuthGuard from '@/components/features/auth/AuthGuard';

export default function RegisterPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSuccess = (user: any) => {
    // Redirect based on user role
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (user.role === 'contractor') {
      router.push('/contractor/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleError = (error: string) => {
    };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Event Pros NZ</h1>
            <p className="mt-2 text-sm text-gray-600">
              New Zealand's Event Ecosystem
            </p>
          </div>

          <RegisterForm onSuccess={handleSuccess} onError={handleError} />
        </div>
      </div>
    </AuthGuard>
  );
}
