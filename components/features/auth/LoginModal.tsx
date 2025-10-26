'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/features/auth/LoginForm';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleSuccess = (user: any) => {
    // Close the modal first
    onClose();

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
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

            <LoginForm onSuccess={handleSuccess} onError={handleError} />
          </div>
        </div>
      </div>
    </div>
  );
}
