'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ForgotPasswordForm from '@/components/features/auth/ForgotPasswordForm';
import AuthGuard from '@/components/features/auth/AuthGuard';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // The form will show success message
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

          <ForgotPasswordForm onSuccess={handleSuccess} onError={handleError} />
        </div>
      </div>
    </AuthGuard>
  );
}
