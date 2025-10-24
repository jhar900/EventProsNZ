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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';

interface EmailDeliveryStats {
  id: string;
  emailId: string;
  recipient: string;
  status:
    | 'pending'
    | 'sent'
    | 'delivered'
    | 'bounced'
    | 'complained'
    | 'failed';
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bounceReason?: string;
  complaintReason?: string;
}

interface EmailDeliveryTrackerProps {
  emailId?: string;
  onStatsUpdated?: (stats: EmailDeliveryStats[]) => void;
}

export function EmailDeliveryTracker({
  emailId,
  onStatsUpdated,
}: EmailDeliveryTrackerProps) {
  const [deliveryStats, setDeliveryStats] = useState<EmailDeliveryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const mockStats: EmailDeliveryStats[] = [
      {
        id: '1',
        emailId: 'welcome-1',
        recipient: 'john.doe@example.com',
        status: 'delivered',
        sentAt: '2024-01-20T10:00:00Z',
        deliveredAt: '2024-01-20T10:02:00Z',
        openedAt: '2024-01-20T14:30:00Z',
        clickedAt: '2024-01-20T14:35:00Z',
      },
      {
        id: '2',
        emailId: 'welcome-1',
        recipient: 'jane.smith@example.com',
        status: 'delivered',
        sentAt: '2024-01-20T10:00:00Z',
        deliveredAt: '2024-01-20T10:01:00Z',
        openedAt: '2024-01-20T16:45:00Z',
      },
      {
        id: '3',
        emailId: 'job-confirmation',
        recipient: 'bob.wilson@example.com',
        status: 'bounced',
        sentAt: '2024-01-20T11:00:00Z',
        bounceReason: 'Invalid email address',
      },
      {
        id: '4',
        emailId: 'event-reminder',
        recipient: 'alice.brown@example.com',
        status: 'delivered',
        sentAt: '2024-01-20T12:00:00Z',
        deliveredAt: '2024-01-20T12:01:00Z',
        openedAt: '2024-01-20T18:20:00Z',
        clickedAt: '2024-01-20T18:25:00Z',
      },
      {
        id: '5',
        emailId: 'subscription-billing',
        recipient: 'charlie.davis@example.com',
        status: 'complained',
        sentAt: '2024-01-20T13:00:00Z',
        deliveredAt: '2024-01-20T13:01:00Z',
        complaintReason: 'Marked as spam',
      },
    ];

    setDeliveryStats(mockStats);
    setLoading(false);
  }, []);

  const handleRefreshStats = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleExportStats = () => {
    console.log('Exporting delivery stats...');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'complained':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      case 'complained':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalEmails = deliveryStats.length;
  const deliveredCount = deliveryStats.filter(
    s => s.status === 'delivered'
  ).length;
  const bouncedCount = deliveryStats.filter(s => s.status === 'bounced').length;
  const complainedCount = deliveryStats.filter(
    s => s.status === 'complained'
  ).length;
  const openedCount = deliveryStats.filter(s => s.openedAt).length;
  const clickedCount = deliveryStats.filter(s => s.clickedAt).length;

  const deliveryRate =
    totalEmails > 0 ? (deliveredCount / totalEmails) * 100 : 0;
  const openRate =
    deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0;
  const clickRate =
    deliveredCount > 0 ? (clickedCount / deliveredCount) * 100 : 0;
  const bounceRate = totalEmails > 0 ? (bouncedCount / totalEmails) * 100 : 0;
  const complaintRate =
    totalEmails > 0 ? (complainedCount / totalEmails) * 100 : 0;

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
          <h2 className="text-2xl font-bold">Email Delivery Tracker</h2>
          <p className="text-muted-foreground">
            Track email delivery status and engagement metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportStats}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Status</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sent
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEmails}</div>
                <p className="text-xs text-muted-foreground">Emails sent</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Delivery Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {deliveryRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {deliveredCount} delivered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {openedCount} opened
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Click Rate
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clickRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {clickedCount} clicked
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
                <CardDescription>
                  Breakdown of email delivery status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Delivered</span>
                    </div>
                    <span className="font-medium">{deliveredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Bounced</span>
                    </div>
                    <span className="font-medium">{bouncedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span>Complained</span>
                    </div>
                    <span className="font-medium">{complainedCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Email engagement performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Open Rate</span>
                    <span className="font-medium">{openRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Click Rate</span>
                    <span className="font-medium">{clickRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bounce Rate</span>
                    <span className="font-medium">
                      {bounceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Complaint Rate</span>
                    <span className="font-medium">
                      {complaintRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <div className="space-y-4">
            {deliveryStats.map(stat => (
              <Card key={stat.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(stat.status)}
                      <div>
                        <h3 className="font-semibold">{stat.recipient}</h3>
                        <p className="text-sm text-muted-foreground">
                          Email ID: {stat.emailId}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(stat.status)}>
                            {stat.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Sent: {new Date(stat.sentAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {stat.deliveredAt && (
                          <div>
                            Delivered:{' '}
                            {new Date(stat.deliveredAt).toLocaleString()}
                          </div>
                        )}
                        {stat.openedAt && (
                          <div>
                            Opened: {new Date(stat.openedAt).toLocaleString()}
                          </div>
                        )}
                        {stat.clickedAt && (
                          <div>
                            Clicked: {new Date(stat.clickedAt).toLocaleString()}
                          </div>
                        )}
                        {stat.bounceReason && (
                          <div className="text-red-600">
                            Bounce: {stat.bounceReason}
                          </div>
                        )}
                        {stat.complaintReason && (
                          <div className="text-orange-600">
                            Complaint: {stat.complaintReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Timeline</CardTitle>
              <CardDescription>
                Track when emails were opened and clicked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveryStats
                  .filter(stat => stat.openedAt || stat.clickedAt)
                  .map(stat => (
                    <div key={stat.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{stat.recipient}</h4>
                        <Badge className={getStatusColor(stat.status)}>
                          {stat.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>
                          Sent: {new Date(stat.sentAt).toLocaleString()}
                        </div>
                        {stat.deliveredAt && (
                          <div>
                            Delivered:{' '}
                            {new Date(stat.deliveredAt).toLocaleString()}
                          </div>
                        )}
                        {stat.openedAt && (
                          <div className="text-green-600">
                            Opened: {new Date(stat.openedAt).toLocaleString()}
                          </div>
                        )}
                        {stat.clickedAt && (
                          <div className="text-blue-600">
                            Clicked: {new Date(stat.clickedAt).toLocaleString()}
                          </div>
                        )}
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
