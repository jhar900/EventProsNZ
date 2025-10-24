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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Clock,
  Users,
  TrendingUp,
  Settings,
  Play,
  Pause,
  Edit,
  Eye,
  BarChart3,
} from 'lucide-react';

interface WelcomeEmail {
  id: string;
  name: string;
  subject: string;
  delay: number; // hours
  status: 'active' | 'paused' | 'draft';
  sentCount: number;
  openRate: number;
  clickRate: number;
  templateId: string;
  userType: 'event_manager' | 'contractor' | 'both';
}

interface WelcomeEmailSeriesProps {
  userId?: string;
  userType?: 'event_manager' | 'contractor';
  onEmailSent?: (emailId: string) => void;
  onSeriesComplete?: () => void;
}

export function WelcomeEmailSeries({
  userId,
  userType = 'event_manager',
  onEmailSent,
  onSeriesComplete,
}: WelcomeEmailSeriesProps) {
  const [emails, setEmails] = useState<WelcomeEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockEmails: WelcomeEmail[] = [
      {
        id: '1',
        name: 'Welcome to EventProsNZ',
        subject: "Welcome to EventProsNZ - Let's Get Started!",
        delay: 0,
        status: 'active',
        sentCount: 1250,
        openRate: 68.5,
        clickRate: 24.3,
        templateId: 'welcome-1',
        userType: 'both',
      },
      {
        id: '2',
        name: 'Platform Tour',
        subject: 'Take a tour of your new dashboard',
        delay: 24,
        status: 'active',
        sentCount: 1180,
        openRate: 45.2,
        clickRate: 18.7,
        templateId: 'welcome-2',
        userType: 'both',
      },
      {
        id: '3',
        name: 'First Steps',
        subject: 'Your first steps to success',
        delay: 72,
        status: 'active',
        sentCount: 1100,
        openRate: 52.1,
        clickRate: 22.4,
        templateId: 'welcome-3',
        userType: 'both',
      },
      {
        id: '4',
        name: 'Feature Spotlight',
        subject: 'Discover powerful features',
        delay: 168, // 7 days
        status: 'paused',
        sentCount: 950,
        openRate: 38.9,
        clickRate: 15.2,
        templateId: 'welcome-4',
        userType: 'both',
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

  const handleEditEmail = (emailId: string) => {
    // Navigate to email editor
    console.log('Edit email:', emailId);
  };

  const handlePreviewEmail = (emailId: string) => {
    // Open email preview
    console.log('Preview email:', emailId);
  };

  const handleViewAnalytics = (emailId: string) => {
    // Navigate to analytics
    console.log('View analytics for:', emailId);
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
          <h2 className="text-2xl font-bold">Welcome Email Series</h2>
          <p className="text-muted-foreground">
            Automated onboarding emails for new users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Series
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emails">Email Sequence</TabsTrigger>
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
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Open Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgOpenRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Click Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgClickRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +1.8% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Series Performance</CardTitle>
              <CardDescription>
                Overall performance metrics for the welcome email series
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Email 1: Welcome</span>
                    <span>68.5% open rate</span>
                  </div>
                  <Progress value={68.5} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Email 2: Platform Tour</span>
                    <span>45.2% open rate</span>
                  </div>
                  <Progress value={45.2} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Email 3: First Steps</span>
                    <span>52.1% open rate</span>
                  </div>
                  <Progress value={52.1} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Email 4: Feature Spotlight</span>
                    <span>38.9% open rate</span>
                  </div>
                  <Progress value={38.9} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <div className="space-y-4">
            {emails.map((email, index) => (
              <Card key={email.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
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
                          <span className="text-xs text-muted-foreground">
                            {email.delay === 0
                              ? 'Immediate'
                              : `After ${email.delay}h`}
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
                        onClick={() => handleToggleEmail(email.id)}
                      >
                        {email.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
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
              <CardTitle>Email Performance</CardTitle>
              <CardDescription>
                Detailed analytics for each email in the series
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emails.map(email => (
                  <div key={email.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{email.name}</h4>
                      <Badge
                        variant={
                          email.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {email.status}
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
                        <div className="text-muted-foreground">Delay</div>
                        <div className="font-medium">
                          {email.delay === 0 ? 'Immediate' : `${email.delay}h`}
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
