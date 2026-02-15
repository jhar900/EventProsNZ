'use client';

import React, {
  useState,
  createContext,
  useEffect,
  useCallback,
  Suspense,
} from 'react';
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

// Isolated component for useSearchParams - needs Suspense boundary
function SearchParamsHandler({
  onResetPassword,
}: {
  onResetPassword: (token: string) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

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
            onResetPassword(token || 'recovery');

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
  }, [searchParams, router, onResetPassword]);

  return null;
}

export function HomepageLayout({
  children,
  className = '',
}: HomepageLayoutProps) {
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

  const handleRegisterClick = useCallback(
    (role?: 'event_manager' | 'contractor') => {
      setRegisterModalRole(role);
      setIsRegisterModalOpen(true);
    },
    []
  );

  const handleRegisterModalClose = () => {
    setIsRegisterModalOpen(false);
    setRegisterModalRole(undefined);
  };

  const handleResetPassword = useCallback((token: string) => {
    setResetPasswordToken(token);
    setIsResetPasswordModalOpen(true);
  }, []);

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

        {/* Search params handler for reset password - isolated in Suspense */}
        <Suspense fallback={null}>
          <SearchParamsHandler onResetPassword={handleResetPassword} />
        </Suspense>

        {/* Login Modal */}
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

        {/* Register Modal */}
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={handleRegisterModalClose}
          onSignInClick={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
          initialRole={registerModalRole}
        />

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordModalOpen}
          onClose={() => setIsForgotPasswordModalOpen(false)}
          onSignInClick={() => {
            setIsForgotPasswordModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />

        {/* Reset Password Modal */}
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
