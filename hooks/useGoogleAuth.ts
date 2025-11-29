'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: 'popup' | 'redirect';
            callback: (response: { code: string }) => void;
          }) => {
            requestCode: () => void;
          };
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface UseGoogleAuthOptions {
  onSuccess?: (idToken: string, role?: 'event_manager' | 'contractor') => void;
  onError?: (error: string) => void;
  role?: 'event_manager' | 'contractor';
}

/**
 * Hook for Google OAuth authentication using Google Identity Services
 * This uses the ID token flow which works with Supabase's signInWithIdToken
 */
export function useGoogleAuth({
  onSuccess,
  onError,
  role = 'event_manager',
}: UseGoogleAuthOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.google?.accounts?.id) {
      setIsGoogleLoaded(true);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector(
      'script[src*="accounts.google.com/gsi/client"]'
    );
    if (existingScript) {
      // Wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          setIsGoogleLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleLoaded(true);
    };
    script.onerror = () => {
      onError?.('Failed to load Google Identity Services');
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount as it might be used by other components
    };
  }, [onError]);

  const signInWithGoogle = async () => {
    if (!isGoogleLoaded || !window.google?.accounts?.id) {
      onError?.('Google Identity Services not loaded. Please try again.');
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError?.(
        'Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Log the current origin for debugging
      console.log('Google OAuth - Current origin:', window.location.origin);
      console.log('Google OAuth - Client ID:', clientId);

      // Initialize Google Identity Services with proper configuration
      // This avoids FedCM/CORS issues by using the button-based flow
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async response => {
          try {
            if (!response.credential) {
              throw new Error('No credential received from Google');
            }

            // Send ID token to backend
            // Include credentials to ensure cookies are set and sent
            const apiResponse = await fetch('/api/auth/google', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Important: allows cookies to be set and sent
              body: JSON.stringify({
                id_token: response.credential,
                role,
              }),
            });

            const result = await apiResponse.json();

            if (!apiResponse.ok) {
              throw new Error(result.error || 'Google sign-in failed');
            }

            // Store user data in localStorage
            if (result.user) {
              localStorage.setItem('user_data', JSON.stringify(result.user));
              localStorage.setItem('is_authenticated', 'true');
            }

            // Wait for cookies to be set by the server and verify session is established
            // The cookies are httpOnly, so we need to make a request to read them
            // Use getSession() which reads from cookies without trying to refresh
            let sessionEstablished = false;
            let attempts = 0;
            const maxAttempts = 5;

            while (!sessionEstablished && attempts < maxAttempts) {
              try {
                const { supabase } = await import('@/lib/supabase/client');

                // Use getSession() - it reads from cookies without auto-refreshing
                const { data: sessionData, error: sessionError } =
                  await supabase.auth.getSession();

                if (sessionData.session && !sessionError) {
                  sessionEstablished = true;
                  break;
                }

                // Wait a bit for cookies to propagate
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
              } catch (error) {
                console.warn(
                  `Session check attempt ${attempts + 1} failed:`,
                  error
                );
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
              }
            }

            if (!sessionEstablished) {
              console.warn(
                'Session not fully established after Google login, but proceeding'
              );
            }

            // Call success callback with ID token and user data
            onSuccess?.(response.credential, role);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Google sign-in failed';
            onError?.(errorMessage);
          } finally {
            setIsLoading(false);
          }
        },
        // Disable FedCM to avoid CORS issues - this is the key fix
        use_fedcm_for_prompt: false,
      });

      // Use the button click flow instead of prompt() to avoid FedCM issues
      // This creates a temporary invisible button and clicks it programmatically
      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-temp-container';
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '-9999px';
      buttonContainer.style.left = '-9999px';
      document.body.appendChild(buttonContainer);

      // Render the button
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: '250',
      });

      // Wait a moment for button to render, then click it
      setTimeout(() => {
        const button = buttonContainer.querySelector(
          'div[role="button"]'
        ) as HTMLElement;
        if (button) {
          button.click();
        } else {
          // Fallback: try prompt() with FedCM disabled
          try {
            window.google.accounts.id.prompt();
          } catch (promptError) {
            // Clean up and show error
            if (document.body.contains(buttonContainer)) {
              document.body.removeChild(buttonContainer);
            }
            setIsLoading(false);
            onError?.(
              'Failed to initialize Google sign-in. Please check your Google OAuth configuration.'
            );
          }
        }
      }, 200);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to initialize Google sign-in';
      onError?.(errorMessage);
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    isLoading,
    isGoogleLoaded,
  };
}
