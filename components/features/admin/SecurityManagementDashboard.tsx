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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  FileText,
  Activity,
  Users,
  Database,
  Globe,
  Settings,
} from 'lucide-react';

interface SecurityStatus {
  overall: {
    complianceScore: number;
    totalIssues: number;
    criticalIssues: number;
    lastScanDate: string;
  };
  audits: {
    totalAudits: number;
    openIssues: number;
    resolvedIssues: number;
    criticalIssues: number;
    vulnerabilityCount: number;
    complianceScore: number;
    lastScanDate: string;
  };
  incidents: {
    totalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
    criticalIncidents: number;
    avgResolutionTime: number;
    breachNotifications: number;
  };
  api: {
    totalRequests: number;
    blockedRequests: number;
    abuseEvents: number;
    activeRateLimits: number;
    blockedIPs: number;
  };
  timestamp: string;
}

interface SecurityAudit {
  id: string;
  event_type: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  resolved_at?: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

interface SecurityIncident {
  id: string;
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'contained' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  reported_by: string;
  assigned_to?: string;
  affected_systems: string[];
  impact_assessment: string;
}

export default function SecurityManagementDashboard() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(
    null
  );
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load security status
      const statusResponse = await fetch('/api/security/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSecurityStatus(statusData.status);
      }

      // Load security audits
      const auditsResponse = await fetch('/api/security/audit');
      if (auditsResponse.ok) {
        const auditsData = await auditsResponse.json();
        setAudits(auditsData.audits);
      }

      // Load security incidents
      const incidentsResponse = await fetch('/api/security/incident');
      if (incidentsResponse.ok) {
        const incidentsData = await incidentsResponse.json();
        setIncidents(incidentsData.incidents);
      }
    } catch (err) {
      setError('Failed to load security data');
      console.error('Security data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    try {
      const response = await fetch('/api/security/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanType: 'vulnerability',
          target: 'application',
        }),
      });

      if (response.ok) {
        alert('Security scan initiated successfully');
        loadSecurityData(); // Refresh data
      } else {
        alert('Failed to initiate security scan');
      }
    } catch (err) {
      alert('Error initiating security scan');
      console.error('Security scan error:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Management</h1>
          <p className="text-gray-600">
            Monitor and manage security across the platform
          </p>
        </div>
        <Button
          onClick={runSecurityScan}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Shield className="h-4 w-4 mr-2" />
          Run Security Scan
        </Button>
      </div>

      {/* Security Status Overview */}
      {securityStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Compliance Score
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {securityStatus.overall.complianceScore}%
              </div>
              <p className="text-xs text-muted-foreground">
                Last scan:{' '}
                {new Date(
                  securityStatus.overall.lastScanDate
                ).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {securityStatus.overall.totalIssues}
              </div>
              <p className="text-xs text-muted-foreground">
                {securityStatus.overall.criticalIssues} critical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Incidents
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {securityStatus.incidents.openIncidents}
              </div>
              <p className="text-xs text-muted-foreground">
                {securityStatus.incidents.criticalIncidents} critical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                API Security
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {securityStatus.api.blockedRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                {securityStatus.api.totalRequests} total requests
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tabs */}
      <Tabs defaultValue="audits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audits">Security Audits</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Logs</CardTitle>
              <CardDescription>
                Recent security events and audit trails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audits.length === 0 ? (
                  <p className="text-gray-500">No audit logs found</p>
                ) : (
                  audits.map(audit => (
                    <div
                      key={audit.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${getSeverityColor(audit.severity)}`}
                        />
                        <div>
                          <p className="font-medium">{audit.event_type}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(audit.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(audit.status)}>
                          {audit.status}
                        </Badge>
                        <Badge variant="outline">{audit.severity}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>
                Active and recent security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.length === 0 ? (
                  <p className="text-gray-500">No active incidents</p>
                ) : (
                  incidents.map(incident => (
                    <div key={incident.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">
                            {incident.incident_type}
                          </h3>
                          <Badge
                            className={getSeverityColor(incident.severity)}
                          >
                            {incident.severity}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(incident.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {incident.description}
                      </p>
                      {incident.affected_systems.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Affected Systems:</span>
                          <span className="ml-2">
                            {incident.affected_systems.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Security</CardTitle>
                <CardDescription>
                  API request monitoring and rate limiting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {securityStatus && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Requests:</span>
                      <span>{securityStatus.api.totalRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blocked Requests:</span>
                      <span className="text-red-600">
                        {securityStatus.api.blockedRequests}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blocked IPs:</span>
                      <span>{securityStatus.api.blockedIPs}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Security</CardTitle>
                <CardDescription>
                  Database access and audit logging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Audit Logs:</span>
                    <span>{securityStatus?.audits.totalAudits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Open Issues:</span>
                    <span className="text-orange-600">
                      {securityStatus?.audits.openIssues || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolved Issues:</span>
                    <span className="text-green-600">
                      {securityStatus?.audits.resolvedIssues || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Configure security policies and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Password Policy</h4>
                    <p className="text-sm text-gray-500">
                      Configure password requirements
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">API Rate Limiting</h4>
                    <p className="text-sm text-gray-500">Set API rate limits</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">File Upload Security</h4>
                    <p className="text-sm text-gray-500">
                      Configure file upload policies
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Encryption Settings</h4>
                    <p className="text-sm text-gray-500">
                      Manage encryption keys
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
