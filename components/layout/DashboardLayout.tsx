'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OnboardingGuard from '@/components/features/auth/OnboardingGuard';
import { SuspensionNotice } from '@/components/features/dashboard/SuspensionNotice';
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
  Briefcase,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Mail,
} from 'lucide-react';
import Image from 'next/image';

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
  children?: SidebarItem[];
}

export default function DashboardLayout({
  children,
  className = '',
  disableNavigation = false,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const [pendingVerificationCount, setPendingVerificationCount] = useState<
    number | null
  >(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
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

  // Fetch count of pending verifications for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchPendingVerificationCount = async () => {
        try {
          const response = await fetch(
            '/api/admin/verification/queue?status=pending&limit=1',
            {
              credentials: 'include',
              headers: {
                'x-admin-token': 'admin-secure-token-2024-eventpros',
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setPendingVerificationCount(data.total || 0);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(
              'Error fetching pending verification count:',
              response.status,
              errorData
            );
            setPendingVerificationCount(0);
          }
        } catch (error) {
          console.error('Error fetching pending verification count:', error);
        }
      };

      fetchPendingVerificationCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchPendingVerificationCount, 30000);
      return () => clearInterval(interval);
    } else {
      setPendingVerificationCount(null);
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
          {
            href: '/admin/users',
            label: 'Users',
            icon: Users,
            children: [
              { href: '/admin/users', label: 'Users Settings', icon: Settings },
              {
                href: '/admin/verification',
                label: 'Business Verification',
                icon: UserCheck,
              },
            ],
          },
          { href: '/admin/events', label: 'Events', icon: Calendar },
          { href: '/admin/job-board', label: 'Job Board', icon: Briefcase },
          { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
          { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
          { href: '/admin/emails', label: 'Emails', icon: Mail },
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
          { href: '/contractors', label: 'Find Contractors', icon: Search },
          { href: '/jobs/manage', label: 'Jobs', icon: Briefcase },
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
        ];
      case 'contractor':
        return [
          ...baseItems,
          { href: '/inquiries', label: 'Inquiries', icon: MessageSquare },
          { href: '/jobs', label: 'Jobs', icon: Briefcase },
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
          className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:inset-0 lg:h-screen flex flex-col ${
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
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.has(item.href);
                // Check if current path matches this nav item or any of its children
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' &&
                    pathname.startsWith(item.href + '/') &&
                    // Don't match if there's a more specific route that should be active
                    !sidebarItems.some(
                      otherItem =>
                        otherItem.href !== item.href &&
                        pathname.startsWith(otherItem.href + '/') &&
                        otherItem.href.startsWith(item.href + '/')
                    )) ||
                  (hasChildren &&
                    item.children?.some(
                      child =>
                        pathname === child.href ||
                        pathname.startsWith(child.href + '/')
                    ));

                // Auto-expand if any child is active
                if (hasChildren && isActive && !isExpanded) {
                  setExpandedItems(prev => new Set(prev).add(item.href));
                }

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
                    <div>
                      <div
                        className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors duration-200 ${
                          isActive && !hasChildren
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-gray-700 hover:text-primary hover:bg-gray-100'
                        } ${hasChildren ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (hasChildren) {
                            setExpandedItems(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(item.href)) {
                                newSet.delete(item.href);
                              } else {
                                newSet.add(item.href);
                              }
                              return newSet;
                            });
                          }
                        }}
                      >
                        {hasChildren ? (
                          <div className="flex items-center space-x-3 flex-1">
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            prefetch={true}
                            className="flex items-center space-x-3 flex-1"
                            onClick={() => {
                              setSidebarOpen(false);
                            }}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        )}
                        <div className="flex items-center gap-2">
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge
                              variant="destructive"
                              className={`h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 text-xs font-semibold flex-shrink-0 ${
                                isActive && !hasChildren
                                  ? 'bg-white text-primary'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </Badge>
                          )}
                          {hasChildren && (
                            <span className="text-gray-400">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasChildren && isExpanded && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {item.children?.map(child => {
                            const ChildIcon = child.icon;
                            const isChildActive =
                              pathname === child.href ||
                              (child.href !== '/' &&
                                pathname.startsWith(child.href + '/'));
                            // Show red dot for Business Verification if there are pending verifications
                            const showPendingDot =
                              child.href === '/admin/verification' &&
                              pendingVerificationCount !== null &&
                              pendingVerificationCount > 0;
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  prefetch={true}
                                  className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors duration-200 ${
                                    isChildActive
                                      ? 'bg-primary text-primary-foreground font-medium'
                                      : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                                  }`}
                                  onClick={() => {
                                    setSidebarOpen(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <ChildIcon className="h-4 w-4" />
                                    <span className="text-sm">
                                      {child.label}
                                    </span>
                                  </div>
                                  {showPendingDot && (
                                    <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Details Section */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {user.profile?.avatar_url ? (
                    <Image
                      src={user.profile.avatar_url}
                      alt={user.profile.first_name || user.email || 'User'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold text-sm">
                      {user.profile?.first_name?.[0]?.toUpperCase() ||
                        user.profile?.last_name?.[0]?.toUpperCase() ||
                        user.email?.[0]?.toUpperCase() ||
                        'U'}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.profile?.first_name && user.profile?.last_name
                        ? `${user.profile.first_name} ${user.profile.last_name}`
                        : user.profile?.first_name ||
                          user.email?.split('@')[0] ||
                          'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {user.role === 'event_manager'
                        ? 'Event Manager'
                        : user.role === 'contractor'
                          ? 'Contractor'
                          : user.role === 'admin'
                            ? 'Administrator'
                            : user.role}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors flex items-center"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Optimistic logout - clear state immediately and redirect
                // Don't wait for async operations
                logout();
                // Redirect immediately - logout is already complete from user's perspective
                window.location.href = '/';
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
          <div className={`${className}`}>
            <SuspensionNotice />
            {children}
          </div>
        </div>
      </div>
    </OnboardingGuard>
  );
}
