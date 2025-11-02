'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardLayout({
  children,
  className = '',
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getSidebarItems = () => {
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
          { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
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
          { href: '/profile', label: 'Profile', icon: Settings },
        ];
      case 'contractor':
        return [
          ...baseItems,
          { href: '/profile', label: 'Profile', icon: Settings },
          { href: '/jobs', label: 'Browse Jobs', icon: Search },
          { href: '/inquiries', label: 'Inquiries', icon: MessageSquare },
          {
            href: '/contractors/favorites',
            label: 'My Favorites',
            icon: FileText,
          },
          { href: '/contractors/map', label: 'Map View', icon: Search },
        ];
      default:
        return baseItems;
    }
  };

  const sidebarItems = getSidebarItems();

  return (
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
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors duration-200"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
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
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <div className={`${className}`}>{children}</div>
      </div>
    </div>
  );
}
