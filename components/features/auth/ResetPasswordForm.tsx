'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onSignInClick?: () => void;
}

export default function ResetPasswordForm({
  token,
  onSuccess,
  onError,
  onSignInClick,
}: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  const password = watch('password');

  // Validate token on mount and check for Supabase session
  useEffect(() => {
    const checkSession = async () => {
      if (!token || token === 'recovery') {
        // If token is 'recovery', check if Supabase has processed the hash tokens
        // Supabase client with detectSessionInUrl should have created a session
        try {
          const { supabase } = await import('@/lib/supabase/client');
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData?.session) {
            // Session exists from recovery link - token is valid
            setTokenValid(true);
            return;
          }
        } catch (err) {
          console.error('[Reset Password] Error checking session:', err);
        }
      }

      if (!token || token === 'recovery') {
        // Give Supabase a moment to process the hash tokens
        setTimeout(async () => {
          try {
            const { supabase } = await import('@/lib/supabase/client');
            const { data: sessionData } = await supabase.auth.getSession();

            if (sessionData?.session) {
              setTokenValid(true);
            } else {
              setTokenValid(false);
              setError('Invalid or expired reset token');
            }
          } catch (err) {
            setTokenValid(false);
            setError('Invalid or expired reset token');
          }
        }, 500);
        return;
      }

      // Token exists - validation will happen when form is submitted
      setTokenValid(true);
    };

    checkSession();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Import Supabase client
      const { supabase } = await import('@/lib/supabase/client');

      // First, try to exchange the recovery token for a session
      // Supabase recovery links typically have tokens in the URL hash
      // We need to check if there's a session from the recovery link
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      // If we have a session from the recovery link, update the password
      if (sessionData?.session) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.password,
        });

        if (updateError) {
          throw new Error(updateError.message || 'Failed to update password');
        }

        setIsSuccess(true);
        onSuccess?.();
        return;
      }

      // If no session, try to verify the token and create a session
      // The token might be in the hash or as a query parameter
      // Try verifyOtp first
      try {
        const { data: verifyData, error: verifyError } =
          await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });

        if (verifyError) {
          throw verifyError;
        }

        // If verification succeeded, we should have a session now
        // Update the password
        if (verifyData?.user) {
          const { error: updateError } = await supabase.auth.updateUser({
            password: data.password,
          });

          if (updateError) {
            throw new Error(updateError.message || 'Failed to update password');
          }

          setIsSuccess(true);
          onSuccess?.();
          return;
        }
      } catch (verifyErr: any) {
        // If verifyOtp fails, the token might be in a different format
        // Try using the API route as fallback
        console.warn(
          '[Reset Password] Verify OTP failed, trying API route:',
          verifyErr
        );
      }

      // Fallback: Use API route if client-side methods don't work
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update password');
      }

      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update password';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg px-8 pt-6 pb-8 mb-2">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request
              a new password reset link.
            </p>
            {onSignInClick ? (
              <button
                onClick={onSignInClick}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Back to Sign In
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg px-8 pt-6 pb-8 mb-2">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Password Updated Successfully
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. You can now use your
              new password to sign in.
            </p>
            {onSignInClick ? (
              <button
                onClick={onSignInClick}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Sign In
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg px-8 pb-8 mb-2">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Reset Your Password
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your new password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
            {password && (
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and a
                number
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              id="confirmPassword"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
