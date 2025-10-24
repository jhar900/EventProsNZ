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
  Megaphone,
  Settings,
  AlertTriangle,
  Shield,
  Send,
  Eye,
  Edit,
  BarChart3,
  Bell,
  Newspaper,
} from 'lucide-react';

interface PlatformAnnouncementEmail {
  id: string;
  type:
    | 'feature_announcement'
    | 'maintenance'
    | 'policy_update'
    | 'security_alert'
    | 'newsletter';
  name: string;
  subject: string;
  status: 'active' | 'paused' | 'draft';
  sentCount: number;
  openRate: number;
  clickRate: number;
  templateId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string;
}

interface PlatformAnnouncementEmailsProps {
  onEmailSent?: (emailId: string, type: string) => void;
}

export function PlatformAnnouncementEmails({
  onEmailSent,
}: PlatformAnnouncementEmailsProps) {
  const [emails, setEmails] = useState<PlatformAnnouncementEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const mockEmails: PlatformAnnouncementEmail[] = [
      {
        id: '1',
        type: 'feature_announcement',
        name: 'New Feature Announcement',
        subject: 'Exciting new features are now available!',
        status: 'active',
        sentCount: 3200,
        openRate: 45.2,
        clickRate: 18.7,
        templateId: 'feature-announcement',
        priority: 'medium',
        targetAudience: 'All users',
      },
      {
        id: '2',
        type: 'maintenance',
        name: 'Scheduled Maintenance',
        subject: 'Scheduled maintenance notification',
        status: 'active',
        sentCount: 4500,
        openRate: 72.8,
        clickRate: 25.4,
        templateId: 'maintenance-notification',
        priority: 'high',
        targetAudience: 'All users',
      },
      {
        id: '3',
        type: 'policy_update',
        name: 'Policy Update',
        subject: 'Important policy updates',
        status: 'active',
        sentCount: 2800,
        openRate: 58.3,
        clickRate: 22.1,
        templateId: 'policy-update',
        priority: 'medium',
        targetAudience: 'All users',
      },
      {
        id: '4',
        type: 'security_alert',
        name: 'Security Alert',
        subject: 'Important security update',
        status: 'active',
        sentCount: 1200,
        openRate: 89.5,
        clickRate: 45.2,
        templateId: 'security-alert',
        priority: 'urgent',
        targetAudience: 'All users',
      },
      {
        id: '5',
        type: 'newsletter',
        name: 'Monthly Newsletter',
        subject: 'EventProsNZ Monthly Update',
        status: 'active',
        sentCount: 5600,
        openRate: 38.9,
        clickRate: 15.6,
        templateId: 'newsletter',
        priority: 'low',
        targetAudience: 'Subscribed users',
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
      case 'feature_announcement':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-500" />;
      case 'policy_update':
        return <Newspaper className="h-4 w-4 text-purple-500" />;
      case 'security_alert':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'newsletter':
        return <Mail className="h-4 w-4 text-green-500" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const getEmailTypeColor = (type: string) => {
    switch (type) {
      case 'feature_announcement':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'policy_update':
        return 'bg-purple-100 text-purple-800';
      case 'security_alert':
        return 'bg-red-100 text-red-800';
      case 'newsletter':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
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
          <h2 className="text-2xl font-bold">Platform Announcement Emails</h2>
          <p className="text-muted-foreground">
            Automated emails for platform updates and announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Create Announcement
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
                  +18% from last month
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
                  +2.8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Click Rate
                </CardTitle>
                <Megaphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgClickRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +1.9% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Announcement Email Performance</CardTitle>
              <CardDescription>
                Performance metrics for different platform announcement email
                types
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
                            {email.targetAudience}
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
                      <Badge className={getPriorityColor(email.priority)}>
                        {email.priority}
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
                          <Badge className={getPriorityColor(email.priority)}>
                            {email.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {email.targetAudience}
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
                Performance metrics for each platform announcement email type
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
                      <div className="flex gap-2">
                        <Badge className={getEmailTypeColor(email.type)}>
                          {email.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(email.priority)}>
                          {email.priority}
                        </Badge>
                      </div>
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
                        <div className="text-muted-foreground">Audience</div>
                        <div className="font-medium text-xs">
                          {email.targetAudience}
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
