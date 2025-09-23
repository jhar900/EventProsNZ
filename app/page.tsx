'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading } = useAuth();

  console.log('Home component rendering, isLoading:', isLoading, 'user:', user);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
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

            {/* View All Pages Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                🚀 View All Built Pages
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                Explore all the pages and features that have been built for
                Event Pros NZ
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Core Pages */}
                <Link
                  href="/dashboard"
                  className="group block bg-blue-50 hover:bg-blue-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📊</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      Dashboard
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">Main user dashboard</p>
                </Link>

                <Link
                  href="/profile"
                  className="group block bg-green-50 hover:bg-green-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👤</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600">
                      Profile
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    User profile management
                  </p>
                </Link>

                {/* Demo Pages */}
                <Link
                  href="/demo"
                  className="group block bg-purple-50 hover:bg-purple-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🧪</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">
                      Demo Hub
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    All external service demos
                  </p>
                </Link>

                <Link
                  href="/maps-demo"
                  className="group block bg-orange-50 hover:bg-orange-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🗺️</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600">
                      Maps Demo
                    </h3>
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
                    <h3 className="font-semibold text-gray-900 group-hover:text-yellow-600">
                      Analytics Demo
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">Google Analytics test</p>
                </Link>

                <Link
                  href="/sendgrid-demo"
                  className="group block bg-pink-50 hover:bg-pink-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📧</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-pink-600">
                      Email Demo
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    SendGrid integration test
                  </p>
                </Link>

                <Link
                  href="/stripe-demo"
                  className="group block bg-emerald-50 hover:bg-emerald-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">💳</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">
                      Payment Demo
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Stripe integration test
                  </p>
                </Link>

                {/* Onboarding Pages */}
                <Link
                  href="/onboarding/contractor"
                  className="group block bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🔧</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      Contractor Onboarding
                    </h3>
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
                    <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">
                      Event Manager Onboarding
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Event manager registration flow
                  </p>
                </Link>

                {/* Admin Pages (if user is admin) */}
                <Link
                  href="/admin/users"
                  className="group block bg-red-50 hover:bg-red-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">👥</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-red-600">
                      User Management
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">Admin user management</p>
                </Link>

                <Link
                  href="/admin/verification"
                  className="group block bg-amber-50 hover:bg-amber-100 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">✅</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-amber-600">
                      Verification System
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Admin verification workflow
                  </p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
