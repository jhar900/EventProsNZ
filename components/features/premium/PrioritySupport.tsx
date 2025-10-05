'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Headphones,
  Clock,
  MessageSquare,
  Plus,
  Send,
} from 'lucide-react';

interface PrioritySupportProps {
  userId?: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupportFeatures {
  priority_level: string;
  response_time: string;
  features: any[];
}

export function PrioritySupport({ userId }: PrioritySupportProps) {
  const [supportFeatures, setSupportFeatures] =
    useState<SupportFeatures | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: '',
  });

  useEffect(() => {
    loadSupportFeatures();
    loadTickets();
  }, [userId]);

  const loadSupportFeatures = async () => {
    try {
      const response = await fetch(
        `/api/features/support?user_id=${userId || ''}`
      );
      if (!response.ok) {
        throw new Error('Failed to load support features');
      }

      const data = await response.json();
      setSupportFeatures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      // This would typically be a separate endpoint for tickets
      // For now, we'll simulate with empty array
      setTickets([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) return;

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/features/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newTicket.subject,
          description: newTicket.description,
          priority:
            newTicket.priority || supportFeatures?.priority_level || 'standard',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create support ticket');
      }

      const data = await response.json();
      setTickets(prev => [data.ticket, ...prev]);
      setNewTicket({ subject: '', description: '', priority: '' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading support features...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Support Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Headphones className="h-6 w-6 text-blue-500" />
            <span>Priority Support</span>
          </CardTitle>
          <CardDescription>
            Get help when you need it with priority support
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supportFeatures ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-lg font-semibold">
                    {supportFeatures.response_time}
                  </p>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Badge
                  className={getPriorityColor(supportFeatures.priority_level)}
                >
                  {supportFeatures.priority_level.toUpperCase()}
                </Badge>
                <div>
                  <p className="text-lg font-semibold">Priority Level</p>
                  <p className="text-sm text-muted-foreground">
                    Support Priority
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Headphones className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Support Features Not Available
              </h3>
              <p className="text-gray-500 mb-4">
                Upgrade to a premium plan to access priority support.
              </p>
              <Button>Upgrade Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Support Ticket */}
      {supportFeatures && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Create Support Ticket</span>
                </CardTitle>
                <CardDescription>
                  Get help with your account or technical issues
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Ticket</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showCreateForm ? (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newTicket.subject}
                    onChange={e =>
                      setNewTicket(prev => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTicket.description}
                    onChange={e =>
                      setNewTicket(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Please provide detailed information about your issue..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={newTicket.priority}
                    onChange={e =>
                      setNewTicket(prev => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    <Send className="h-4 w-4 mr-2" />
                    Submit Ticket
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Need Help?
                </h3>
                <p className="text-gray-500 mb-4">
                  Create a support ticket and we&apos;ll get back to you within{' '}
                  {supportFeatures?.response_time}.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Support Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Support Tickets */}
      {tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Support Tickets</CardTitle>
            <CardDescription>
              Track the status of your support requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{ticket.subject}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {ticket.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {new Date(ticket.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support Features */}
      {supportFeatures?.features && supportFeatures.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Support Features</CardTitle>
            <CardDescription>
              Premium support features included in your plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {supportFeatures.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <Headphones className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{feature.feature_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {feature.feature_description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
