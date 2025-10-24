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
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  Edit,
  BarChart3,
} from 'lucide-react';

interface JobApplicationEmail {
  id: string;
  type: 'confirmation' | 'status_update' | 'reminder' | 'success' | 'rejection';
  name: string;
  subject: string;
  status: 'active' | 'paused' | 'draft';
  sentCount: number;
  openRate: number;
  clickRate: number;
  templateId: string;
  triggerEvent: string;
}

interface JobApplicationEmailsProps {
  applicationId?: string;
  onEmailSent?: (emailId: string, type: string) => void;
}

export function JobApplicationEmails({
  applicationId,
  onEmailSent,
}: JobApplicationEmailsProps) {
  const [emails, setEmails] = useState<JobApplicationEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const mockEmails: JobApplicationEmail[] = [
      {
        id: '1',
        type: 'confirmation',
        name: 'Application Confirmation',
        subject: 'Your job application has been received',
        status: 'active',
        sentCount: 2450,
        openRate: 72.3,
        clickRate: 28.7,
        templateId: 'job-confirmation',
        triggerEvent: 'application_submitted',
      },
      {
        id: '2',
        type: 'status_update',
        name: 'Application Status Update',
        subject: 'Update on your job application',
        status: 'active',
        sentCount: 1890,
        openRate: 65.1,
        clickRate: 22.4,
        templateId: 'job-status-update',
        triggerEvent: 'application_status_changed',
      },
      {
        id: '3',
        type: 'reminder',
        name: 'Application Reminder',
        subject: "Don't forget to complete your application",
        status: 'active',
        sentCount: 1200,
        openRate: 58.9,
        clickRate: 19.2,
        templateId: 'job-reminder',
        triggerEvent: 'application_incomplete',
      },
      {
        id: '4',
        type: 'success',
        name: 'Application Success',
        subject: 'Congratulations! Your application was successful',
        status: 'active',
        sentCount: 890,
        openRate: 78.5,
        clickRate: 35.2,
        templateId: 'job-success',
        triggerEvent: 'application_accepted',
      },
      {
        id: '5',
        type: 'rejection',
        name: 'Application Rejection',
        subject: 'Update on your job application',
        status: 'active',
        sentCount: 1560,
        openRate: 45.2,
        clickRate: 12.8,
        templateId: 'job-rejection',
        triggerEvent: 'application_rejected',
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
      case 'confirmation':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'status_update':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'reminder':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejection':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEmailTypeColor = (type: string) => {
    switch (type) {
      case 'confirmation':
        return 'bg-green-100 text-green-800';
      case 'status_update':
        return 'bg-blue-100 text-blue-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'rejection':
        return 'bg-red-100 text-red-800';
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
          <h2 className="text-2xl font-bold">Job Application Emails</h2>
          <p className="text-muted-foreground">
            Automated emails for job application workflows
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
                  +8% from last month
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
                  +3.2% from last month
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
                  +1.5% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Performance by Type</CardTitle>
              <CardDescription>
                Performance metrics for different job application email types
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
                            Trigger: {email.triggerEvent}
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
                Performance metrics for each job application email type
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
                        <div className="text-muted-foreground">Trigger</div>
                        <div className="font-medium text-xs">
                          {email.triggerEvent.replace('_', ' ')}
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
