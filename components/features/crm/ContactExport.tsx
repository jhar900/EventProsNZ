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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Download,
  FileText,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useCRM } from '@/hooks/useCRM';

interface ExportJob {
  id: string;
  format: 'csv' | 'json';
  contact_type?: string;
  date_from?: string;
  date_to?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  download_url?: string;
}

interface ExportFilters {
  format: 'csv' | 'json';
  contact_type?: string;
  date_from?: string;
  date_to?: string;
}

export function ContactExport() {
  const { isLoading, error, exportContacts } = useCRM();
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExportFilters>({
    format: 'csv',
  });
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  const handleFilterChange = (key: keyof ExportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleExport = async () => {
    try {
      setSuccess(null);

      await exportContacts(filters.format, filters);
      setSuccess('Export completed successfully');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleScheduleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/crm/export/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Export job scheduled successfully');
        // Reload export jobs
        // TODO: Implement export jobs reloading
      } else {
        setError(data.message || 'Failed to schedule export');
      }
    } catch (err) {
      setError('Failed to schedule export');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contact Export</h2>
          <p className="text-muted-foreground">
            Export your contact data in various formats
          </p>
        </div>
      </div>

      {/* Export Form */}
      <Card>
        <CardHeader>
          <CardTitle>Export Contacts</CardTitle>
          <CardDescription>
            Choose your export format and filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Export Format</label>
              <Select
                value={filters.format}
                onValueChange={value => handleFilterChange('format', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel compatible)</SelectItem>
                  <SelectItem value="json">JSON (API format)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Contact Type</label>
              <Select
                value={filters.contact_type || 'all'}
                onValueChange={value =>
                  handleFilterChange('contact_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="event_manager">Event Manager</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date From</label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={e => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Date To</label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={e => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleScheduleExport}
              disabled={isLoading}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Export
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Export Jobs */}
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Jobs</CardTitle>
            <CardDescription>
              Your recent export jobs and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exportJobs.map(job => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">
                        {job.format.toUpperCase()} Export
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {formatDate(job.created_at)} at{' '}
                        {formatTime(job.created_at)}
                      </div>
                      {job.completed_at && (
                        <div className="text-sm text-muted-foreground">
                          Completed: {formatDate(job.completed_at)} at{' '}
                          {formatTime(job.completed_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.status === 'completed' && job.download_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(job.download_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    {job.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement retry functionality
                        }}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Information */}
      <Card>
        <CardHeader>
          <CardTitle>Export Information</CardTitle>
          <CardDescription>
            Learn about the different export formats and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                CSV Format
              </h4>
              <p className="text-sm text-muted-foreground">
                Excel-compatible format with all contact data in columns.
                Perfect for importing into other CRM systems or spreadsheets.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                JSON Format
              </h4>
              <p className="text-sm text-muted-foreground">
                Structured data format with nested objects. Ideal for developers
                or API integrations.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Included Data</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
              <div>• Contact Information</div>
              <div>• Interaction History</div>
              <div>• Notes & Tags</div>
              <div>• Reminders</div>
              <div>• Relationship Status</div>
              <div>• Last Interaction</div>
              <div>• Creation Date</div>
              <div>• Contact Type</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
