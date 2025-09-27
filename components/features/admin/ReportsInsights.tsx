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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Download,
  RefreshCw,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  UserCheck,
  Activity,
  Shield,
  Clock,
  Filter,
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

interface ReportData {
  id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  generated_at: string;
  generated_by: string;
  format: string;
  size: number;
}

interface ReportFilters {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  format?: string;
}

export default function ReportsInsights() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { exportReport, fetchAnalytics } = useAdmin();

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate loading existing reports
      // In a real implementation, this would fetch from an API
      const mockReports: ReportData[] = [
        {
          id: '1',
          type: 'user_analytics',
          title: 'User Analytics Report',
          description: 'Comprehensive user analytics and metrics',
          data: { totalUsers: 1250, newUsers: 45 },
          generated_at: new Date().toISOString(),
          generated_by: 'admin@eventprosnz.com',
          format: 'csv',
          size: 1024 * 1024 * 2.5, // 2.5MB
        },
        {
          id: '2',
          type: 'contractor_verification',
          title: 'Contractor Verification Report',
          description: 'Contractor verification status and metrics',
          data: { totalContractors: 320, verified: 280 },
          generated_at: new Date(Date.now() - 86400000).toISOString(),
          generated_by: 'admin@eventprosnz.com',
          format: 'excel',
          size: 1024 * 1024 * 1.8, // 1.8MB
        },
        {
          id: '3',
          type: 'system_health',
          title: 'System Health Report',
          description: 'System performance and health metrics',
          data: { uptime: 99.9, errors: 5 },
          generated_at: new Date(Date.now() - 172800000).toISOString(),
          generated_by: 'admin@eventprosnz.com',
          format: 'pdf',
          size: 1024 * 1024 * 0.8, // 0.8MB
        },
      ];

      setReports(mockReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerateReport = async (type: string) => {
    try {
      setIsGenerating(true);
      const blob = await exportReport(
        type,
        selectedFormat,
        dateFrom || undefined,
        dateTo || undefined
      );

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Reload reports to show the new one
        await loadReports();
      }
    } catch (err) {
      } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (report: ReportData) => {
    try {
      const blob = await exportReport(report.type, report.format);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title.toLowerCase().replace(/\s+/g, '-')}.${report.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'user_analytics':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'contractor_verification':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'system_health':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'activity_logs':
        return <Activity className="h-4 w-4 text-orange-600" />;
      case 'financial':
        return <BarChart3 className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFormatBadge = (format: string) => {
    const colors = {
      csv: 'bg-green-100 text-green-800',
      excel: 'bg-blue-100 text-blue-800',
      pdf: 'bg-red-100 text-red-800',
      json: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge
        className={
          colors[format as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        }
      >
        {format.toUpperCase()}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredReports = reports.filter(report => {
    if (selectedType !== 'all' && report.type !== selectedType) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Insights
          </h1>
          <p className="text-muted-foreground">
            Generate and manage comprehensive platform reports
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Generate New Report</span>
          </CardTitle>
          <CardDescription>
            Create custom reports with specific data and date ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="user_analytics">User Analytics</SelectItem>
                  <SelectItem value="contractor_verification">
                    Contractor Verification
                  </SelectItem>
                  <SelectItem value="system_health">System Health</SelectItem>
                  <SelectItem value="activity_logs">Activity Logs</SelectItem>
                  <SelectItem value="financial">Financial Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={() => handleGenerateReport('user_analytics')}
              disabled={isGenerating}
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              User Analytics
            </Button>
            <Button
              onClick={() => handleGenerateReport('contractor_verification')}
              disabled={isGenerating}
              variant="outline"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Contractor Verification
            </Button>
            <Button
              onClick={() => handleGenerateReport('system_health')}
              disabled={isGenerating}
              variant="outline"
            >
              <Shield className="h-4 w-4 mr-2" />
              System Health
            </Button>
            <Button
              onClick={() => handleGenerateReport('activity_logs')}
              disabled={isGenerating}
              variant="outline"
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity Logs
            </Button>
            <Button
              onClick={() => handleGenerateReport('financial')}
              disabled={isGenerating}
              variant="outline"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Financial Report
            </Button>
          </div>

          {isGenerating && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Generating report...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">Generated reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                reports.filter(r => {
                  const reportDate = new Date(r.generated_at);
                  const now = new Date();
                  return (
                    reportDate.getMonth() === now.getMonth() &&
                    reportDate.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Reports generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CSV</div>
            <p className="text-xs text-muted-foreground">Export format</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(
                reports.reduce((sum, report) => sum + report.size, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">All reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            View and download previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getReportTypeIcon(report.type)}
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {report.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{getFormatBadge(report.format)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(report.size)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(report.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No reports found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Report Templates</span>
          </CardTitle>
          <CardDescription>
            Pre-configured report templates for common use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Weekly User Report</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                User registrations, activity, and engagement metrics for the
                past week.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Generate
              </Button>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Verification Summary</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Contractor verification status and pending applications summary.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Generate
              </Button>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">System Health Report</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                System performance, uptime, and health metrics overview.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
