'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading } = useAuth();

  // Check for bypass flag in URL parameters
  const [bypassAuth, setBypassAuth] = React.useState(false);

  React.useEffect(() => {
    // Check URL parameters for bypass
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('bypass') === 'true') {
      setBypassAuth(true);
    }
  }, []);

  // Show loading state with bypass option
  if (isLoading && !bypassAuth) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
          <p className="mt-2 text-sm text-gray-500">
            Debug: isLoading = {isLoading.toString()}
          </p>
          <p className="mt-4 text-sm text-red-500">
            If this loading persists, there may be a Supabase connection issue.
          </p>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Force Reload
            </button>
            <button
              onClick={() => {
                console.log('Bypass button clicked');
                // Use URL parameter bypass
                window.location.href = window.location.href + '?bypass=true';
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Bypass Loading
            </button>
            <button
              onClick={() => {
                console.log('Direct bypass clicked');
                setBypassAuth(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Direct Bypass
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">Event Pros NZ</h1>
        <p className="text-xl text-center mb-8">
          New Zealand&apos;s Event Ecosystem
        </p>

        {user ? (
          <div className="text-center">
            <p className="mb-4 text-green-600 font-semibold">
              Welcome back, {user.profile?.first_name || user.email}!
            </p>
            <p className="mb-4">Role: {user.role}</p>
            <p className="mb-4">
              Status: {user.is_verified ? 'Verified' : 'Pending Verification'}
            </p>
            <div className="space-x-4">
              <Link
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link
                  href="/admin/users"
                  className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                href="/profile"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">🚀 Next.js 14 + Supabase + TypeScript</p>
            <p className="mb-4">✅ Database schema applied</p>
            <p className="mb-4">✅ Authentication system ready</p>
            <p className="mb-4">✅ Vercel deployment ready</p>
            <p className="mb-6 text-green-600 font-semibold">
              Ready for development!
            </p>
            <div className="space-x-4 mb-8">
              <Link
                href="/login"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Register
              </Link>
            </div>
            <div className="space-x-4 mb-8">
              <Link
                href="/demo"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Test External Services
              </Link>
              <Link
                href="/maps-demo"
                className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Maps Demo
              </Link>
            </div>
          </div>
        )}

        {/* View All Pages Section - Show for all users */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            🚀 View All Built Pages
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Explore all the pages and features that have been built for Event
            Pros NZ
          </p>

          <div className="space-y-6">
            {/* Core User Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                👤 Core User Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/dashboard"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Dashboard
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Main user dashboard</p>
                </Link>

                <Link
                  href="/profile"
                  className="group block bg-green-50 hover:bg-green-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👤</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-green-600">
                      Profile
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    User profile management
                  </p>
                </Link>

                <Link
                  href="/profile/edit"
                  className="group block bg-green-50 hover:bg-green-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✏️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-green-600">
                      Edit Profile
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Edit user profile</p>
                </Link>
              </div>
            </div>

            {/* Contractor Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔧 Contractor Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/contractors"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔧</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Contractor Directory
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Browse all contractors
                  </p>
                </Link>

                <Link
                  href="/contractors/search"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔍</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Search Contractors
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Advanced contractor search
                  </p>
                </Link>

                <Link
                  href="/contractors/map"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🗺️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Contractor Map
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Interactive contractor map
                  </p>
                </Link>

                <Link
                  href="/contractors/map/proximity"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📍</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Proximity Search
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Find contractors by location
                  </p>
                </Link>

                <Link
                  href="/contractors/favorites"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">❤️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Favorite Contractors
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your saved contractors
                  </p>
                </Link>
              </div>
            </div>

            {/* Event Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🎉 Event Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/events/create"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✨</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Create Event
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Event creation wizard</p>
                </Link>

                <Link
                  href="/events/create/services"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🤖</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      AI Service Recommendations
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    AI-powered service suggestions
                  </p>
                </Link>

                <Link
                  href="/events/create/budget"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💰</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Event Budget Planning
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Budget planning for events
                  </p>
                </Link>

                <Link
                  href="/events/create/matching"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🎯</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Contractor Matching
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Match contractors to events
                  </p>
                </Link>

                <Link
                  href="/events/templates"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📋</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Event Templates
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pre-built event templates
                  </p>
                </Link>
              </div>
            </div>

            {/* Budget Planning Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💰 Budget Planning Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/budget/analytics"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Budget Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Budget analysis and insights
                  </p>
                </Link>

                <Link
                  href="/budget/recommendations"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💡</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Budget Recommendations
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    AI-powered budget suggestions
                  </p>
                </Link>

                <Link
                  href="/budget/tracking"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📈</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Budget Tracking
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Track budget performance
                  </p>
                </Link>
              </div>
            </div>

            {/* AI Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🤖 AI Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/ai/recommendations"
                  className="group block bg-pink-50 hover:bg-pink-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🎯</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-pink-600">
                      AI Recommendations
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    AI-powered service recommendations
                  </p>
                </Link>

                <Link
                  href="/ai/analytics"
                  className="group block bg-pink-50 hover:bg-pink-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-pink-600">
                      AI Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    AI recommendation analytics
                  </p>
                </Link>

                <Link
                  href="/ai/templates"
                  className="group block bg-pink-50 hover:bg-pink-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📝</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-pink-600">
                      Service Templates
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">AI service templates</p>
                </Link>
              </div>
            </div>

            {/* Matching Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🎯 Matching Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/matching/contractors"
                  className="group block bg-cyan-50 hover:bg-cyan-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔧</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-cyan-600">
                      Contractor Matching
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Match contractors to events
                  </p>
                </Link>

                <Link
                  href="/matching/analytics"
                  className="group block bg-cyan-50 hover:bg-cyan-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-cyan-600">
                      Matching Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Matching performance analytics
                  </p>
                </Link>
              </div>
            </div>

            {/* Authentication Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔐 Authentication Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/login"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔑</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Login
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">User login page</p>
                </Link>

                <Link
                  href="/register"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📝</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Register
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">User registration</p>
                </Link>

                <Link
                  href="/forgot-password"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔒</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Forgot Password
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Password reset</p>
                </Link>
              </div>
            </div>

            {/* Onboarding Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🚀 Onboarding Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/onboarding/contractor"
                  className="group block bg-teal-50 hover:bg-teal-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔧</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      Contractor Onboarding
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Contractor registration flow
                  </p>
                </Link>

                <Link
                  href="/onboarding/event-manager"
                  className="group block bg-teal-50 hover:bg-teal-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🎯</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      Event Manager Onboarding
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Event manager registration
                  </p>
                </Link>

                <Link
                  href="/onboarding/complete"
                  className="group block bg-teal-50 hover:bg-teal-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      Onboarding Complete
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Onboarding completion page
                  </p>
                </Link>

                <Link
                  href="/onboarding/tutorial"
                  className="group block bg-teal-50 hover:bg-teal-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📚</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      Platform Tutorial
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Learn how to use the platform
                  </p>
                </Link>

                <Link
                  href="/onboarding/contractor/submitted"
                  className="group block bg-teal-50 hover:bg-teal-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      Contractor Submitted
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Contractor application submitted
                  </p>
                </Link>

                <Link
                  href="/onboarding/contractor/tutorial"
                  className="group block bg-teal-50 hover:bg-teal-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🎓</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      Contractor Tutorial
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Contractor-specific tutorial
                  </p>
                </Link>
              </div>
            </div>

            {/* Admin Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                👑 Admin Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/admin/dashboard"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Admin Dashboard
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Main admin dashboard</p>
                </Link>

                <Link
                  href="/admin/users"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👥</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      User Management
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Manage all users</p>
                </Link>

                <Link
                  href="/admin/contractors"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔧</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Contractor Management
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Manage contractors</p>
                </Link>

                <Link
                  href="/admin/verification"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Verification System
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    User verification workflow
                  </p>
                </Link>

                <Link
                  href="/admin/analytics"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📈</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Platform analytics</p>
                </Link>

                <Link
                  href="/admin/reports"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📋</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Reports
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">System reports</p>
                </Link>

                <Link
                  href="/admin/content"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📝</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Content Moderation
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Moderate platform content
                  </p>
                </Link>

                <Link
                  href="/admin/system"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">⚙️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      System Health
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">System monitoring</p>
                </Link>

                <Link
                  href="/admin/activity"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      User Activity
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    User activity monitoring
                  </p>
                </Link>

                <Link
                  href="/admin/alerts"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🚨</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      System Alerts
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    System alerts management
                  </p>
                </Link>

                <Link
                  href="/admin/verification/analytics"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📈</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Verification Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Verification analytics
                  </p>
                </Link>

                <Link
                  href="/admin/verification/guidelines"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📋</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Verification Guidelines
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Verification guidelines
                  </p>
                </Link>

                <Link
                  href="/admin/analytics/performance"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">⚡</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Performance Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    System performance metrics
                  </p>
                </Link>

                <Link
                  href="/admin/analytics/search"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔍</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Search Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Search behavior analytics
                  </p>
                </Link>

                <Link
                  href="/admin/job-board"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💼</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Job Board Management
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Manage job board and postings
                  </p>
                </Link>

                <Link
                  href="/admin/subscriptions"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💎</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Subscription Management
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Manage user subscriptions
                  </p>
                </Link>

                <Link
                  href="/admin/users/[id]"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👤</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Individual User Management
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Manage individual user accounts
                  </p>
                </Link>

                <Link
                  href="/admin/verification/[userId]"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                      Individual User Verification
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Verify individual user accounts
                  </p>
                </Link>
              </div>
            </div>

            {/* Demo & Testing Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🧪 Demo & Testing Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/demo"
                  className="group block bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🧪</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600">
                      Demo Hub
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    All external service demos
                  </p>
                </Link>

                <Link
                  href="/maps-demo"
                  className="group block bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🗺️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600">
                      Maps Demo
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Mapbox integration test
                  </p>
                </Link>

                <Link
                  href="/analytics-demo"
                  className="group block bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600">
                      Analytics Demo
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Google Analytics test</p>
                </Link>

                <Link
                  href="/sendgrid-demo"
                  className="group block bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📧</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600">
                      Email Demo
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    SendGrid integration test
                  </p>
                </Link>

                <Link
                  href="/stripe-demo"
                  className="group block bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💳</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600">
                      Payment Demo
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Stripe integration test
                  </p>
                </Link>
              </div>
            </div>

            {/* Payment Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💳 Payment Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/payments"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💳</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Payment Dashboard
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Main payment overview</p>
                </Link>

                <Link
                  href="/payments/methods"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💳</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Payment Methods
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Manage payment methods
                  </p>
                </Link>

                <Link
                  href="/payments/receipts"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🧾</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Payment Receipts
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    View and download receipts
                  </p>
                </Link>

                <Link
                  href="/payments/failed"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">⚠️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Failed Payments
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Manage failed payments
                  </p>
                </Link>

                <Link
                  href="/payments/confirm"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Payment Confirmation
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Confirm payment completion
                  </p>
                </Link>
              </div>
            </div>

            {/* CRM Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📞 CRM Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/crm"
                  className="group block bg-violet-50 hover:bg-violet-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📞</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                      CRM Dashboard
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Main CRM dashboard</p>
                </Link>

                <Link
                  href="/crm/contacts"
                  className="group block bg-violet-50 hover:bg-violet-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👥</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                      Contacts
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Manage contacts</p>
                </Link>

                <Link
                  href="/crm/messages"
                  className="group block bg-violet-50 hover:bg-violet-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💬</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                      Messages
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Message management</p>
                </Link>

                <Link
                  href="/crm/notes"
                  className="group block bg-violet-50 hover:bg-violet-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📝</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                      Notes
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Customer notes</p>
                </Link>

                <Link
                  href="/crm/reminders"
                  className="group block bg-violet-50 hover:bg-violet-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">⏰</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                      Reminders
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Follow-up reminders</p>
                </Link>

                <Link
                  href="/crm/timeline"
                  className="group block bg-violet-50 hover:bg-violet-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                      Timeline
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Customer timeline</p>
                </Link>

                <Link
                  href="/crm/search"
                  className="group block bg-violet-50 hover:bg-violet-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔍</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                      CRM Search
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Search CRM data</p>
                </Link>

                <Link
                  href="/crm/export"
                  className="group block bg-violet-50 hover:bg-violet-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📤</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-violet-600">
                      Export Data
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Export CRM data</p>
                </Link>
              </div>
            </div>

            {/* Documents Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📄 Documents Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/documents"
                  className="group block bg-slate-50 hover:bg-slate-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📄</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-slate-600">
                      Documents
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Document management</p>
                </Link>
              </div>
            </div>

            {/* Inquiries Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📧 Inquiries Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/inquiries"
                  className="group block bg-amber-50 hover:bg-amber-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📧</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-amber-600">
                      Inquiries
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Manage inquiries</p>
                </Link>

                <Link
                  href="/inquiries/send"
                  className="group block bg-amber-50 hover:bg-amber-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📤</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-amber-600">
                      Send Inquiry
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Send new inquiry</p>
                </Link>

                <Link
                  href="/inquiries/history"
                  className="group block bg-amber-50 hover:bg-amber-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🕒</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-amber-600">
                      Inquiry History
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">View inquiry history</p>
                </Link>

                <Link
                  href="/inquiries/status"
                  className="group block bg-amber-50 hover:bg-amber-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-amber-600">
                      Inquiry Status
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Track inquiry status</p>
                </Link>

                <Link
                  href="/inquiries/templates"
                  className="group block bg-amber-50 hover:bg-amber-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📝</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-amber-600">
                      Inquiry Templates
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pre-built inquiry templates
                  </p>
                </Link>
              </div>
            </div>

            {/* Trial Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🆓 Trial Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/trial"
                  className="group block bg-lime-50 hover:bg-lime-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🆓</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-lime-600">
                      Trial Dashboard
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Trial user dashboard</p>
                </Link>

                <Link
                  href="/trial/progress"
                  className="group block bg-lime-50 hover:bg-lime-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📈</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-lime-600">
                      Trial Progress
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Track trial progress</p>
                </Link>

                <Link
                  href="/trial/analytics"
                  className="group block bg-lime-50 hover:bg-lime-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-lime-600">
                      Trial Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Trial usage analytics</p>
                </Link>

                <Link
                  href="/trial/emails"
                  className="group block bg-lime-50 hover:bg-lime-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📧</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-lime-600">
                      Trial Emails
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Trial email management
                  </p>
                </Link>

                <Link
                  href="/trial/recommendations"
                  className="group block bg-lime-50 hover:bg-lime-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💡</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-lime-600">
                      Trial Recommendations
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Trial-specific recommendations
                  </p>
                </Link>

                <Link
                  href="/trial/support"
                  className="group block bg-lime-50 hover:bg-lime-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🆘</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-lime-600">
                      Trial Support
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Trial user support</p>
                </Link>
              </div>
            </div>

            {/* Features Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ⭐ Features Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/features"
                  className="group block bg-rose-50 hover:bg-rose-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">⭐</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-rose-600">
                      Features
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Platform features overview
                  </p>
                </Link>

                <Link
                  href="/features/analytics"
                  className="group block bg-rose-50 hover:bg-rose-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-rose-600">
                      Feature Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Feature usage analytics
                  </p>
                </Link>

                <Link
                  href="/features/early-access"
                  className="group block bg-rose-50 hover:bg-rose-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🚀</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-rose-600">
                      Early Access
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Early access features</p>
                </Link>

                <Link
                  href="/features/spotlight"
                  className="group block bg-rose-50 hover:bg-rose-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✨</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-rose-600">
                      Feature Spotlight
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Featured platform features
                  </p>
                </Link>

                <Link
                  href="/features/support"
                  className="group block bg-rose-50 hover:bg-rose-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🆘</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-rose-600">
                      Feature Support
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Feature support and help
                  </p>
                </Link>

                <Link
                  href="/features/analytics"
                  className="group block bg-rose-50 hover:bg-rose-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-rose-600">
                      Feature Analytics
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Feature usage analytics
                  </p>
                </Link>

                <Link
                  href="/features/early-access"
                  className="group block bg-rose-50 hover:bg-rose-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🚀</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-rose-600">
                      Early Access
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Early access features</p>
                </Link>

                <Link
                  href="/features/spotlight"
                  className="group block bg-rose-50 hover:bg-rose-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✨</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-rose-600">
                      Feature Spotlight
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Featured platform features
                  </p>
                </Link>
              </div>
            </div>

            {/* Subscriptions Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💎 Subscriptions Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/subscriptions"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💎</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Subscriptions
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Subscription management
                  </p>
                </Link>

                <Link
                  href="/subscriptions/pricing"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💰</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Pricing Plans
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">View pricing plans</p>
                </Link>

                <Link
                  href="/subscriptions/tiers"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Subscription Tiers
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Compare subscription tiers
                  </p>
                </Link>

                <Link
                  href="/subscriptions/trial"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🆓</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Trial Subscription
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Trial subscription details
                  </p>
                </Link>
              </div>
            </div>

            {/* Testimonials Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ⭐ Testimonials Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/testimonials"
                  className="group block bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">⭐</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600">
                      Testimonials
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">View testimonials</p>
                </Link>

                <Link
                  href="/testimonials/create"
                  className="group block bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✍️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600">
                      Create Testimonial
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Submit new testimonial
                  </p>
                </Link>
              </div>
            </div>

            {/* Event Management Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📅 Event Management Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/events"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Events Dashboard
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Main events dashboard</p>
                </Link>

                <Link
                  href="/events/[id]"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👁️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Event Details
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">View event details</p>
                </Link>

                <Link
                  href="/events/[id]/edit"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✏️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Edit Event
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Edit event details</p>
                </Link>

                <Link
                  href="/events/[id]/completion"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Event Completion
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Event completion tracking
                  </p>
                </Link>

                <Link
                  href="/events/[id]/milestones"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🎯</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Event Milestones
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Track event milestones
                  </p>
                </Link>

                <Link
                  href="/events/[id]/versions"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📝</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Event Versions
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Event version history</p>
                </Link>
              </div>
            </div>

            {/* Contractor Detail Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔧 Contractor Detail Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/contractors/[id]"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👤</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Contractor Profile
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    View contractor profile
                  </p>
                </Link>
              </div>
            </div>

            {/* Jobs Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                💼 Jobs Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/jobs"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💼</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Jobs Dashboard
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Browse available jobs</p>
                </Link>

                <Link
                  href="/jobs/create"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">➕</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Create Job
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Post a new job</p>
                </Link>

                <Link
                  href="/jobs/[id]"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👁️</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Job Details
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">View job details</p>
                </Link>

                <Link
                  href="/jobs/[id]/apply"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📝</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Apply for Job
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Apply to a job</p>
                </Link>

                <Link
                  href="/jobs/[id]/apply/success"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✅</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Application Success
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Job application submitted
                  </p>
                </Link>
              </div>
            </div>

            {/* Search & History Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                🔍 Search & History Pages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/search"
                  className="group block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔍</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-600">
                      Search
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">Main search page</p>
                </Link>

                <Link
                  href="/search/history"
                  className="group block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🕒</span>
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-600">
                      Search History
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">View search history</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
