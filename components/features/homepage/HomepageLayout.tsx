'use client';

import React, { useState } from 'react';
import { HomepageNavigation } from './HomepageNavigation';
import LoginModal from '@/components/features/auth/LoginModal';

interface HomepageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function HomepageLayout({
  children,
  className = '',
}: HomepageLayoutProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className={className}>
      <HomepageNavigation onLoginClick={() => setIsLoginModalOpen(true)} />
      {children}

      {/* Login Modal - rendered outside of navigation */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
