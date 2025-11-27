'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Calendar,
  Search,
  MessageSquare,
  Users,
  Briefcase,
  Clock,
  AlertCircle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  eventsCount?: number;
  inquiriesCount?: number;
  applicationsCount?: number;
  jobsCount?: number;
  recentEvents?: any[];
  recentInquiries?: any[];
  recentApplications?: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { status: completionStatus } = useProfileCompletion();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Load role-specific stats
        if (user.role === 'event_manager') {
          // Load events count
          const eventsResponse = await fetch('/api/events/dashboard?limit=5', {
            headers: {
              'x-user-id': user.id,
            },
            credentials: 'include',
          });
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            setStats(prev => ({
              ...prev,
              eventsCount: eventsData.total || 0,
              recentEvents: eventsData.events || [],
            }));
          }

          // Load inquiries count
          const inquiriesResponse = await fetch('/api/inquiries?limit=5', {
            headers: {
              'x-user-id': user.id,
            },
            credentials: 'include',
          });
          if (inquiriesResponse.ok) {
            const inquiriesData = await inquiriesResponse.json();
            setStats(prev => ({
              ...prev,
              inquiriesCount: inquiriesData.total || 0,
              recentInquiries: inquiriesData.inquiries || [],
            }));
          }
        } else if (user.role === 'contractor') {
          // Load inquiries for contractor
          const inquiriesResponse = await fetch(
            '/api/inquiries/contractor?limit=5',
            {
              headers: {
                'x-user-id': user.id,
              },
              credentials: 'include',
            }
          );
          if (inquiriesResponse.ok) {
            const inquiriesData = await inquiriesResponse.json();
            setStats(prev => ({
              ...prev,
              inquiriesCount: inquiriesData.total || 0,
              recentInquiries: inquiriesData.inquiries || [],
            }));
          }

          // Load job applications count
          // Note: We'll need to query job_applications table directly
          // For now, we'll skip this and show 0 if the endpoint doesn't exist
          try {
            const applicationsResponse = await fetch(
              '/api/jobs/applications/my',
              {
                headers: {
                  'x-user-id': user.id,
                },
                credentials: 'include',
              }
            );
            if (applicationsResponse.ok) {
              const applicationsData = await applicationsResponse.json();
              setStats(prev => ({
                ...prev,
                applicationsCount:
                  applicationsData.total ||
                  applicationsData.applications?.length ||
                  0,
                recentApplications: applicationsData.applications || [],
              }));
            }
          } catch (error) {
            // Endpoint might not exist yet, that's okay
            console.log('Job applications endpoint not available');
          }
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, [user?.id, user?.role]);

  const getUserName = () => {
    if (!user) return '';
    if (user.profile?.first_name || user.profile?.last_name) {
      return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (!user) return null;
    const profileData = Array.isArray(user.profile)
      ? user.profile[0]
      : user.profile;
    return profileData?.avatar_url || null;
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      event_manager: 'Event Manager',
      contractor: 'Contractor',
      admin: 'Administrator',
    };
    return roleMap[role] || role;
  };

  const getInitials = () => {
    const name = getUserName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        {user && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  {getUserAvatar() ? (
                    <Image
                      src={getUserAvatar()!}
                      alt={getUserName()}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold text-lg">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user.profile?.first_name || 'there'}!
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {getRoleDisplayName(user.role)} Dashboard
                  </p>
                </div>
              </div>
              {user.role === 'event_manager' && (
                <Link href="/events/create">
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Event</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Profile Completion Alert */}
        {user && completionStatus && !completionStatus.isComplete && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Finish setting up your profile to unlock all features and
                  improve your visibility.
                </p>
                <Link
                  href={
                    user.role === 'contractor'
                      ? '/onboarding/contractor'
                      : '/onboarding/event-manager'
                  }
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-300 text-yellow-900 hover:bg-yellow-100"
                  >
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Verification Status for Contractors */}
        {user && user.role === 'contractor' && !user.is_verified && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Verification Pending
                </h3>
                <p className="text-sm text-blue-700">
                  Your profile is pending admin approval. You&apos;ll be
                  notified once you&apos;re verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? (
              // Show skeleton cards while loading
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
                  <Skeleton className="h-4 w-20 mt-4" />
                </div>
              ))
            ) : (
              <>
                <RoleGuard
                  allowedRoles={['event_manager']}
                  hideOnUnauthorized={true}
                >
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Events
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {loading ? '...' : stats.eventsCount || 0}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <Link
                      href="/events"
                      className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      View all <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Inquiries
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {loading ? '...' : stats.inquiriesCount || 0}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <Link
                      href="/inquiries"
                      className="mt-4 text-sm text-green-600 hover:text-green-700 flex items-center"
                    >
                      View all <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </RoleGuard>

                <RoleGuard
                  allowedRoles={['contractor']}
                  hideOnUnauthorized={true}
                >
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Inquiries
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {loading ? '...' : stats.inquiriesCount || 0}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <Link
                      href="/inquiries"
                      className="mt-4 text-sm text-green-600 hover:text-green-700 flex items-center"
                    >
                      View all <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Job Applications
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {loading ? '...' : stats.applicationsCount || 0}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <Link
                      href="/jobs"
                      className="mt-4 text-sm text-purple-600 hover:text-purple-700 flex items-center"
                    >
                      View all <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </RoleGuard>
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RoleGuard
              allowedRoles={['event_manager']}
              hideOnUnauthorized={true}
            >
              <Link
                href="/events/create"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    Create Event
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Set up a new event and start getting quotes from contractors
                </p>
              </Link>

              <Link
                href="/contractors"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Search className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                    Find Contractors
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Browse available contractors for your events
                </p>
              </Link>

              <Link
                href="/events"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                    My Events
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  View and manage all your events
                </p>
              </Link>
            </RoleGuard>

            <RoleGuard allowedRoles={['contractor']} hideOnUnauthorized={true}>
              <Link
                href="/profile"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    Manage Profile
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Update your business profile and services
                </p>
              </Link>

              <Link
                href="/jobs"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Briefcase className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                    Browse Jobs
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Find and apply for event management jobs
                </p>
              </Link>

              <Link
                href="/inquiries"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                    My Inquiries
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  View and respond to event manager inquiries
                </p>
              </Link>
            </RoleGuard>
          </div>
        </div>

        {/* Recent Activity */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              // Show skeleton cards while loading
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <>
                <RoleGuard
                  allowedRoles={['event_manager']}
                  hideOnUnauthorized={true}
                >
                  {stats.recentEvents && stats.recentEvents.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Recent Events
                        </h2>
                        <Link
                          href="/events"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          View all
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {stats.recentEvents.slice(0, 5).map((event: any) => (
                          <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {event.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {event.event_type} •{' '}
                                  {new Date(
                                    event.event_date
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  event.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : event.status === 'planning'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {event.status}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </RoleGuard>

                <RoleGuard
                  allowedRoles={['contractor']}
                  hideOnUnauthorized={true}
                >
                  {stats.recentInquiries &&
                    stats.recentInquiries.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-gray-900">
                            Recent Inquiries
                          </h2>
                          <Link
                            href="/inquiries"
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            View all
                          </Link>
                        </div>
                        <div className="space-y-3">
                          {stats.recentInquiries
                            .slice(0, 5)
                            .map((inquiry: any) => (
                              <Link
                                key={inquiry.id}
                                href={`/inquiries/${inquiry.id}`}
                                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {inquiry.subject || 'New Inquiry'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(
                                        inquiry.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      inquiry.status === 'responded'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {inquiry.status}
                                  </span>
                                </div>
                              </Link>
                            ))}
                        </div>
                      </div>
                    )}
                </RoleGuard>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
