'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  LogOut,
} from 'lucide-react';

interface UserProfileDropdownProps {
  className?: string;
}

export default function UserProfileDropdown({
  className = '',
}: UserProfileDropdownProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when selecting a menu item
  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      // Fallback: clear localStorage and redirect
      localStorage.clear();
      window.location.href = '/';
    }
    setIsOpen(false);
  };

  const getNavigationItems = () => {
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
          { href: '/contractors', label: 'Find Contractors', icon: Search },
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
          {
            href: '/contractors/favorites',
            label: 'My Favorites',
            icon: FileText,
          },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  // Get user avatar or default
  const getUserAvatar = () => {
    // Check for profile picture - user.profile.avatar_url (singular, not plural)
    if (user?.profile?.avatar_url) {
      return user.profile.avatar_url;
    }
    // Fallback: check if profiles array exists (for backwards compatibility)
    if (user?.profiles?.[0]?.avatar_url) {
      return user.profiles[0].avatar_url;
    }
    // Return null if no profile picture - will show initials instead
    return null;
  };

  const avatarUrl = getUserAvatar();
  const userName = user?.profile?.first_name || user?.email || 'User';
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Picture + Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        aria-label="User menu"
      >
        {/* Profile Picture */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border border-gray-300">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="User avatar"
              className="w-full h-full object-cover"
              onError={e => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.avatar-initials')) {
                  const initialsSpan = document.createElement('span');
                  initialsSpan.className =
                    'avatar-initials text-xs font-semibold text-gray-600';
                  initialsSpan.textContent = initials;
                  parent.appendChild(initialsSpan);
                }
              }}
            />
          ) : (
            <span className="text-xs font-semibold text-gray-600">
              {initials}
            </span>
          )}
        </div>

        {/* Hamburger Menu Icon */}
        <Menu className="h-4 w-4 text-gray-600" />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transition-all duration-300 ease-out transform origin-top ${
          isOpen
            ? 'opacity-100 scale-y-100 translate-y-0'
            : 'opacity-0 scale-y-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Navigation Items */}
        {navigationItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleMenuItemClick}
              className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="border-t border-gray-200 my-2" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
