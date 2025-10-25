'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  FileText,
  Eye,
  Settings,
} from 'lucide-react';

interface ComplianceStatus {
  id: string;
  type: 'gdpr' | 'ccpa' | 'accessibility' | 'cookie' | 'other';
  status: 'compliant' | 'non_compliant' | 'pending' | 'under_review';
  last_checked: string;
  next_check: string;
  notes?: string;
  checked_by?: string;
  created_at: string;
  updated_at: string;
}

interface ComplianceTrackerProps {
  isAdmin?: boolean;
}

export function ComplianceTracker({ isAdmin = false }: ComplianceTrackerProps) {
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complianceTypes = {
    gdpr: {
      name: 'GDPR Compliance',
      description: 'General Data Protection Regulation',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    ccpa: {
      name: 'CCPA Compliance',
      description: 'California Consumer Privacy Act',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    accessibility: {
      name: 'Accessibility Compliance',
      description: 'WCAG 2.1 AA Standards',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    cookie: {
      name: 'Cookie Compliance',
      description: 'Cookie Consent and Management',
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  };

  const statusConfig = {
    compliant: {
      label: 'Compliant',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
    },
    non_compliant: {
      label: 'Non-Compliant',
      color: 'bg-red-100 text-red-800',
      icon: AlertTriangle,
    },
    pending: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
    },
    under_review: {
      label: 'Under Review',
      color: 'bg-blue-100 text-blue-800',
      icon: RefreshCw,
    },
  };

  useEffect(() => {
    fetchComplianceStatus();
  }, []);

  const fetchComplianceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/legal/compliance');
      const data = await response.json();

      if (data.success) {
        setComplianceStatus(data.data);
      }
    } catch (err) {
      setError('Failed to fetch compliance status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCompliance = async (type: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/legal/compliance/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (data.success) {
        fetchComplianceStatus();
      } else {
        setError(data.error || 'Failed to refresh compliance status');
      }
    } catch (err) {
      setError('Failed to refresh compliance status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getComplianceScore = () => {
    const total = complianceStatus.length;
    const compliant = complianceStatus.filter(
      status => status.status === 'compliant'
    ).length;
    return total > 0 ? Math.round((compliant / total) * 100) : 0;
  };

  const getDaysUntilNextCheck = (nextCheckDate: string) => {
    const nextCheck = new Date(nextCheckDate);
    const now = new Date();
    const diffTime = nextCheck.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const complianceScore = getComplianceScore();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Compliance Tracker
        </h1>
        <p className="text-gray-600">
          Monitor legal compliance status across all regulations.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Compliance Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Overall Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {complianceScore}%
            </div>
            <Progress value={complianceScore} className="mb-2" />
            <p className="text-sm text-gray-600">
              {complianceStatus.filter(s => s.status === 'compliant').length} of{' '}
              {complianceStatus.length} regulations compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {complianceStatus.filter(s => s.status === 'compliant').length}
            </div>
            <p className="text-sm text-gray-600">Regulations in compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {complianceStatus.filter(s => s.status !== 'compliant').length}
            </div>
            <p className="text-sm text-gray-600">
              Regulations requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(complianceTypes).map(([type, config]) => {
          const status = complianceStatus.find(s => s.type === type);
          const Icon = config.icon;

          return (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  {status && getStatusBadge(status.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {status ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Last Checked</p>
                        <p className="font-medium">
                          {formatDate(status.last_checked)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Next Check</p>
                        <p className="font-medium">
                          {formatDate(status.next_check)}
                        </p>
                      </div>
                    </div>

                    {status.notes && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Notes</p>
                        <p className="text-sm bg-gray-50 p-2 rounded">
                          {status.notes}
                        </p>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefreshCompliance(type)}
                          disabled={loading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    )}

                    {getDaysUntilNextCheck(status.next_check) <= 7 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm text-yellow-800">
                            Next compliance check due in{' '}
                            {getDaysUntilNextCheck(status.next_check)} days
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      No compliance data available
                    </p>
                    {isAdmin && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => handleRefreshCompliance(type)}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Compliance
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance History */}
      {isAdmin && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Compliance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Compliance history will be displayed here</p>
              <p className="text-sm">
                Track changes and audit trails for all compliance checks
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
