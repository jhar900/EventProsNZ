'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, []);

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  const handleCreateEvent = () => {
    router.push('/events');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to EventProsNZ!
              </h1>
              <p className="text-gray-600">
                Your profile has been set up successfully. You&apos;re ready to
                start managing events!
              </p>
            </div>

            {user && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-900 mb-2">
                  Profile Summary
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Name:</strong>{' '}
                    {user.user_metadata?.full_name || 'Not provided'}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Role:</strong> Event Manager
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className="text-green-600 font-medium">Verified</span>
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                What would you like to do next?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleCreateEvent}
                  className="p-6 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="text-2xl mr-3">📅</div>
                    <h4 className="font-medium text-gray-900">
                      Create Your First Event
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Set up an event and start getting quotes from contractors
                  </p>
                </button>

                <button
                  onClick={handleGetStarted}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-2">
                    <div className="text-2xl mr-3">🏠</div>
                    <h4 className="font-medium text-gray-900">
                      Go to Dashboard
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Explore the platform and manage your events
                  </p>
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">
                Quick Tips to Get Started:
              </h4>
              <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Complete your profile with business information for better
                  contractor matches
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Browse our contractor directory to see available services
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Use the search filters to find contractors in your area
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Check contractor reviews and portfolios before making bookings
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={handleGetStarted}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
