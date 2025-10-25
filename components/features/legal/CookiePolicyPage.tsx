'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Cookie,
  Settings,
  BarChart3,
  Shield,
  Eye,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

export function CookiePolicyPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  const sections = [
    { id: 'overview', title: 'Overview', icon: Cookie },
    { id: 'cookie-types', title: 'Cookie Types', icon: Settings },
    { id: 'cookie-usage', title: 'Cookie Usage', icon: BarChart3 },
    { id: 'cookie-management', title: 'Cookie Management', icon: Shield },
    { id: 'third-party', title: 'Third-Party Cookies', icon: Eye },
    { id: 'compliance', title: 'Compliance', icon: CheckCircle },
  ];

  const cookieTypes = [
    {
      id: 'essential',
      name: 'Essential Cookies',
      description: 'Required for basic website functionality',
      required: true,
      examples: ['Authentication', 'Security', 'Load balancing'],
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors use our website',
      required: false,
      examples: [
        'Google Analytics',
        'Usage tracking',
        'Performance monitoring',
      ],
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements',
      required: false,
      examples: ['Advertising networks', 'Social media', 'Retargeting'],
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization',
      required: false,
      examples: ['Preferences', 'Language settings', 'User interface'],
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-orange-900 mb-4">
                Cookie Policy Overview
              </h2>
              <p className="text-orange-800 mb-4">
                This Cookie Policy explains how EventProsNZ uses cookies and
                similar technologies to enhance your browsing experience and
                provide our services.
              </p>
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <Calendar className="h-4 w-4" />
                <span>Last updated: December 19, 2024</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cookie className="h-5 w-5" />
                    What Are Cookies?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Cookies are small text files stored on your device that help
                    us provide a better user experience and analyze website
                    usage.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Your Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    You can control cookie preferences through our cookie
                    management interface or your browser settings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'cookie-types':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Cookie Types</h2>

            <div className="space-y-6">
              {cookieTypes.map(type => (
                <Card key={type.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Cookie className="h-5 w-5" />
                        {type.name}
                        {type.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>{type.description}</p>
                    <div>
                      <p className="font-medium mb-2">Examples:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        {type.examples.map((example, index) => (
                          <li key={index} className="text-sm">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'cookie-usage':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Cookie Usage</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Essential Cookies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    These cookies are necessary for the website to function:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>User authentication and session management</li>
                    <li>Security and fraud prevention</li>
                    <li>Load balancing and performance</li>
                    <li>Basic website functionality</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics Cookies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Help us understand website usage:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Page views and user interactions</li>
                    <li>Traffic sources and user journeys</li>
                    <li>Performance metrics and optimization</li>
                    <li>Error tracking and debugging</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Marketing Cookies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Used for advertising and marketing:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Personalized advertisements</li>
                    <li>Social media integration</li>
                    <li>Email marketing campaigns</li>
                    <li>Conversion tracking</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Functional Cookies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Enhance user experience:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>User preferences and settings</li>
                    <li>Language and region selection</li>
                    <li>Customized content delivery</li>
                    <li>Enhanced functionality</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'cookie-management':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Cookie Management</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cookie Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p>Manage your cookie preferences:</p>

                  {cookieTypes.map(type => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{type.name}</h4>
                          {type.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {type.description}
                        </p>
                      </div>
                      <Switch
                        checked={
                          cookiePreferences[
                            type.id as keyof typeof cookiePreferences
                          ]
                        }
                        onCheckedChange={checked => {
                          if (!type.required) {
                            setCookiePreferences(prev => ({
                              ...prev,
                              [type.id]: checked,
                            }));
                          }
                        }}
                        disabled={type.required}
                      />
                    </div>
                  ))}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setCookiePreferences({
                          essential: true,
                          analytics: false,
                          marketing: false,
                          functional: false,
                        });
                      }}
                    >
                      Accept Essential Only
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCookiePreferences({
                          essential: true,
                          analytics: true,
                          marketing: true,
                          functional: true,
                        });
                      }}
                    >
                      Accept All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Browser Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>You can also manage cookies through your browser:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Block all cookies</li>
                    <li>Block third-party cookies</li>
                    <li>Delete existing cookies</li>
                    <li>Set cookie expiration preferences</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'third-party':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Third-Party Cookies</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Google Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We use Google Analytics to understand website usage:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Page views and user behavior</li>
                    <li>Traffic sources and demographics</li>
                    <li>Performance metrics</li>
                    <li>Custom event tracking</li>
                  </ul>
                  <p className="text-sm text-gray-600">
                    <a
                      href="https://policies.google.com/privacy"
                      className="text-blue-600 hover:underline"
                    >
                      Google Privacy Policy
                    </a>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stripe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Payment processing cookies:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Secure payment processing</li>
                    <li>Fraud prevention</li>
                    <li>Transaction security</li>
                  </ul>
                  <p className="text-sm text-gray-600">
                    <a
                      href="https://stripe.com/privacy"
                      className="text-blue-600 hover:underline"
                    >
                      Stripe Privacy Policy
                    </a>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Social media integration cookies:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Social sharing functionality</li>
                    <li>Social media authentication</li>
                    <li>Social media advertising</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Compliance</h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>GDPR Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>We comply with GDPR requirements:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Clear consent for non-essential cookies</li>
                    <li>Easy withdrawal of consent</li>
                    <li>Transparent cookie information</li>
                    <li>Data protection measures</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CCPA Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>California Consumer Privacy Act compliance:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Right to know about cookies</li>
                    <li>Right to opt-out of cookie sales</li>
                    <li>Non-discrimination for opt-outs</li>
                    <li>Clear privacy notices</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cookie Consent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Our cookie consent system:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Granular cookie control</li>
                    <li>Consent withdrawal options</li>
                    <li>Consent record keeping</li>
                    <li>Regular consent renewal</li>
                  </ul>
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
              Cookie Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              How we use cookies and similar technologies on EventProsNZ
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
              For cookie-related questions, contact us at{' '}
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
