'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OnboardingGuard from '@/components/features/auth/OnboardingGuard';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Search,
  Settings,
  FileText,
  BarChart3,
  Menu,
  X,
  MessageSquare,
  Lightbulb,
  Globe,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  disableNavigation?: boolean;
}

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export default function DashboardLayout({
  children,
  className = '',
  disableNavigation = false,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const pathname = usePathname();

  // Fetch count of submitted feature requests for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchSubmittedCount = async () => {
        try {
          const response = await fetch('/api/admin/feature-requests/count', {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setSubmittedCount(data.count || 0);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              'Error fetching submitted count:',
              response.status,
              errorData
            );
            setSubmittedCount(0);
          }
        } catch (error) {
          console.error('Error fetching submitted count:', error);
        }
      };

      fetchSubmittedCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchSubmittedCount, 30000);
      return () => clearInterval(interval);
    } else {
      setSubmittedCount(null);
    }
  }, [user?.role]);

  const getSidebarItems = (): SidebarItem[] => {
    if (!user) return [];

    const baseItems = [
      {
        href: user.role === 'admin' ? '/admin/dashboard' : '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { href: '/admin/users', label: 'Users', icon: Users },
          { href: '/admin/events', label: 'Events', icon: Calendar },
          { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
          { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
          {
            href: '/feature-requests',
            label: 'Feature Requests',
            icon: Lightbulb,
            badge:
              submittedCount !== null && submittedCount > 0
                ? submittedCount
                : undefined,
          },
          {
            href: '/admin/platform-settings',
            label: 'Platform Settings',
            icon: Globe,
          },
          { href: '/admin/settings', label: 'Settings', icon: Settings },
        ];
      case 'event_manager':
        return [
          ...baseItems,
          { href: '/events', label: 'My Events', icon: Calendar },
          { href: '/events/create', label: 'Create Event', icon: Calendar },
          { href: '/contractors', label: 'Find Contractors', icon: Search },
          {
            href: '/contractors/search',
            label: 'Search Contractors',
            icon: Search,
          },
          { href: '/contractors/map', label: 'Contractor Map', icon: Search },
          {
            href: '/budget/analytics',
            label: 'Budget Analytics',
            icon: BarChart3,
          },
          {
            href: '/feature-requests',
            label: 'Feature Requests',
            icon: Lightbulb,
          },
          { href: '/profile', label: 'Profile', icon: Settings },
        ];
      case 'contractor':
        return [
          ...baseItems,
          { href: '/profile', label: 'Profile', icon: Settings },
          { href: '/jobs', label: 'Browse Jobs', icon: Search },
          { href: '/inquiries', label: 'Inquiries', icon: MessageSquare },
          {
            href: '/feature-requests',
            label: 'Feature Requests',
            icon: Lightbulb,
          },
        ];
      default:
        return baseItems;
    }
  };

  const sidebarItems = getSidebarItems();

  // Debug log to see what's happening
  if (user?.role === 'admin') {
    console.log('Sidebar items for admin:', {
      submittedCount,
      featureRequestItem: sidebarItems.find(
        item => item.href === '/feature-requests'
      ),
    });
  }

  return (
    <OnboardingGuard>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:inset-0 lg:h-screen flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            {disableNavigation ? (
              <div className="flex items-center">
                <div className="h-8 w-8 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Event Pros NZ"
                    className="max-w-full max-h-full object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Event Pros NZ
                </span>
              </div>
            ) : (
              <Link
                href="/"
                className="flex items-center hover:opacity-80 transition-opacity duration-200"
              >
                <div className="h-8 w-8 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Event Pros NZ"
                    className="max-w-full max-h-full object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Event Pros NZ
                </span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="mt-8 px-4 flex-1">
            <ul className="space-y-2">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                // Check if current path matches this nav item
                // Handle exact matches and nested routes
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' &&
                    pathname.startsWith(item.href + '/') &&
                    // Don't match if there's a more specific route that should be active
                    // e.g., if we're on /events/create, don't highlight /events if /events/create exists as a separate item
                    !sidebarItems.some(
                      otherItem =>
                        otherItem.href !== item.href &&
                        pathname.startsWith(otherItem.href + '/') &&
                        otherItem.href.startsWith(item.href + '/')
                    ));

                if (disableNavigation) {
                  return (
                    <li key={item.href}>
                      <div className="flex items-center justify-between px-3 py-2 rounded-md text-gray-400 cursor-not-allowed">
                        <div className="flex items-center space-x-3 flex-1">
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <Badge
                            variant="destructive"
                            className="h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 text-xs font-semibold flex-shrink-0 bg-gray-300 text-gray-500"
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </Badge>
                        )}
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-gray-700 hover:text-primary hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant="destructive"
                          className={`h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 text-xs font-semibold flex-shrink-0 ${
                            isActive
                              ? 'bg-white text-primary'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={async () => {
                try {
                  await logout();
                  window.location.href = '/';
                } catch (error) {
                  // Fallback: clear localStorage and redirect
                  localStorage.clear();
                  window.location.href = '/';
                }
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-screen w-full">
          {/* Mobile header */}
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {disableNavigation ? (
                <div className="flex items-center">
                  <div className="h-8 w-8 flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="Event Pros NZ"
                      className="max-w-full max-h-full object-contain"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <span className="ml-2 text-lg font-bold text-gray-900">
                    Event Pros NZ
                  </span>
                </div>
              ) : (
                <Link
                  href="/"
                  className="flex items-center hover:opacity-80 transition-opacity duration-200"
                >
                  <div className="h-8 w-8 flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="Event Pros NZ"
                      className="max-w-full max-h-full object-contain"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <span className="ml-2 text-lg font-bold text-gray-900">
                    Event Pros NZ
                  </span>
                </Link>
              )}
              <div className="w-8" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Page content */}
          <div className={`${className}`}>{children}</div>
        </div>
      </div>
    </OnboardingGuard>
  );
}
