'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/features/auth/LoginForm';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectOnSuccess?: boolean;
  onSignUpClick?: () => void;
  onForgotPasswordClick?: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  redirectOnSuccess = true,
  onSignUpClick,
  onForgotPasswordClick,
}: LoginModalProps) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const handleSuccess = async (user: any) => {
    // Refresh user data
    await refreshUser();

    // Close the modal first
    onClose();

    // Only redirect if redirectOnSuccess is true
    if (redirectOnSuccess) {
      // Redirect based on user role
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        // Both contractors and event managers use the main dashboard
        router.push('/dashboard');
      }
    }
  };

  const handleError = (error: string) => {
    console.error('Login error:', error);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-300 ease-in-out"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <img
                  src="/logo.png"
                  alt="Event Pros NZ"
                  className="h-16 w-16 object-contain"
                />
              </div>
            </div>

            <LoginForm
              onSuccess={handleSuccess}
              onError={handleError}
              onSignUpClick={onSignUpClick}
              onForgotPasswordClick={() => {
                onClose(); // Close login modal
                onForgotPasswordClick?.(); // Open forgot password modal via parent
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
