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
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  Download,
  FileText,
  RefreshCw,
  Settings,
  Share,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Users,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: string;
  lastGenerated: string;
  status: 'active' | 'paused' | 'error';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  parameters: {
    timeRange: string;
    includeCharts: boolean;
    includeRawData: boolean;
    sections: string[];
  };
}

interface ReportGeneration {
  id: string;
  templateId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  error?: string;
}

interface ReportData {
  templates: ReportTemplate[];
  generations: ReportGeneration[];
  scheduledReports: Array<{
    id: string;
    templateId: string;
    schedule: string;
    nextRun: string;
    status: 'active' | 'paused';
  }>;
}

export default function ReportGenerator() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'analytics',
    format: 'pdf' as const,
    timeRange: '30d',
    includeCharts: true,
    includeRawData: false,
    sections: [] as string[],
  });

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/jobs/reports');
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const generateReport = async (templateId: string) => {
    try {
      setIsGenerating(true);
      const response = await fetch(`/api/admin/jobs/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        await loadReportData();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const createTemplate = async () => {
    try {
      const response = await fetch('/api/admin/jobs/reports/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        await loadReportData();
        setShowCreateDialog(false);
        setNewTemplate({
          name: '',
          description: '',
          category: 'analytics',
          format: 'pdf',
          timeRange: '30d',
          includeCharts: true,
          includeRawData: false,
          sections: [],
        });
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const downloadReport = async (generationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/jobs/reports/${generationId}/download`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${generationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'generating':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Generating
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />;
      case 'users':
        return <Users className="h-4 w-4" />;
      case 'jobs':
        return <Briefcase className="h-4 w-4" />;
      case 'performance':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading report generator...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Report Generator
          </h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage analytics reports
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Report Template</DialogTitle>
                <DialogDescription>
                  Create a new report template with custom parameters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Template Name</label>
                    <Input
                      value={newTemplate.name}
                      onChange={e =>
                        setNewTemplate(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={value =>
                        setNewTemplate(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="jobs">Jobs</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newTemplate.description}
                    onChange={e =>
                      setNewTemplate(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter template description"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Format</label>
                    <Select
                      value={newTemplate.format}
                      onValueChange={value =>
                        setNewTemplate(prev => ({
                          ...prev,
                          format: value as 'pdf' | 'excel' | 'csv',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time Range</label>
                    <Select
                      value={newTemplate.timeRange}
                      onValueChange={value =>
                        setNewTemplate(prev => ({ ...prev, timeRange: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createTemplate}>Create Template</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={loadReportData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>
            Manage your report templates and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.templates.map(template => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(template.category)}
                      <span className="capitalize">{template.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.format.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {template.lastGenerated
                        ? new Date(template.lastGenerated).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(template.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateReport(template.id)}
                        disabled={isGenerating}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Generations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Report Generations</CardTitle>
          <CardDescription>
            Track the status of your report generations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.generations.map(generation => (
                <TableRow key={generation.id}>
                  <TableCell>
                    <div className="font-medium">
                      {data.templates.find(t => t.id === generation.templateId)
                        ?.name || 'Unknown Template'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(generation.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${generation.progress}%` }}
                        />
                      </div>
                      <span className="text-sm">{generation.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(generation.startedAt).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {generation.completedAt
                        ? new Date(generation.completedAt).toLocaleString()
                        : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {generation.status === 'completed' &&
                      generation.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(generation.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>
            Automated report generation schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.scheduledReports.map(schedule => (
              <div key={schedule.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {data.templates.find(t => t.id === schedule.templateId)
                        ?.name || 'Unknown Template'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Schedule: {schedule.schedule} • Next run:{' '}
                      {new Date(schedule.nextRun).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(schedule.status)}
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common report generation tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => generateReport('analytics-daily')}
            >
              <BarChart3 className="h-6 w-6" />
              <span>Daily Analytics</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => generateReport('user-activity')}
            >
              <Users className="h-6 w-6" />
              <span>User Activity</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => generateReport('job-performance')}
            >
              <Briefcase className="h-6 w-6" />
              <span>Job Performance</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => generateReport('conversion-metrics')}
            >
              <TrendingUp className="h-6 w-6" />
              <span>Conversion Metrics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
