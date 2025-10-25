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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Calendar,
  Filter,
} from 'lucide-react';

interface ExportJob {
  id: string;
  name: string;
  type: 'csv' | 'excel' | 'pdf' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  error?: string;
  size?: number;
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dateRange: {
    from: string;
    to: string;
  };
  includeCharts: boolean;
  includeRawData: boolean;
  compression: boolean;
  emailNotification: boolean;
  emailAddress?: string;
}

interface ExportManagerProps {
  onExport: (options: ExportOptions) => Promise<ExportJob>;
  className?: string;
}

const EXPORT_FORMATS = [
  {
    value: 'csv',
    label: 'CSV',
    icon: FileText,
    description: 'Comma-separated values',
  },
  {
    value: 'excel',
    label: 'Excel',
    icon: FileSpreadsheet,
    description: 'Microsoft Excel format',
  },
  {
    value: 'pdf',
    label: 'PDF',
    icon: FileImage,
    description: 'Portable Document Format',
  },
  {
    value: 'json',
    label: 'JSON',
    icon: FileText,
    description: 'JavaScript Object Notation',
  },
];

export default function ExportManager({
  onExport,
  className,
}: ExportManagerProps) {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
    includeCharts: true,
    includeRawData: true,
    compression: false,
    emailNotification: false,
  });

  useEffect(() => {
    loadExportJobs();
    // Poll for job updates
    const interval = setInterval(loadExportJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadExportJobs = async () => {
    try {
      const response = await fetch('/api/admin/analytics/export/jobs');
      if (response.ok) {
        const jobs = await response.json();
        setExportJobs(jobs);
      }
    } catch (error) {
      console.error('Error loading export jobs:', error);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const job = await onExport(exportOptions);
      setExportJobs(prev => [job, ...prev]);
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Error starting export:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (jobId: string) => {
    try {
      const response = await fetch(
        `/api/admin/analytics/export/download/${jobId}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${jobId}.${exportOptions.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Processing
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={className}>
      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Analytics Data</DialogTitle>
            <DialogDescription>
              Choose export format and options for your analytics data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select
                value={exportOptions.format}
                onValueChange={(value: any) =>
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex items-center space-x-2">
                        <format.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{format.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {format.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <input
                  type="date"
                  value={exportOptions.dateRange.from}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <input
                  type="date"
                  value={exportOptions.dateRange.to}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Export Options</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCharts}
                    onChange={e =>
                      setExportOptions(prev => ({
                        ...prev,
                        includeCharts: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">
                    Include charts and visualizations
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeRawData}
                    onChange={e =>
                      setExportOptions(prev => ({
                        ...prev,
                        includeRawData: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Include raw data</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.compression}
                    onChange={e =>
                      setExportOptions(prev => ({
                        ...prev,
                        compression: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Compress file</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.emailNotification}
                    onChange={e =>
                      setExportOptions(prev => ({
                        ...prev,
                        emailNotification: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Email notification when ready</span>
                </label>
              </div>
            </div>

            {/* Email Address */}
            {exportOptions.emailNotification && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  value={exportOptions.emailAddress || ''}
                  onChange={e =>
                    setExportOptions(prev => ({
                      ...prev,
                      emailAddress: e.target.value,
                    }))
                  }
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsExportDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Jobs */}
      {exportJobs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Export Jobs</span>
            </CardTitle>
            <CardDescription>
              Track your export progress and download completed files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exportJobs.map(job => (
                <div key={job.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {formatDate(job.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(job.status)}
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button
                          onClick={() => downloadFile(job.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>

                  {job.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}

                  {job.status === 'completed' && job.size && (
                    <div className="text-sm text-muted-foreground">
                      File size: {formatFileSize(job.size)} • Completed:{' '}
                      {job.completedAt
                        ? formatDate(job.completedAt)
                        : 'Unknown'}
                    </div>
                  )}

                  {job.status === 'failed' && job.error && (
                    <div className="text-sm text-red-600">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
