'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Edit,
  BarChart3,
  MapPin,
  Users,
} from 'lucide-react';

interface EventEmail {
  id: string;
  type:
    | 'creation_confirmation'
    | 'update_notification'
    | 'reminder'
    | 'completion'
    | 'feedback';
  name: string;
  subject: string;
  status: 'active' | 'paused' | 'draft';
  sentCount: number;
  openRate: number;
  clickRate: number;
  templateId: string;
  triggerEvent: string;
  timing: string;
}

interface EventEmailsProps {
  eventId?: string;
  onEmailSent?: (emailId: string, type: string) => void;
}

export function EventEmails({ eventId, onEmailSent }: EventEmailsProps) {
  const [emails, setEmails] = useState<EventEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const mockEmails: EventEmail[] = [
      {
        id: '1',
        type: 'creation_confirmation',
        name: 'Event Creation Confirmation',
        subject: 'Your event has been created successfully',
        status: 'active',
        sentCount: 1850,
        openRate: 75.2,
        clickRate: 32.1,
        templateId: 'event-creation',
        triggerEvent: 'event_created',
        timing: 'Immediate',
      },
      {
        id: '2',
        type: 'update_notification',
        name: 'Event Update Notification',
        subject: 'Your event details have been updated',
        status: 'active',
        sentCount: 1420,
        openRate: 68.7,
        clickRate: 28.9,
        templateId: 'event-update',
        triggerEvent: 'event_updated',
        timing: 'Immediate',
      },
      {
        id: '3',
        type: 'reminder',
        name: 'Event Reminder',
        subject: 'Reminder: Your event is coming up',
        status: 'active',
        sentCount: 2100,
        openRate: 62.4,
        clickRate: 25.6,
        templateId: 'event-reminder',
        triggerEvent: 'event_reminder',
        timing: '24h before',
      },
      {
        id: '4',
        type: 'completion',
        name: 'Event Completion',
        subject: 'Thank you for using EventProsNZ',
        status: 'active',
        sentCount: 1680,
        openRate: 71.3,
        clickRate: 29.8,
        templateId: 'event-completion',
        triggerEvent: 'event_completed',
        timing: 'Immediate',
      },
      {
        id: '5',
        type: 'feedback',
        name: 'Event Feedback Request',
        subject: 'How was your event experience?',
        status: 'active',
        sentCount: 1520,
        openRate: 58.9,
        clickRate: 22.4,
        templateId: 'event-feedback',
        triggerEvent: 'event_feedback_request',
        timing: '48h after',
      },
    ];

    setEmails(mockEmails);
    setLoading(false);
  }, []);

  const handleToggleEmail = async (emailId: string) => {
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId
          ? {
              ...email,
              status: email.status === 'active' ? 'paused' : 'active',
            }
          : email
      )
    );
  };

  const handleSendTestEmail = (emailId: string) => {
    console.log('Send test email:', emailId);
  };

  const handlePreviewEmail = (emailId: string) => {
    console.log('Preview email:', emailId);
  };

  const handleEditEmail = (emailId: string) => {
    console.log('Edit email:', emailId);
  };

  const handleViewAnalytics = (emailId: string) => {
    console.log('View analytics for:', emailId);
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'creation_confirmation':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'update_notification':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'reminder':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completion':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'feedback':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEmailTypeColor = (type: string) => {
    switch (type) {
      case 'creation_confirmation':
        return 'bg-green-100 text-green-800';
      case 'update_notification':
        return 'bg-blue-100 text-blue-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'completion':
        return 'bg-green-100 text-green-800';
      case 'feedback':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSent = emails.reduce((sum, email) => sum + email.sentCount, 0);
  const avgOpenRate =
    emails.length > 0
      ? emails.reduce((sum, email) => sum + email.openRate, 0) / emails.length
      : 0;
  const avgClickRate =
    emails.length > 0
      ? emails.reduce((sum, email) => sum + email.clickRate, 0) / emails.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Emails</h2>
          <p className="text-muted-foreground">
            Automated emails for event-related communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Manage Templates
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emails">Email Types</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sent
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalSent.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +15% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Open Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgOpenRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +4.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Click Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgClickRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +2.8% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Email Performance</CardTitle>
              <CardDescription>
                Performance metrics for different event-related email types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emails.map(email => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getEmailTypeIcon(email.type)}
                      <div>
                        <h4 className="font-medium">{email.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {email.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {email.timing}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {email.sentCount.toLocaleString()} sent
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {email.openRate}% open • {email.clickRate}% click
                        </div>
                      </div>
                      <Badge className={getEmailTypeColor(email.type)}>
                        {email.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <div className="space-y-4">
            {emails.map(email => (
              <Card key={email.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getEmailTypeIcon(email.type)}
                      <div>
                        <h3 className="font-semibold">{email.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {email.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              email.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {email.status}
                          </Badge>
                          <Badge className={getEmailTypeColor(email.type)}>
                            {email.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {email.timing}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-4">
                        <div className="text-sm font-medium">
                          {email.sentCount.toLocaleString()} sent
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {email.openRate}% open • {email.clickRate}% click
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendTestEmail(email.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviewEmail(email.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEmail(email.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAnalytics(email.id)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>
                Performance metrics for each event email type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emails.map(email => (
                  <div key={email.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getEmailTypeIcon(email.type)}
                        <h4 className="font-medium">{email.name}</h4>
                      </div>
                      <Badge className={getEmailTypeColor(email.type)}>
                        {email.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Sent</div>
                        <div className="font-medium">
                          {email.sentCount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Open Rate</div>
                        <div className="font-medium">{email.openRate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Click Rate</div>
                        <div className="font-medium">{email.clickRate}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Timing</div>
                        <div className="font-medium text-xs">
                          {email.timing}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
