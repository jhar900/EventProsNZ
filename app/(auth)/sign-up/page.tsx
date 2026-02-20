'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/features/auth/LoginForm';
import RegisterForm from '@/components/features/auth/RegisterForm';
import AuthGuard from '@/components/features/auth/AuthGuard';

export default function SignUpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in, redirect to dashboard
  if (user) {
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
    return null;
  }

  const handleLoginSuccess = (loggedInUser: any) => {
    if (loggedInUser?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSignupSuccess = (newUser: any) => {
    if (newUser?.role === 'contractor') {
      router.push('/onboarding/contractor');
    } else {
      router.push('/onboarding/event-manager');
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
          </div>
        </div>

        {/* Content - Two column layout */}
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Welcome text */}
            <div className="text-left space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Welcome to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                  Event Pros NZ
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed">
                New Zealand&apos;s Event Ecosystem
              </p>
              <p className="text-lg text-gray-600">
                {mode === 'login'
                  ? 'Sign in to manage your events, connect with professionals, and grow your business.'
                  : 'Create your account to start managing events and connecting with top event professionals across New Zealand.'}
              </p>
            </div>

            {/* Right side - Form */}
            <div className="w-full">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-orange-100">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <img
                    src="/logo.png"
                    alt="Event Pros NZ"
                    className="h-16 sm:h-20 lg:h-20 w-auto object-contain"
                  />
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {mode === 'login' ? (
                  <>
                    <LoginForm
                      onSuccess={handleLoginSuccess}
                      onError={err => setError(err)}
                      onSignUpClick={() => setMode('signup')}
                    />
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('signup')}
                          className="font-medium text-orange-600 hover:text-orange-500"
                        >
                          Create one here
                        </button>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <RegisterForm
                      onSuccess={handleSignupSuccess}
                      onError={err => setError(err)}
                      onSignInClick={() => setMode('login')}
                    />
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          className="font-medium text-orange-600 hover:text-orange-500"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
