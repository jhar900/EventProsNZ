'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

const registerSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    role: z.enum(['event_manager', 'contractor'], {
      message: 'Please select a role',
    }),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    terms: z
      .boolean()
      .refine(val => val === true, 'You must accept the terms and conditions'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  onSignInClick?: () => void;
}

export default function RegisterForm({
  onSuccess,
  onError,
  onSignInClick,
}: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: allows cookies to be set and sent
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: data.role,
          first_name: data.first_name,
          last_name: data.last_name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show more specific error messages based on the error code
        let errorMessage = result.error || 'Registration failed';

        if (result.code === 'CONFIG_ERROR') {
          errorMessage = 'Server configuration error. Please contact support.';
        } else if (result.code === 'DB_CONNECTION_ERROR') {
          errorMessage = 'Database connection failed. Please try again later.';
        } else if (result.code === 'AUTH_ERROR') {
          errorMessage =
            result.details ||
            'Authentication failed. Please check your information.';
        } else if (result.details) {
          errorMessage = result.details;
        }

        throw new Error(errorMessage);
      }

      // Store user data in localStorage for persistence (so AuthGuard can find it immediately)
      if (result.user) {
        localStorage.setItem('user_data', JSON.stringify(result.user));
        localStorage.setItem('is_authenticated', 'true');
      }

      // Refresh the Supabase session to pick up cookies set by the server
      // The cookies are httpOnly, so we need to make a request to refresh the session
      try {
        const { supabase } = await import('@/lib/supabase/client');
        // Try to refresh the session - this will read cookies from the server
        await supabase.auth.refreshSession();
      } catch (refreshError) {
        console.warn(
          'Failed to refresh session after registration:',
          refreshError
        );
        // Don't fail registration if session refresh fails - cookies should still work for API routes
      }

      onSuccess?.(result.user);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg px-8 pb-8 mb-2">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Create Account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name
              </label>
              <input
                {...register('first_name')}
                type="text"
                id="first_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="First name"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name
              </label>
              <input
                {...register('last_name')}
                type="text"
                id="last_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Last name"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Type
            </label>
            <select
              {...register('role')}
              id="role"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select account type</option>
              <option value="event_manager">Event Manager</option>
              <option value="contractor">Contractor</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {selectedRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                {selectedRole === 'event_manager'
                  ? 'As an Event Manager, you can create and manage events, post jobs, and connect with contractors.'
                  : 'As a Contractor, you can create a business profile, offer services, and apply for jobs.'}
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Create a password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-start">
              <input
                {...register('terms')}
                type="checkbox"
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600">
                {errors.terms.message}
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleSignInButton
              onSuccess={onSuccess || (() => {})}
              onError={onError || (() => {})}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            {onSignInClick ? (
              <button
                type="button"
                onClick={onSignInClick}
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Sign in
              </button>
            ) : (
              <Link
                href="/login"
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Sign in
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// Google Sign In Button Component (reused from LoginForm)
function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}) {
  // Get role from form context or default to event_manager
  // For registration, we might want to show a role selector first
  const [selectedRole, setSelectedRole] = useState<
    'event_manager' | 'contractor'
  >('event_manager');

  const { signInWithGoogle, isLoading, isGoogleLoaded } = useGoogleAuth({
    onSuccess: async () => {
      // The hook handles the API call and stores user data
      // Fetch the user data from localStorage
      const storedUserData = localStorage.getItem('user_data');
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          onSuccess?.(userData);
        } catch (err) {
          onError?.('Failed to parse user data');
        }
      } else {
        onError?.('User data not found after sign-in');
      }
    },
    ...(onError && { onError }),
    role: selectedRole,
  });

  return (
    <div className="space-y-2">
      {/* Role selector for new registrations */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSelectedRole('event_manager')}
          className={`flex-1 px-3 py-1 text-xs rounded border ${
            selectedRole === 'event_manager'
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-gray-50 border-gray-300 text-gray-700'
          }`}
        >
          Event Manager
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('contractor')}
          className={`flex-1 px-3 py-1 text-xs rounded border ${
            selectedRole === 'contractor'
              ? 'bg-orange-50 border-orange-300 text-orange-700'
              : 'bg-gray-50 border-gray-300 text-gray-700'
          }`}
        >
          Contractor
        </button>
      </div>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoading || !isGoogleLoaded}
        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading ? 'Signing up...' : 'Continue with Google'}
      </button>
    </div>
  );
}
