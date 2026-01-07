'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  csrfToken?: string;
}

interface ContactFormProps {
  className?: string;
}

export default function ContactForm({ className }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    csrfToken: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/contact');
        const data = await response.json();
        if (data.csrfToken) {
          setFormData(prev => ({ ...prev, csrfToken: data.csrfToken }));
        }
      } catch (error) {
        // console.error('Failed to fetch CSRF token:', error);
      }
    };

    fetchCSRFToken();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof ContactFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': formData.csrfToken || '',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          message: '',
          csrfToken: formData.csrfToken, // Keep the CSRF token
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      // console.error('Failed to submit contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Contact Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitStatus === 'success' && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Thank you for your message! We&apos;ll get back to you within 24
              hours.
            </AlertDescription>
          </Alert>
        )}

        {submitStatus === 'error' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Sorry, there was an error sending your message. Please try again
              or contact us directly.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="+64 9 123 4567"
              />
            </div>

            <div>
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={e => handleInputChange('company', e.target.value)}
                placeholder="Your company name"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={e => handleInputChange('message', e.target.value)}
              className={errors.message ? 'border-red-500' : ''}
              placeholder="Please provide details about your inquiry..."
              rows={6}
            />
            {errors.message && (
              <p className="text-sm text-red-600 mt-1">{errors.message}</p>
            )}
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
                Sending Message...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            By submitting this form, you agree to our privacy policy and terms
            of service.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
