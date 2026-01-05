'use client';

import React, { useState, createContext, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { HomepageNavigation } from './HomepageNavigation';
import LoginModal from '@/components/features/auth/LoginModal';
import RegisterModal from '@/components/features/auth/RegisterModal';
import ForgotPasswordModal from '@/components/features/auth/ForgotPasswordModal';
import ResetPasswordModal from '@/components/features/auth/ResetPasswordModal';

interface HomepageModalContextType {
  onRegisterClick: (role?: 'event_manager' | 'contractor') => void;
  onLoginClick: () => void;
}

export const HomepageModalContext =
  createContext<HomepageModalContextType | null>(null);

interface HomepageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function HomepageLayoutContent({
  children,
  className = '',
}: HomepageLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(
    null
  );
  const [registerModalRole, setRegisterModalRole] = useState<
    'event_manager' | 'contractor' | undefined
  >(undefined);

  // Check for reset password token in URL on mount
  useEffect(() => {
    const checkForRecoveryLink = async () => {
      // Check query params for token
      const token = searchParams.get('token');

      // Also check URL hash for Supabase recovery tokens
      // Supabase recovery links often have tokens in the hash like: #access_token=...&type=recovery
      let hashType: string | null = null;
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1));
          hashType = hashParams.get('type');
        }
      }

      // Check if this is a recovery link (type=recovery in hash or token in query)
      const isRecoveryLink = hashType === 'recovery' || token;

      if (isRecoveryLink) {
        // Wait a moment for Supabase to process the hash tokens (if present)
        // Supabase client with detectSessionInUrl will automatically create a session
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if Supabase has created a session from the recovery link
        try {
          const { supabase } = await import('@/lib/supabase/client');
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData?.session || token) {
            // Session exists from recovery link, or we have a token
            // Use token if available, otherwise use 'recovery' as placeholder
            setResetPasswordToken(token || 'recovery');
            setIsResetPasswordModalOpen(true);

            // Clean up URL - remove token from query params
            if (token) {
              const newSearchParams = new URLSearchParams(
                searchParams.toString()
              );
              newSearchParams.delete('token');
              const newSearch = newSearchParams.toString();
              const newUrl = newSearch
                ? `${window.location.pathname}?${newSearch}`
                : window.location.pathname;
              router.replace(newUrl, { scroll: false });
            }

            // Clean up hash if present (Supabase will have processed it by now)
            if (hashType === 'recovery' && typeof window !== 'undefined') {
              setTimeout(() => {
                window.history.replaceState(
                  null,
                  '',
                  window.location.pathname +
                    (searchParams.toString()
                      ? `?${searchParams.toString()}`
                      : '')
                );
              }, 1000);
            }
          }
        } catch (err) {
          console.error(
            '[HomepageLayout] Error checking recovery session:',
            err
          );
        }
      }
    };

    checkForRecoveryLink();
  }, [searchParams, router]);

  const handleRegisterClick = (role?: 'event_manager' | 'contractor') => {
    setRegisterModalRole(role);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterModalClose = () => {
    setIsRegisterModalOpen(false);
    setRegisterModalRole(undefined);
  };

  const modalContextValue: HomepageModalContextType = {
    onRegisterClick: handleRegisterClick,
    onLoginClick: () => setIsLoginModalOpen(true),
  };

  return (
    <HomepageModalContext.Provider value={modalContextValue}>
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
          onClose={handleRegisterModalClose}
          onSignInClick={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
          initialRole={registerModalRole}
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

        {/* Reset Password Modal - rendered outside of navigation */}
        {resetPasswordToken && (
          <ResetPasswordModal
            isOpen={isResetPasswordModalOpen}
            onClose={() => {
              setIsResetPasswordModalOpen(false);
              setResetPasswordToken(null);
            }}
            token={resetPasswordToken}
            onSignInClick={() => {
              setIsResetPasswordModalOpen(false);
              setResetPasswordToken(null);
              setIsLoginModalOpen(true);
            }}
          />
        )}
      </div>
    </HomepageModalContext.Provider>
  );
}

// Wrapper component with Suspense boundary
export function HomepageLayout({
  children,
  className = '',
}: HomepageLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className={className}>
          <HomepageNavigation
            onLoginClick={() => {}}
            onRegisterClick={() => {}}
          />
          {children}
        </div>
      }
    >
      <HomepageLayoutContent className={className}>
        {children}
      </HomepageLayoutContent>
    </Suspense>
  );
}
