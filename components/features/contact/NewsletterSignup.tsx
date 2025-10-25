'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  Bell,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface NewsletterSignupProps {
  className?: string;
}

const newsletterPreferences = [
  {
    id: 'tips',
    label: 'Event Planning Tips & Best Practices',
    description: 'Weekly tips to improve your event planning skills',
  },
  {
    id: 'updates',
    label: 'Platform Updates & New Features',
    description: 'Stay informed about new features and improvements',
  },
  {
    id: 'success',
    label: 'Success Stories & Case Studies',
    description: 'Real stories from successful events on our platform',
  },
  {
    id: 'industry',
    label: 'Industry News & Trends',
    description: 'Latest news and trends in the New Zealand event industry',
  },
  {
    id: 'contractors',
    label: 'New Contractor Spotlights',
    description: 'Meet new contractors joining our platform',
  },
  {
    id: 'events',
    label: 'Upcoming Events & Webinars',
    description: 'Information about events and educational webinars',
  },
];

export default function NewsletterSignup({ className }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (preferences.length === 0) {
      setError('Please select at least one newsletter preference');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          preferences,
          source: 'contact_page',
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
        setPreferences([]);
        setError('');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      // console.error('Failed to sign up for newsletter:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreferenceChange = (preferenceId: string, checked: boolean) => {
    if (checked) {
      setPreferences(prev => [...prev, preferenceId]);
    } else {
      setPreferences(prev => prev.filter(id => id !== preferenceId));
    }
  };

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Stay in the Loop</CardTitle>
        <p className="text-gray-600">
          Subscribe to our newsletter for the latest event planning tips,
          platform updates, and industry insights.
        </p>
      </CardHeader>
      <CardContent>
        {submitStatus === 'success' && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Thank you for subscribing! You&apos;ll receive our newsletter
              updates soon.
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Sorry, there was an error subscribing to our newsletter. Please
              try again.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <Label htmlFor="newsletter-email">Email Address *</Label>
            <Input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError('');
              }}
              className={
                error && error.includes('email') ? 'border-red-500' : ''
              }
              placeholder="your.email@example.com"
            />
            {error &&
              (error.includes('Email') ||
                error.includes('email') ||
                error.includes('valid') ||
                error.includes('Please enter')) && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
          </div>

          {/* Newsletter Preferences */}
          <div>
            <Label className="text-base font-semibold mb-4 block">
              What would you like to hear about? *
            </Label>
            <div className="space-y-4">
              {newsletterPreferences.map(preference => (
                <div key={preference.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={preference.id}
                    checked={preferences.includes(preference.id)}
                    onCheckedChange={checked =>
                      handlePreferenceChange(preference.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={preference.id}
                      className="font-medium cursor-pointer"
                    >
                      {preference.label}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {preference.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {error &&
              (error.includes('preference') ||
                error.includes('Please select') ||
                error.includes('newsletter') ||
                error.includes('at least one')) && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              What you&apos;ll get:
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Weekly event planning tips and best practices</li>
              <li>• Early access to new platform features</li>
              <li>• Success stories from real events</li>
              <li>• Industry insights and trends</li>
              <li>• Exclusive contractor spotlights</li>
            </ul>
          </div>

          {/* Frequency Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              We send newsletters weekly, with special updates as needed.
            </span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Subscribe to Newsletter
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            You can unsubscribe at any time. We respect your privacy and never
            share your email.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
