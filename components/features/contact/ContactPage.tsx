'use client';

import { useState, useEffect } from 'react';
import { MapPin, Mail, Facebook, Instagram, Linkedin } from 'lucide-react';
import ContactForm from './ContactForm';
import { ContactInfo } from '@/types/contact';
import { HomepageLayout } from '@/components/features/homepage/HomepageLayout';
import { HomepageFooter } from '@/components/features/homepage/HomepageFooter';

interface ContactPageProps {
  className?: string;
}

export default function ContactPage({ className }: ContactPageProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch('/api/contact/info');
        if (response.ok) {
          const data = await response.json();
          setContactInfo(data);
        }
      } catch (error) {
        // console.error('Failed to fetch contact info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  if (loading) {
    return (
      <HomepageLayout>
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div
            className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"
            role="status"
            aria-label="Loading contact page content"
          ></div>
        </div>
      </HomepageLayout>
    );
  }

  return (
    <HomepageLayout className={`min-h-screen bg-white ${className}`}>
      {/* Content with top padding to account for fixed navigation */}
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50"></div>

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full py-12">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                  Let&apos;s <span className="text-orange-600">Chat!</span>
                </h1>
                <p className="text-xl sm:text-2xl text-gray-600 mb-8">
                  <span className="text-orange-600 font-semibold">
                    We&apos;re here to help{' '}
                  </span>{' '}
                  with your event planning needs. Reach out to our team for{' '}
                  <span className="text-orange-600 font-semibold">
                    support, inquiries or{' '}
                  </span>
                  <span className="text-orange-600 font-semibold">
                    partnership opportunities{' '}
                  </span>
                  and we&apos;ll get back to you as soon as possible.
                </p>

                {/* Contact Information */}
                <div className="space-y-4">
                  {/* Location */}
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <p className="font-medium">Auckland, New Zealand</p>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <a
                      href={`mailto:${contactInfo?.contact?.email || 'jason@eventprosnz.co.nz'}`}
                      className="hover:text-orange-600 transition-colors"
                    >
                      {contactInfo?.contact?.email || 'hello@eventprosnz.co.nz'}
                    </a>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Follow us:
                    </span>
                    <div className="flex items-center gap-3">
                      <a
                        href="https://facebook.com/eventprosnz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-orange-600 transition-colors"
                        aria-label="Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                      <a
                        href="https://instagram.com/eventprosnz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-orange-600 transition-colors"
                        aria-label="Instagram"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                      <a
                        href="https://linkedin.com/company/event-pros-nz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-orange-600 transition-colors"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Form */}
              <div className="w-full">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <HomepageFooter />
    </HomepageLayout>
  );
}
