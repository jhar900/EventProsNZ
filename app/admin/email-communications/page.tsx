'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  BarChart3,
  Settings,
  Plus,
  Send,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

// Import email components
import { WelcomeEmailSeries } from '@/components/features/email/WelcomeEmailSeries';
import { JobApplicationEmails } from '@/components/features/email/JobApplicationEmails';
import { EventEmails } from '@/components/features/email/EventEmails';
import { SubscriptionEmails } from '@/components/features/email/SubscriptionEmails';
import { PlatformAnnouncementEmails } from '@/components/features/email/PlatformAnnouncementEmails';
import { EmailPreferences } from '@/components/features/email/EmailPreferences';
import { EmailTemplateCustomizer } from '@/components/features/email/EmailTemplateCustomizer';
import { EmailDeliveryTracker } from '@/components/features/email/EmailDeliveryTracker';

export default function EmailCommunicationsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Communications</h1>
          <p className="text-muted-foreground">
            Manage automated email communications and templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="welcome">Welcome</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="subscriptions">Billing</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Emails Sent
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,230</div>
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
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68.5%</div>
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
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.7%</div>
                <p className="text-xs text-muted-foreground">
                  +1.8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Templates
                </CardTitle>
                <Edit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground">Email templates</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Performance by Type</CardTitle>
                <CardDescription>
                  Performance metrics for different email categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Welcome Emails</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">68.5% open</div>
                      <div className="text-sm text-muted-foreground">
                        2,450 sent
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Job Applications</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">72.3% open</div>
                      <div className="text-sm text-muted-foreground">
                        1,890 sent
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Event Emails</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">75.2% open</div>
                      <div className="text-sm text-muted-foreground">
                        1,850 sent
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Subscription Emails</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">78.5% open</div>
                      <div className="text-sm text-muted-foreground">
                        1,250 sent
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Email Activity</CardTitle>
                <CardDescription>
                  Latest email communications sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Welcome Email Series</div>
                      <div className="text-sm text-muted-foreground">
                        Sent to 25 new users
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      2 hours ago
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        Job Application Confirmation
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sent to 12 applicants
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      4 hours ago
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        Event Creation Notification
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sent to 8 event managers
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      6 hours ago
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        Subscription Billing Reminder
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sent to 45 subscribers
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      1 day ago
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="welcome">
          <WelcomeEmailSeries />
        </TabsContent>

        <TabsContent value="jobs">
          <JobApplicationEmails />
        </TabsContent>

        <TabsContent value="events">
          <EventEmails />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionEmails />
        </TabsContent>

        <TabsContent value="announcements">
          <PlatformAnnouncementEmails />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplateCustomizer />
        </TabsContent>

        <TabsContent value="analytics">
          <EmailDeliveryTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
