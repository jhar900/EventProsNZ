'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportJob {
  id: string;
  export_type: 'csv' | 'pdf' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  parameters: {
    date_range?: {
      from: string;
      to: string;
    };
    status_filter?: string[];
    category_filter?: string[];
    rating_filter?: number[];
  };
  file_url?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

interface TestimonialExportProps {
  className?: string;
}

export function TestimonialExport({ className }: TestimonialExportProps) {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Export form state
  const [exportType, setExportType] = useState<'csv' | 'pdf' | 'json'>('csv');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number[]>([]);
  const [includeAnalytics, setIncludeAnalytics] = useState(false);

  useEffect(() => {
    fetchExportJobs();
  }, []);

  const fetchExportJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/testimonials/platform/export/jobs');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch export jobs');
      }

      setExportJobs(data.exportJobs || []);
    } catch (err) {
      console.error('Error fetching export jobs:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch export jobs'
      );
    } finally {
      setLoading(false);
    }
  };

  const createExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/testimonials/platform/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          export_type: exportType,
          parameters: {
            date_range:
              dateRange.from && dateRange.to
                ? {
                    from: dateRange.from.toISOString(),
                    to: dateRange.to.toISOString(),
                  }
                : undefined,
            status_filter: statusFilter.length > 0 ? statusFilter : undefined,
            category_filter:
              categoryFilter.length > 0 ? categoryFilter : undefined,
            rating_filter: ratingFilter.length > 0 ? ratingFilter : undefined,
          },
          include_analytics: includeAnalytics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create export');
      }

      toast.success('Export job created successfully');
      await fetchExportJobs();
    } catch (error) {
      console.error('Error creating export:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create export'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExport = async (jobId: string, fileUrl: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `testimonials-export-${jobId}.${exportType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading export:', error);
      toast.error('Failed to download export');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={fetchExportJobs} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Download className="h-6 w-6" />
            <span>Testimonial Export</span>
          </h2>
          <p className="text-gray-600">
            Export testimonials in various formats with filtering options
          </p>
        </div>
        <Button onClick={fetchExportJobs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Export Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Create New Export</span>
          </CardTitle>
          <CardDescription>
            Configure export parameters and download testimonials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type */}
          <div>
            <Label htmlFor="exportType">Export Format</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>CSV (Spreadsheet)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF (Report)</span>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>JSON (Data)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <Label>Date Range (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="dateFrom" className="text-sm text-gray-600">
                  From
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        format(dateRange.from, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={date =>
                        setDateRange({ ...dateRange, from: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="dateTo" className="text-sm text-gray-600">
                  To
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? (
                        format(dateRange.to, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={date =>
                        setDateRange({ ...dateRange, to: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Status Filter</Label>
              <div className="space-y-2 mt-2">
                {['pending', 'approved', 'rejected', 'flagged'].map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={statusFilter.includes(status)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setStatusFilter([...statusFilter, status]);
                        } else {
                          setStatusFilter(
                            statusFilter.filter(s => s !== status)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`status-${status}`} className="capitalize">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Category Filter</Label>
              <div className="space-y-2 mt-2">
                {['event_manager', 'contractor'].map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={categoryFilter.includes(category)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setCategoryFilter([...categoryFilter, category]);
                        } else {
                          setCategoryFilter(
                            categoryFilter.filter(c => c !== category)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`category-${category}`}
                      className="capitalize"
                    >
                      {category.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Rating Filter</Label>
              <div className="space-y-2 mt-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <div key={rating} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rating-${rating}`}
                      checked={ratingFilter.includes(rating)}
                      onCheckedChange={checked => {
                        if (checked) {
                          setRatingFilter([...ratingFilter, rating]);
                        } else {
                          setRatingFilter(
                            ratingFilter.filter(r => r !== rating)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`rating-${rating}`}>
                      {rating} Star{rating !== 1 ? 's' : ''}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAnalytics"
              checked={includeAnalytics}
              onCheckedChange={setIncludeAnalytics}
            />
            <Label htmlFor="includeAnalytics">Include analytics data</Label>
          </div>

          <Button
            onClick={createExport}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Creating Export...' : 'Create Export'}
          </Button>
        </CardContent>
      </Card>

      {/* Export Jobs History */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>View and download previous exports</CardDescription>
        </CardHeader>
        <CardContent>
          {exportJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Download className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No exports yet</p>
              <p className="text-sm">Create your first export above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exportJobs
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map(job => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium">
                          {job.export_type.toUpperCase()} Export
                        </div>
                        <div className="text-sm text-gray-600">
                          Created:{' '}
                          {format(
                            new Date(job.created_at),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </div>
                        {job.completed_at && (
                          <div className="text-sm text-gray-600">
                            Completed:{' '}
                            {format(
                              new Date(job.completed_at),
                              'MMM dd, yyyy HH:mm'
                            )}
                          </div>
                        )}
                        {job.error_message && (
                          <div className="text-sm text-red-600">
                            Error: {job.error_message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      {job.status === 'completed' && job.file_url && (
                        <Button
                          size="sm"
                          onClick={() => downloadExport(job.id, job.file_url!)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
