'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Shield,
  Users,
  AlertTriangle,
  Scale,
  Mail,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: FileText },
    { id: 'user-agreement', title: 'User Agreement', icon: Users },
    { id: 'platform-rules', title: 'Platform Rules', icon: Shield },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      icon: Scale,
    },
    { id: 'liability', title: 'Liability', icon: AlertTriangle },
    {
      id: 'dispute-resolution',
      title: 'Dispute Resolution',
      icon: CheckCircle,
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">
                Terms of Service Overview
              </h2>
              <p className="text-blue-800 mb-4">
                Welcome to EventProsNZ. These Terms of Service
                (&quot;Terms&quot;) govern your use of our platform and
                services. By accessing or using our platform, you agree to be
                bound by these Terms.
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Calendar className="h-4 w-4" />
                <span>Last updated: December 19, 2024</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Provide accurate information</li>
                    <li>• Comply with platform rules</li>
                    <li>• Respect other users</li>
                    <li>• Maintain account security</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Platform Rights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Monitor platform activity</li>
                    <li>• Enforce terms and conditions</li>
                    <li>• Protect user safety</li>
                    <li>• Maintain service quality</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'user-agreement':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">User Agreement</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>By creating an account on EventProsNZ, you agree to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate, current, and complete information</li>
                    <li>
                      Maintain and update your information to keep it accurate
                    </li>
                    <li>
                      Be responsible for all activities under your account
                    </li>
                    <li>Notify us immediately of any unauthorized use</li>
                    <li>Be at least 18 years old or have parental consent</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Conduct</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the platform for illegal purposes</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Post false, misleading, or fraudulent content</li>
                    <li>Violate intellectual property rights</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use automated systems to access the platform</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Termination</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    We reserve the right to suspend or terminate your account at
                    any time for violation of these Terms or for any other
                    reason at our discretion.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'platform-rules':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Platform Rules</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>All content posted on EventProsNZ must:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Be relevant to event planning and contractor services
                    </li>
                    <li>Be accurate and truthful</li>
                    <li>Respect the rights of others</li>
                    <li>Comply with applicable laws and regulations</li>
                    <li>
                      Not contain spam, advertising, or promotional content
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prohibited Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>The following activities are strictly prohibited:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Posting false or misleading information</li>
                    <li>Spamming or sending unsolicited messages</li>
                    <li>Attempting to circumvent platform features</li>
                    <li>
                      Sharing personal information of others without consent
                    </li>
                    <li>Engaging in fraudulent or deceptive practices</li>
                    <li>Violating any applicable laws or regulations</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enforcement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    We monitor platform activity and may take action including
                    content removal, account warnings, or account suspension for
                    violations of these rules.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'intellectual-property':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Intellectual Property</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    EventProsNZ and its original content, features, and
                    functionality are owned by EventProsNZ and are protected by
                    international copyright, trademark, patent, trade secret,
                    and other intellectual property laws.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    You retain ownership of content you post on the platform. By
                    posting content, you grant us a non-exclusive, royalty-free
                    license to use, display, and distribute your content in
                    connection with the platform.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Copyright Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    We respect intellectual property rights and expect our users
                    to do the same. If you believe your copyright has been
                    infringed, please contact us with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Description of the copyrighted work</li>
                    <li>Location of the infringing material</li>
                    <li>Your contact information</li>
                    <li>Statement of good faith belief</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'liability':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Liability Limitations</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Disclaimer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    EventProsNZ is provided &quot;as is&quot; without warranties
                    of any kind. We do not guarantee the accuracy, completeness,
                    or reliability of any information on the platform.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    To the maximum extent permitted by law, EventProsNZ shall
                    not be liable for any indirect, incidental, special,
                    consequential, or punitive damages, including but not
                    limited to loss of profits, data, or use.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Responsibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Users are responsible for their own actions and decisions
                    when using the platform. We are not responsible for the
                    quality, safety, or legality of services provided by
                    contractors or the accuracy of information posted by users.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'dispute-resolution':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dispute Resolution</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Governing Law</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    These Terms are governed by the laws of New Zealand. Any
                    disputes will be resolved in the courts of New Zealand.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dispute Process</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>In case of disputes:</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Contact us first to attempt resolution</li>
                    <li>If unresolved, we may attempt mediation</li>
                    <li>As a last resort, legal action may be taken</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>legal@eventpros.co.nz</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    For legal inquiries, please contact us at the email above.
                    We will respond within 5 business days.
                  </p>
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
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive legal terms and user agreement for the EventProsNZ
              platform
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Last updated: December 19, 2024
              </Badge>
              <Badge variant="secondary">Version 1.0</Badge>
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
              By using EventProsNZ, you agree to these Terms of Service. If you
              have any questions, please contact us at{' '}
              <a
                href="mailto:legal@eventpros.co.nz"
                className="text-blue-600 hover:underline"
              >
                legal@eventpros.co.nz
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
