'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  HelpCircle,
  Mail,
  Phone,
  Clock,
  MessageSquare,
  Send,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface TrialSupportProps {
  userId: string;
}

interface SupportResource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  priority: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  hours: string;
  response_time: string;
  priority_support: string;
}

interface PersonalizedRecommendation {
  type: string;
  message: string;
  actions: string[];
}

interface TrialStatus {
  days_remaining: number;
  conversion_likelihood: number;
}

export default function TrialSupport({ userId }: TrialSupportProps) {
  const [supportResources, setSupportResources] = useState<SupportResource[]>(
    []
  );
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [personalizedRecommendations, setPersonalizedRecommendations] =
    useState<PersonalizedRecommendation[]>([]);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });

  useEffect(() => {
    fetchSupportData();
  }, [userId]);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trial/support?user_id=${userId}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSupportResources(data.support_resources || []);
      setContactInfo(data.contact_info || null);
      setPersonalizedRecommendations(data.personalized_recommendations || []);
      setTrialStatus(data.trial_status || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch support data'
      );
    } finally {
      setLoading(false);
    }
  };

  const submitSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supportForm.subject || !supportForm.message) {
      setError('Subject and message are required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/trial/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          subject: supportForm.subject,
          message: supportForm.message,
          priority: supportForm.priority,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Reset form
      setSupportForm({
        subject: '',
        message: '',
        priority: 'normal',
      });

      // Show success message
      setError(null);
      alert('Support ticket submitted successfully!');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit support ticket'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <ExternalLink className="h-4 w-4" />;
      case 'video':
        return <MessageSquare className="h-4 w-4" />;
      case 'faq':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !supportForm.subject && !supportForm.message) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Support Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Trial Support Center
          </CardTitle>
          <CardDescription>
            Get help and support during your trial period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trialStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {trialStatus.days_remaining}
                </div>
                <div className="text-sm text-gray-500">Days Remaining</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(trialStatus.conversion_likelihood * 100)}%
                </div>
                <div className="text-sm text-gray-500">
                  Conversion Likelihood
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      {contactInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Get in touch with our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">{contactInfo.email}</div>
                    <div className="text-sm text-gray-500">Email Support</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">{contactInfo.phone}</div>
                    <div className="text-sm text-gray-500">Phone Support</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">{contactInfo.hours}</div>
                    <div className="text-sm text-gray-500">Support Hours</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-medium">
                      {contactInfo.response_time}
                    </div>
                    <div className="text-sm text-gray-500">Response Time</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Priority Support:</strong>{' '}
                {contactInfo.priority_support}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support Resources */}
      {supportResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Support Resources</CardTitle>
            <CardDescription>
              Helpful guides and resources for your trial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportResources.map(resource => (
                <div
                  key={resource.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-1">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{resource.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {resource.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPriorityColor(resource.priority)}>
                          {resource.priority}
                        </Badge>
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {personalizedRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Support Recommendations</CardTitle>
            <CardDescription>
              Based on your trial progress and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {personalizedRecommendations.map((recommendation, index) => (
                <Alert
                  key={index}
                  className={
                    recommendation.type === 'urgent'
                      ? 'border-red-200 bg-red-50'
                      : 'border-blue-200 bg-blue-50'
                  }
                >
                  <div className="flex items-start gap-2">
                    {recommendation.type === 'urgent' ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">
                        {recommendation.message}
                      </div>
                      <div className="text-sm mt-1">
                        <strong>Recommended Actions:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {recommendation.actions.map((action, actionIndex) => (
                            <li key={actionIndex}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Support Form */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>
            Send us a message and we&apos;ll get back to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitSupportTicket} className="space-y-4">
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Subject
              </label>
              <Input
                id="subject"
                value={supportForm.subject}
                onChange={e =>
                  setSupportForm({ ...supportForm, subject: e.target.value })
                }
                placeholder="What can we help you with?"
                required
              />
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Priority
              </label>
              <select
                id="priority"
                value={supportForm.priority}
                onChange={e =>
                  setSupportForm({ ...supportForm, priority: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message
              </label>
              <Textarea
                id="message"
                value={supportForm.message}
                onChange={e =>
                  setSupportForm({ ...supportForm, message: e.target.value })
                }
                placeholder="Please describe your question or issue..."
                rows={4}
                required
              />
            </div>

            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? 'Submitting...' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
