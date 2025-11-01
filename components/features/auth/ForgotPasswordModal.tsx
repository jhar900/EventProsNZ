'use client';

import React from 'react';
import ForgotPasswordForm from '@/components/features/auth/ForgotPasswordForm';
import { X } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInClick?: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onSignInClick,
}: ForgotPasswordModalProps) {
  const handleSuccess = () => {
    // Keep modal open to show success message
    // Form component will handle displaying success
  };

  const handleError = (error: string) => {
    console.error('Forgot password error:', error);
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

            <ForgotPasswordForm
              onSuccess={handleSuccess}
              onError={handleError}
              onSignInClick={onSignInClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
