'use client';

import React, { useState } from 'react';
import { HomepageNavigation } from './HomepageNavigation';
import LoginModal from '@/components/features/auth/LoginModal';
import RegisterModal from '@/components/features/auth/RegisterModal';
import ForgotPasswordModal from '@/components/features/auth/ForgotPasswordModal';

interface HomepageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function HomepageLayout({
  children,
  className = '',
}: HomepageLayoutProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);

  return (
    <div className={className}>
      <HomepageNavigation
        onLoginClick={() => setIsLoginModalOpen(true)}
        onRegisterClick={() => setIsRegisterModalOpen(true)}
      />
      {children}

      {/* Login Modal - rendered outside of navigation */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSignUpClick={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
        onForgotPasswordClick={() => {
          setIsForgotPasswordModalOpen(true);
        }}
      />

      {/* Register Modal - rendered outside of navigation */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSignInClick={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Forgot Password Modal - rendered outside of navigation */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onSignInClick={() => {
          setIsForgotPasswordModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}
