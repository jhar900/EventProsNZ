'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Eye,
  Database,
  Lock,
  User,
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Settings,
} from 'lucide-react';

export function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: Shield },
    { id: 'data-collection', title: 'Data Collection', icon: Database },
    { id: 'data-usage', title: 'Data Usage', icon: Eye },
    { id: 'data-sharing', title: 'Data Sharing', icon: User },
    { id: 'user-rights', title: 'User Rights', icon: CheckCircle },
    { id: 'data-retention', title: 'Data Retention', icon: Lock },
    { id: 'gdpr-compliance', title: 'GDPR Compliance', icon: Settings },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-900 mb-4">
                Privacy Policy Overview
              </h2>
              <p className="text-green-800 mb-4">
                At EventProsNZ, we are committed to protecting your privacy and
                personal data. This Privacy Policy explains how we collect, use,
                and protect your information when you use our platform.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Calendar className="h-4 w-4" />
                <span>Last updated: December 19, 2024</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Data Protection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• GDPR compliant data handling</li>
                    <li>• Secure data encryption</li>
                    <li>• Regular security audits</li>
                    <li>• User consent management</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Your Rights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Access your data</li>
                    <li>• Request data deletion</li>
                    <li>• Data portability</li>
                    <li>• Withdraw consent</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'data-collection':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Data Collection</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We collect the following personal information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Account Information:</strong> Name, email, phone
                      number, address
                    </li>
                    <li>
                      <strong>Profile Information:</strong> Business details,
                      service categories, portfolio
                    </li>
                    <li>
                      <strong>Event Information:</strong> Event details,
                      preferences, requirements
                    </li>
                    <li>
                      <strong>Communication Data:</strong> Messages, inquiries,
                      support requests
                    </li>
                    <li>
                      <strong>Payment Information:</strong> Billing details
                      (processed securely by Stripe)
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automatically Collected Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We automatically collect:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Usage Data:</strong> Pages visited, features used,
                      time spent
                    </li>
                    <li>
                      <strong>Device Information:</strong> IP address, browser
                      type, device type
                    </li>
                    <li>
                      <strong>Location Data:</strong> General location for
                      service matching
                    </li>
                    <li>
                      <strong>Cookies:</strong> Session data, preferences,
                      analytics
                    </li>
                    <li>
                      <strong>Log Data:</strong> Server logs, error reports,
                      performance data
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Third-Party Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    We may receive data from third parties such as social media
                    platforms (if you connect your accounts) and analytics
                    providers to improve our services.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'data-usage':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Data Usage</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Provision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We use your data to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide and maintain our platform services</li>
                    <li>Match event managers with contractors</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Send important service notifications</li>
                    <li>Provide customer support</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Improvement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We use data to improve our platform:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Analyze usage patterns and user behavior</li>
                    <li>Develop new features and services</li>
                    <li>Optimize platform performance</li>
                    <li>Conduct research and analytics</li>
                    <li>Prevent fraud and ensure security</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We may use your data to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Send service-related communications</li>
                    <li>Provide marketing communications (with consent)</li>
                    <li>Send platform updates and announcements</li>
                    <li>Conduct surveys and feedback collection</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'data-sharing':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Data Sharing</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Users</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We share limited information with other users:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Public profile information (name, business details)</li>
                    <li>Service listings and portfolio items</li>
                    <li>Reviews and ratings (anonymized)</li>
                    <li>
                      Contact information (only when you initiate contact)
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Providers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We share data with trusted service providers:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Payment Processing:</strong> Stripe for secure
                      payment processing
                    </li>
                    <li>
                      <strong>Email Services:</strong> SendGrid for email
                      delivery
                    </li>
                    <li>
                      <strong>Analytics:</strong> Google Analytics for usage
                      insights
                    </li>
                    <li>
                      <strong>Cloud Services:</strong> Supabase for data storage
                      and processing
                    </li>
                    <li>
                      <strong>Maps:</strong> Mapbox for location services
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Legal Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We may share data when required by law:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To comply with legal obligations</li>
                    <li>To respond to lawful requests from authorities</li>
                    <li>To protect our rights and prevent fraud</li>
                    <li>To ensure platform safety and security</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'user-rights':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">User Rights</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Access Rights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access your personal data we hold</li>
                    <li>Request a copy of your data</li>
                    <li>Know how your data is being used</li>
                    <li>Understand our data processing activities</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Control Rights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>You can:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Update or correct your information</li>
                    <li>Delete your account and data</li>
                    <li>Withdraw consent for data processing</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Request data portability</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How to Exercise Your Rights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>To exercise your rights:</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Contact us at privacy@eventpros.co.nz</li>
                    <li>Use the privacy settings in your account</li>
                    <li>Submit a data request through our platform</li>
                    <li>We will respond within 30 days</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'data-retention':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Data Retention</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Retention Periods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We retain data for the following periods:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Account Data:</strong> Until account deletion or 3
                      years of inactivity
                    </li>
                    <li>
                      <strong>Event Data:</strong> 7 years for business records
                    </li>
                    <li>
                      <strong>Communication Data:</strong> 3 years from last
                      contact
                    </li>
                    <li>
                      <strong>Analytics Data:</strong> 2 years in anonymized
                      form
                    </li>
                    <li>
                      <strong>Payment Data:</strong> 7 years for tax and legal
                      compliance
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Deletion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>When we delete your data:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Personal information is permanently removed</li>
                    <li>Anonymized data may be retained for analytics</li>
                    <li>Legal requirements may require longer retention</li>
                    <li>Backup data is securely deleted within 90 days</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'gdpr-compliance':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">GDPR Compliance</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Legal Basis for Processing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We process data based on:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>Consent:</strong> For marketing communications and
                      cookies
                    </li>
                    <li>
                      <strong>Contract:</strong> To provide our services
                    </li>
                    <li>
                      <strong>Legitimate Interest:</strong> For platform
                      improvement and security
                    </li>
                    <li>
                      <strong>Legal Obligation:</strong> For compliance with
                      laws
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Protection Measures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We implement:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Data encryption in transit and at rest</li>
                    <li>Access controls and authentication</li>
                    <li>Regular security assessments</li>
                    <li>Staff training on data protection</li>
                    <li>Incident response procedures</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Protection Officer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    For GDPR-related inquiries, contact our Data Protection
                    Officer:
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>dpo@eventpros.co.nz</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              How we collect, use, and protect your personal information on
              EventProsNZ
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Last updated: December 19, 2024
              </Badge>
              <Badge variant="secondary">GDPR Compliant</Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {sections.map(section => {
                      const Icon = section.icon;
                      return (
                        <Button
                          key={section.id}
                          variant={
                            activeSection === section.id ? 'default' : 'ghost'
                          }
                          className="w-full justify-start"
                          onClick={() => setActiveSection(section.id)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {section.title}
                        </Button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-8">{renderSection()}</CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <Separator className="mb-6" />
            <p className="text-sm text-gray-500">
              For privacy-related questions, contact us at{' '}
              <a
                href="mailto:privacy@eventpros.co.nz"
                className="text-blue-600 hover:underline"
              >
                privacy@eventpros.co.nz
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
