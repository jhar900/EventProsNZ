'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Users,
  Shield,
} from 'lucide-react';
import ContactForm from './ContactForm';
import SocialMediaSection from './SocialMediaSection';
import NewsletterSignup from './NewsletterSignup';
import { ContactInfo } from '@/types/contact';

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
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"
          role="status"
          aria-label="Loading contact page content"
        ></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}
    >
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              We&apos;re here to help with your event planning needs. Reach out
              to our team for support, inquiries, or partnership opportunities.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                24/7 Support
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Quick Response
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Shield className="w-4 h-4 mr-2" />
                Secure Communication
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Business Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {contactInfo?.business?.name || 'Event Pros NZ Ltd'}
                    </h4>
                    <p className="text-gray-600">
                      {contactInfo?.business?.address?.street ||
                        '123 Queen Street'}
                      <br />
                      {contactInfo?.business?.address?.city || 'Auckland'}{' '}
                      {contactInfo?.business?.address?.postalCode || '1010'}
                      <br />
                      {contactInfo?.business?.address?.country || 'New Zealand'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Business Hours</h4>
                    <p className="text-gray-600">
                      Monday - Friday:{' '}
                      {contactInfo?.business?.hours?.weekdays ||
                        '9:00 AM - 6:00 PM'}
                      <br />
                      Saturday:{' '}
                      {contactInfo?.business?.hours?.saturday ||
                        '10:00 AM - 4:00 PM'}
                      <br />
                      Sunday: {contactInfo?.business?.hours?.sunday || 'Closed'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">NZBN</h4>
                    <p className="text-gray-600">
                      {contactInfo?.business?.nzbn || '9429041234567'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Methods */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Contact Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Phone</h4>
                    <p className="text-gray-600">
                      <a
                        href={`tel:${contactInfo?.contact?.phone || '+6491234567'}`}
                        className="hover:text-primary"
                      >
                        {contactInfo?.contact?.phone || '+64 9 123 4567'}
                      </a>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Email</h4>
                    <p className="text-gray-600">
                      <a
                        href={`mailto:${contactInfo?.contact?.email || 'hello@eventprosnz.co.nz'}`}
                        className="hover:text-primary"
                      >
                        {contactInfo?.contact?.email ||
                          'hello@eventprosnz.co.nz'}
                      </a>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Support</h4>
                    <p className="text-gray-600">
                      <a
                        href={`mailto:${contactInfo?.contact?.support || 'support@eventprosnz.co.nz'}`}
                        className="hover:text-primary"
                      >
                        {contactInfo?.contact?.support ||
                          'support@eventprosnz.co.nz'}
                      </a>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Partnerships</h4>
                    <p className="text-gray-600">
                      <a
                        href={`mailto:${contactInfo?.contact?.partnerships || 'partnerships@eventprosnz.co.nz'}`}
                        className="hover:text-primary"
                      >
                        {contactInfo?.contact?.partnerships ||
                          'partnerships@eventprosnz.co.nz'}
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">General Inquiries</h4>
                    <p className="text-gray-600">
                      {contactInfo?.responseTimes?.general || 'Within 24 hours'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Technical Support</h4>
                    <p className="text-gray-600">
                      {contactInfo?.responseTimes?.support || 'Within 4 hours'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Urgent Issues</h4>
                    <p className="text-gray-600">
                      {contactInfo?.responseTimes?.urgent || 'Within 1 hour'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">
                      Partnership Inquiries
                    </h4>
                    <p className="text-gray-600">
                      {contactInfo?.responseTimes?.partnerships ||
                        'Within 48 hours'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Send Us a Message</h2>
            <p className="text-xl text-gray-600">
              Fill out the form below and we&apos;ll get back to you as soon as
              possible.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* Social Media Section */}
      <SocialMediaSection />

      {/* Newsletter Signup */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto">
          <NewsletterSignup />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions about our platform and services.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">How do I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Simply create an account, complete your profile, and start
                  browsing contractors or posting events. Our platform is
                  designed to be intuitive and user-friendly.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  Are contractors verified?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes, all contractors go through a thorough verification
                  process including background checks, insurance verification,
                  and portfolio review.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  What areas do you cover?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We cover all of New Zealand, from Northland to Southland, with
                  contractors available in all major cities and regions.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">
                  How do you ensure quality?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We maintain high standards through contractor verification,
                  customer reviews, and continuous monitoring of service
                  quality.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
