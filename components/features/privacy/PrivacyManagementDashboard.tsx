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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  FileText,
  UserCheck,
  Database,
  Download,
  Cookie,
  Share2,
  Eye,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Settings,
} from 'lucide-react';

interface PrivacyDashboardData {
  gdprCompliance: {
    score: number;
    violations: number;
    lastAudit: string;
    status: 'compliant' | 'warning' | 'non-compliant';
  };
  consentManagement: {
    totalConsents: number;
    activeConsents: number;
    withdrawnConsents: number;
    consentRate: number;
  };
  dataRetention: {
    totalRules: number;
    activeRules: number;
    dataCleanupCount: number;
    lastCleanup: string;
  };
  userRights: {
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    averageProcessingTime: number;
  };
  cookieConsent: {
    totalConsents: number;
    consentRate: number;
    categoryBreakdown: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
  };
  dataSharing: {
    totalAgreements: number;
    activeAgreements: number;
    dataSharingEvents: number;
    complianceRate: number;
  };
  anonymization: {
    totalRules: number;
    anonymizedRecords: number;
    pseudonymizedRecords: number;
    lastAnonymization: string;
  };
  privacyImpactAssessments: {
    totalAssessments: number;
    completedAssessments: number;
    pendingAssessments: number;
    highRiskAssessments: number;
  };
}

interface PrivacyAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
}

export default function PrivacyManagementDashboard() {
  const [dashboardData, setDashboardData] =
    useState<PrivacyDashboardData | null>(null);
  const [alerts, setAlerts] = useState<PrivacyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadAlerts();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch data from the API
      const mockData: PrivacyDashboardData = {
        gdprCompliance: {
          score: 85,
          violations: 3,
          lastAudit: '2024-01-15T10:30:00Z',
          status: 'compliant',
        },
        consentManagement: {
          totalConsents: 1250,
          activeConsents: 1180,
          withdrawnConsents: 70,
          consentRate: 94.4,
        },
        dataRetention: {
          totalRules: 12,
          activeRules: 10,
          dataCleanupCount: 450,
          lastCleanup: '2024-01-14T02:00:00Z',
        },
        userRights: {
          totalRequests: 45,
          pendingRequests: 8,
          completedRequests: 35,
          averageProcessingTime: 2.5,
        },
        cookieConsent: {
          totalConsents: 2100,
          consentRate: 89.2,
          categoryBreakdown: [
            { category: 'Necessary', count: 2100, percentage: 100 },
            { category: 'Functional', count: 1890, percentage: 90 },
            { category: 'Analytics', count: 1680, percentage: 80 },
            { category: 'Marketing', count: 1260, percentage: 60 },
          ],
        },
        dataSharing: {
          totalAgreements: 8,
          activeAgreements: 7,
          dataSharingEvents: 156,
          complianceRate: 95.5,
        },
        anonymization: {
          totalRules: 15,
          anonymizedRecords: 2300,
          pseudonymizedRecords: 1800,
          lastAnonymization: '2024-01-13T15:45:00Z',
        },
        privacyImpactAssessments: {
          totalAssessments: 25,
          completedAssessments: 22,
          pendingAssessments: 3,
          highRiskAssessments: 2,
        },
      };

      setDashboardData(mockData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      // In a real implementation, this would fetch alerts from the API
      const mockAlerts: PrivacyAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Data Retention Policy Update Required',
          description:
            'Some data retention rules need to be updated to comply with new regulations.',
          timestamp: '2024-01-15T09:15:00Z',
          actionRequired: true,
        },
        {
          id: '2',
          type: 'info',
          title: 'Privacy Impact Assessment Completed',
          description: 'PIA for new feature has been completed and approved.',
          timestamp: '2024-01-14T16:30:00Z',
          actionRequired: false,
        },
        {
          id: '3',
          type: 'error',
          title: 'GDPR Violation Detected',
          description:
            'Unauthorized data access detected. Immediate action required.',
          timestamp: '2024-01-14T11:20:00Z',
          actionRequired: true,
        },
      ];

      setAlerts(mockAlerts);
    } catch (err) {
      console.error('Error loading alerts:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No dashboard data available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Privacy Management Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage privacy compliance across your platform
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Recent Alerts</h2>
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              variant={alert.type === 'error' ? 'destructive' : 'default'}
            >
              {getAlertIcon(alert.type)}
              <AlertTitle className="flex items-center justify-between">
                {alert.title}
                {alert.actionRequired && (
                  <Badge variant="outline" className="ml-2">
                    Action Required
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription>
                {alert.description}
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">GDPR Compliance</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  GDPR Compliance
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.gdprCompliance.score}%
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={getStatusColor(
                      dashboardData.gdprCompliance.status
                    )}
                  >
                    {dashboardData.gdprCompliance.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {dashboardData.gdprCompliance.violations} violations
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Consent Rate
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.consentManagement.consentRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {dashboardData.consentManagement.activeConsents} active
                  consents
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Data Requests
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.userRights.totalRequests}
                </div>
                <div className="text-xs text-muted-foreground">
                  {dashboardData.userRights.pendingRequests} pending
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cookie Consent
                </CardTitle>
                <Cookie className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.cookieConsent.consentRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {dashboardData.cookieConsent.totalConsents} total consents
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Retention Overview</CardTitle>
                <CardDescription>
                  Current data retention policies and cleanup status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Rules</span>
                  <span className="text-sm">
                    {dashboardData.dataRetention.activeRules}/
                    {dashboardData.dataRetention.totalRules}
                  </span>
                </div>
                <Progress
                  value={
                    (dashboardData.dataRetention.activeRules /
                      dashboardData.dataRetention.totalRules) *
                    100
                  }
                />
                <div className="text-xs text-muted-foreground">
                  Last cleanup:{' '}
                  {new Date(
                    dashboardData.dataRetention.lastCleanup
                  ).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Sharing Compliance</CardTitle>
                <CardDescription>
                  Third-party data sharing agreements and compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Compliance Rate</span>
                  <span className="text-sm">
                    {dashboardData.dataSharing.complianceRate}%
                  </span>
                </div>
                <Progress value={dashboardData.dataSharing.complianceRate} />
                <div className="text-xs text-muted-foreground">
                  {dashboardData.dataSharing.activeAgreements} active agreements
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GDPR Compliance Status</CardTitle>
              <CardDescription>
                Current compliance score and violation tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Compliance Score</span>
                <div className="text-3xl font-bold text-green-600">
                  {dashboardData.gdprCompliance.score}%
                </div>
              </div>
              <Progress
                value={dashboardData.gdprCompliance.score}
                className="h-2"
              />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardData.gdprCompliance.violations}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Violations
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">85%</div>
                  <div className="text-sm text-muted-foreground">
                    Data Subject Rights
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">92%</div>
                  <div className="text-sm text-muted-foreground">
                    Consent Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Consent Overview</CardTitle>
                <CardDescription>
                  User consent management statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Consents</span>
                    <span className="font-semibold">
                      {dashboardData.consentManagement.totalConsents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Consents</span>
                    <span className="font-semibold text-green-600">
                      {dashboardData.consentManagement.activeConsents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Withdrawn Consents</span>
                    <span className="font-semibold text-red-600">
                      {dashboardData.consentManagement.withdrawnConsents}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookie Categories</CardTitle>
                <CardDescription>
                  Consent breakdown by cookie category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData.cookieConsent.categoryBreakdown.map(category => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {category.category}
                      </span>
                      <span className="text-sm">{category.percentage}%</span>
                    </div>
                    <Progress value={category.percentage} className="h-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Anonymization</CardTitle>
                <CardDescription>
                  Data protection through anonymization and pseudonymization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData.anonymization.anonymizedRecords}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Anonymized
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardData.anonymization.pseudonymizedRecords}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Pseudonymized
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last anonymization:{' '}
                  {new Date(
                    dashboardData.anonymization.lastAnonymization
                  ).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Impact Assessments</CardTitle>
                <CardDescription>
                  PIA status and risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Assessments</span>
                    <span className="font-semibold">
                      {dashboardData.privacyImpactAssessments.totalAssessments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <span className="font-semibold text-green-600">
                      {
                        dashboardData.privacyImpactAssessments
                          .completedAssessments
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <span className="font-semibold text-yellow-600">
                      {
                        dashboardData.privacyImpactAssessments
                          .pendingAssessments
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Risk</span>
                    <span className="font-semibold text-red-600">
                      {
                        dashboardData.privacyImpactAssessments
                          .highRiskAssessments
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Reports</CardTitle>
              <CardDescription>
                Generate and download privacy compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span>GDPR Compliance Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <UserCheck className="h-6 w-6 mb-2" />
                  <span>Consent Analytics</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Database className="h-6 w-6 mb-2" />
                  <span>Data Retention Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <ClipboardList className="h-6 w-6 mb-2" />
                  <span>User Rights Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Cookie className="h-6 w-6 mb-2" />
                  <span>Cookie Consent Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Share2 className="h-6 w-6 mb-2" />
                  <span>Data Sharing Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
