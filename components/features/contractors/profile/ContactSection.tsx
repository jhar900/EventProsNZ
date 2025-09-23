'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';

interface ContactSectionProps {
  contractorId: string;
  contractorEmail?: string;
  contractorPhone?: string;
  contractorWebsite?: string;
  contractorAddress?: string;
  className?: string;
  onError?: (error: Error) => void;
}

interface InquiryFormData {
  subject: string;
  message: string;
}

export function ContactSection({
  contractorId,
  contractorEmail,
  contractorPhone,
  contractorWebsite,
  contractorAddress,
  className = '',
  onError,
}: ContactSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<InquiryFormData>({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: keyof InquiryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear status when user starts typing
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  const validateForm = (): string | null => {
    if (!formData.subject.trim()) {
      return 'Subject is required';
    }
    if (formData.subject.length > 200) {
      return 'Subject must be 200 characters or less';
    }
    if (!formData.message.trim()) {
      return 'Message is required';
    }
    if (formData.message.length > 2000) {
      return 'Message must be 2000 characters or less';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setSubmitStatus('error');
      setErrorMessage('Please log in to send an inquiry');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setSubmitStatus('error');
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/contractors/${contractorId}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ subject: '', message: '' });
      } else {
        const errorMessage = data.error || 'Failed to send inquiry';
        setSubmitStatus('error');
        setErrorMessage(errorMessage);
        if (onError) {
          onError(new Error(errorMessage));
        }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setSubmitStatus('error');
      setErrorMessage(errorMessage);
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    // Redirect to login page with return URL
    window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
  };

  return (
    <div className={`contact-section ${className}`}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Get in Touch
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 mb-4">
              Contact Information
            </h4>

            <div className="space-y-3">
              {contractorEmail && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a
                      href={`mailto:${contractorEmail}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {contractorEmail}
                    </a>
                  </div>
                </div>
              )}

              {contractorPhone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a
                      href={`tel:${contractorPhone}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {contractorPhone}
                    </a>
                  </div>
                </div>
              )}

              {contractorWebsite && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a
                      href={contractorWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {contractorWebsite}
                    </a>
                  </div>
                </div>
              )}

              {contractorAddress && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-gray-900 font-medium">
                      {contractorAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Response Time Info */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Quick Response
                  </p>
                  <p className="text-xs text-green-600">
                    Typically responds within 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Send an Inquiry</h4>

            {!isAuthenticated ? (
              <div className="p-6 bg-blue-50 rounded-lg text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h5 className="font-medium text-gray-900 mb-2">
                  Login Required
                </h5>
                <p className="text-sm text-gray-600 mb-4">
                  Please log in to send an inquiry to this contractor.
                </p>
                <Button
                  onClick={handleLoginRedirect}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Log In to Contact
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label
                    htmlFor="subject"
                    className="text-sm font-medium text-gray-700"
                  >
                    Subject *
                  </Label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={e => handleInputChange('subject', e.target.value)}
                    placeholder="What's your inquiry about?"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.subject.length}/200 characters
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="message"
                    className="text-sm font-medium text-gray-700"
                  >
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={e => handleInputChange('message', e.target.value)}
                    placeholder="Tell us about your event and what you're looking for..."
                    rows={6}
                    className="mt-1"
                    maxLength={2000}
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.message.length}/2000 characters
                  </p>
                </div>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <p className="text-sm text-green-800">
                        Your inquiry has been sent successfully! The contractor
                        will respond soon.
                      </p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-sm text-red-800">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.subject.trim() ||
                    !formData.message.trim()
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Inquiry'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Additional Contact Options */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">
            Other Ways to Connect
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call Now
            </Button>
            <Button variant="outline" className="justify-start">
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Email Directly
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
