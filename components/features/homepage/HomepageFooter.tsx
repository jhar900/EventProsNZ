'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Heart,
  Flag,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { HomepageModalContext } from './HomepageLayout';

interface HomepageFooterProps {
  className?: string;
}

export function HomepageFooter({ className = '' }: HomepageFooterProps) {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const modalContext = React.useContext(HomepageModalContext);

  const footerLinks = {
    pages: [
      { name: 'Home', href: '/' },
      { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
      { name: 'Contractors', href: '/contractors' },
      { name: 'Jobs', href: '/jobs' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' },
      { name: 'Accessibility', href: '/accessibility' },
    ],
  };

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/groups/eventprosnz',
      icon: Facebook,
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/eventprosnz/',
      icon: Instagram,
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/event-pros-nz',
      icon: Linkedin,
    },
  ];

  return (
    <footer className={`bg-gray-900 text-white ${className}`}>
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Event Pros NZ"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Event Pros NZ</h3>
                <p className="text-sm text-gray-400">
                  New Zealand&apos;s Event Ecosystem
                </p>
              </div>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Connecting event managers with qualified contractors across New
              Zealand. We&apos;re proud to support the local event industry with
              innovative technology and community-focused solutions.
            </p>

            {/* Contact info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Auckland, New Zealand</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>jason@eventpros.co.nz</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-4">
              {socialLinks.map(social => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Pages links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Pages</h4>
            <ul className="space-y-3">
              {footerLinks.pages.map(link => {
                // Handle Dashboard link - show sign-up modal if not logged in
                if (link.name === 'Dashboard' && !user) {
                  if (modalContext) {
                    return (
                      <li key={link.name}>
                        <button
                          onClick={() => modalContext.onRegisterClick()}
                          className="text-gray-300 hover:text-white transition-colors cursor-pointer text-left"
                          type="button"
                        >
                          {link.name}
                        </button>
                      </li>
                    );
                  } else {
                    // Fallback: navigate to dashboard if context not available
                    return (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-gray-300 hover:text-white transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    );
                  }
                }
                // Regular link
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>© {currentYear} Event Pros NZ. All rights reserved.</span>
              <Flag className="w-4 h-4 text-red-500" />
              <span>Made in New Zealand</span>
            </div>

            {/* Legal links */}
            <div className="flex flex-wrap gap-6 text-sm">
              {footerLinks.legal.map(link => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Made with love */}
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" />{' '}
              in New Zealand
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
