'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/features/auth/AuthGuard';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  recentActivity: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    recentActivity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);

      // Load user statistics
      const usersResponse = await fetch('/api/admin/users');
      const usersResult = await usersResponse.json();

      if (usersResponse.ok) {
        const users = usersResult.users || [];
        const totalUsers = users.length;
        const verifiedUsers = users.filter((u: any) => u.is_verified).length;
        const pendingUsers = users.filter((u: any) => !u.is_verified).length;
        const suspendedUsers = users.filter(
          (u: any) => u.status === 'suspended'
        ).length;

        setStats({
          totalUsers,
          verifiedUsers,
          pendingUsers,
          suspendedUsers,
          recentActivity: 0, // This would come from activity logs
        });
      } else {
        throw new Error(usersResult.error || 'Failed to load dashboard stats');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard stats'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    color,
    icon,
  }: {
    title: string;
    value: number;
    color: string;
    icon: string;
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 ${color} rounded-md flex items-center justify-center`}
            >
              <span className="text-white text-lg">{icon}</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-64">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading dashboard...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                      Admin Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600">
                      Welcome back, {user?.email}. Manage your platform from
                      here.
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard
                      title="Total Users"
                      value={stats.totalUsers}
                      color="bg-blue-500"
                      icon="👥"
                    />
                    <StatCard
                      title="Verified Users"
                      value={stats.verifiedUsers}
                      color="bg-green-500"
                      icon="✅"
                    />
                    <StatCard
                      title="Pending Verification"
                      value={stats.pendingUsers}
                      color="bg-yellow-500"
                      icon="⏳"
                    />
                    <StatCard
                      title="Suspended Users"
                      value={stats.suspendedUsers}
                      color="bg-red-500"
                      icon="🚫"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Link
                        href="/admin/users"
                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
                      >
                        <div>
                          <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                            👥
                          </span>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-lg font-medium">
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            User Management
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                            View, manage, and monitor user accounts
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/admin/verification"
                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
                      >
                        <div>
                          <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                            🔍
                          </span>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-lg font-medium">
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            Verification Queue
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Review and approve user verifications
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/admin/contractors"
                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300"
                      >
                        <div>
                          <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                            🏗️
                          </span>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-lg font-medium">
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            Contractor Management
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Manage contractor profiles and approvals
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Recent Activity
                      </h2>
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          Activity logging will be available soon
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
