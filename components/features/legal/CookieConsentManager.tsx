'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Cookie,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  Shield,
  BarChart3,
  Target,
} from 'lucide-react';

interface CookieConsentManagerProps {
  onConsentChange?: (consent: CookieConsent) => void;
  showFullInterface?: boolean;
}

interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const cookieCategories = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    description: 'Required for basic website functionality',
    required: true,
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    examples: [
      'Authentication',
      'Security',
      'Load balancing',
      'Session management',
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description: 'Help us understand how visitors use our website',
    required: false,
    icon: BarChart3,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    examples: [
      'Google Analytics',
      'Usage tracking',
      'Performance monitoring',
      'User behavior',
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description: 'Used to deliver relevant advertisements',
    required: false,
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    examples: [
      'Advertising networks',
      'Social media',
      'Retargeting',
      'Conversion tracking',
    ],
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    description: 'Enable enhanced functionality and personalization',
    required: false,
    icon: Settings,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    examples: [
      'Preferences',
      'Language settings',
      'User interface',
      'Customization',
    ],
  },
];

export function CookieConsentManager({
  onConsentChange,
  showFullInterface = false,
}: CookieConsentManagerProps) {
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check for existing consent
    const existingConsent = localStorage.getItem('cookie-consent');
    if (existingConsent) {
      try {
        const parsedConsent = JSON.parse(existingConsent);
        setConsent(parsedConsent);
        setHasConsented(true);
      } catch (error) {
        // Log error for debugging (in production, use proper logging service)('Error parsing cookie consent:', error);
      }
    } else {
      // Show consent banner if no consent exists
      setIsOpen(true);
    }
  }, []);

  const handleConsentChange = (
    category: keyof CookieConsent,
    value: boolean
  ) => {
    if (category === 'essential') return; // Essential cookies cannot be disabled

    const newConsent = { ...consent, [category]: value };
    setConsent(newConsent);

    if (onConsentChange) {
      onConsentChange(newConsent);
    }
  };

  const handleSaveConsent = async () => {
    try {
      // Save to localStorage
      localStorage.setItem('cookie-consent', JSON.stringify(consent));

      // Save to database
      const response = await fetch('/api/legal/cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consent_data: consent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setHasConsented(true);
        setIsOpen(false);
      }
    } catch (error) {
      // Log error for debugging (in production, use proper logging service)('Error saving cookie consent:', error);
    }
  };

  const handleAcceptAll = () => {
    const allConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setConsent(allConsent);
    handleSaveConsent();
  };

  const handleAcceptEssential = () => {
    const essentialConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setConsent(essentialConsent);
    handleSaveConsent();
  };

  const handleRejectAll = () => {
    const essentialOnlyConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setConsent(essentialOnlyConsent);
    handleSaveConsent();
  };

  if (showFullInterface) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cookie Consent Manager
          </h1>
          <p className="text-gray-600">
            Manage cookie preferences and consent settings.
          </p>
        </div>

        <div className="space-y-6">
          {cookieCategories.map(category => {
            const Icon = category.icon;
            const isEnabled = consent[category.id as keyof CookieConsent];

            return (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.bgColor}`}>
                        <Icon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {category.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {category.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={checked =>
                          handleConsentChange(
                            category.id as keyof CookieConsent,
                            checked
                          )
                        }
                        disabled={category.required}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Examples:</p>
                      <div className="flex flex-wrap gap-2">
                        {category.examples.map((example, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {category.required && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Info className="h-4 w-4" />
                        <span>
                          These cookies are necessary for the website to
                          function properly.
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-4 pt-6">
            <Button onClick={handleAcceptAll} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept All Cookies
            </Button>
            <Button
              onClick={handleAcceptEssential}
              variant="outline"
              className="flex-1"
            >
              <Shield className="h-4 w-4 mr-2" />
              Accept Essential Only
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="flex-1"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reject All
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Consent Banner
  if (!isOpen || hasConsented) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Cookie className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Cookie Consent</h3>
            </div>
            <p className="text-sm text-gray-600">
              We use cookies to enhance your browsing experience and analyze our
              traffic. By clicking &quot;Accept All&quot;, you consent to our
              use of cookies.
            </p>
          </div>

          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
            <Button variant="outline" size="sm" onClick={handleAcceptEssential}>
              Essential Only
            </Button>
            <Button size="sm" onClick={handleAcceptAll}>
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
