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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Shield,
  FileText,
  User,
  Clock,
  Eye,
  Flag,
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

interface ContentReport {
  id: string;
  content_type: string;
  content_id: string;
  reported_by: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    email: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ModerationFilters {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export default function ContentModeration() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ModerationFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(
    null
  );
  const [moderationReason, setModerationReason] = useState('');
  const [isModerating, setIsModerating] = useState(false);

  const { fetchContentReports, moderateContent } = useAdmin();

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const reportFilters = {
        ...filters,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        type: selectedType === 'all' ? undefined : selectedType,
      };

      const result = await fetchContentReports(reportFilters);
      if (result) {
        setReports(result.reports || []);
        setSummary(result.summary || null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load content reports'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filters, selectedStatus, selectedType]);

  const handleModeration = async (
    action: 'approve' | 'reject',
    report: ContentReport
  ) => {
    try {
      setIsModerating(true);
      const result = await moderateContent(
        action,
        report.id,
        moderationReason,
        report.content_id,
        report.content_type
      );

      if (result?.success) {
        // Reload reports to reflect changes
        await loadReports();
        setSelectedReport(null);
        setModerationReason('');
      }
    } catch (err) {
      } finally {
      setIsModerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <Badge
        className={
          colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        }
      >
        {status}
      </Badge>
    );
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'profile':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'business_profile':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'portfolio':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'review':
        return <Flag className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors = {
      inappropriate: 'bg-red-100 text-red-800',
      spam: 'bg-yellow-100 text-yellow-800',
      fake: 'bg-orange-100 text-orange-800',
      harassment: 'bg-red-100 text-red-800',
      copyright: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge
        className={
          colors[reason as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        }
      >
        {reason}
      </Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        report.users.email.toLowerCase().includes(searchLower) ||
        report.users.profiles.first_name.toLowerCase().includes(searchLower) ||
        report.users.profiles.last_name.toLowerCase().includes(searchLower) ||
        report.reason.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower) ||
        report.content_type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading content reports...</span>
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
            Content Moderation
          </h1>
          <p className="text-muted-foreground">
            Review and moderate reported content
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={loadReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reports
              </CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReports}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.pendingReports}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting moderation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.approvedReports}
              </div>
              <p className="text-xs text-muted-foreground">Content approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.rejectedReports}
              </div>
              <p className="text-xs text-muted-foreground">Content removed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Content Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="business_profile">
                    Business Profile
                  </SelectItem>
                  <SelectItem value="portfolio">Portfolio</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Items per page</Label>
              <Select
                value={filters.limit?.toString() || '50'}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, limit: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Reports</CardTitle>
          <CardDescription>
            Showing {filteredReports.length} of {reports.length} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium">
                            {report.users.profiles.first_name}{' '}
                            {report.users.profiles.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {report.users.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getContentTypeIcon(report.content_type)}
                        <div>
                          <div className="font-medium">
                            {report.content_type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {report.content_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getReasonBadge(report.reason)}
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {report.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Content Report Review</DialogTitle>
                              <DialogDescription>
                                Review the reported content and take appropriate
                                action
                              </DialogDescription>
                            </DialogHeader>

                            {selectedReport && (
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Reporter
                                    </Label>
                                    <div className="text-sm text-muted-foreground">
                                      {selectedReport.users.profiles.first_name}{' '}
                                      {selectedReport.users.profiles.last_name}
                                      <br />
                                      {selectedReport.users.email}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Content Type
                                    </Label>
                                    <div className="text-sm text-muted-foreground">
                                      {selectedReport.content_type.replace(
                                        '_',
                                        ' '
                                      )}
                                      <br />
                                      ID: {selectedReport.content_id}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">
                                    Reason
                                  </Label>
                                  <div className="text-sm text-muted-foreground">
                                    {getReasonBadge(selectedReport.reason)}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">
                                    Description
                                  </Label>
                                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                                    {selectedReport.description}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">
                                    Current Status
                                  </Label>
                                  <div className="text-sm text-muted-foreground">
                                    {getStatusBadge(selectedReport.status)}
                                  </div>
                                </div>

                                {selectedReport.status === 'pending' && (
                                  <div>
                                    <Label htmlFor="moderation-reason">
                                      Moderation Reason
                                    </Label>
                                    <Textarea
                                      id="moderation-reason"
                                      placeholder="Enter reason for your decision..."
                                      value={moderationReason}
                                      onChange={e =>
                                        setModerationReason(e.target.value)
                                      }
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            <DialogFooter>
                              {selectedReport?.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleModeration(
                                        'reject',
                                        selectedReport!
                                      )
                                    }
                                    disabled={
                                      isModerating || !moderationReason.trim()
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Content
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleModeration(
                                        'approve',
                                        selectedReport!
                                      )
                                    }
                                    disabled={isModerating}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Content
                                  </Button>
                                </>
                              )}
                              {selectedReport?.status !== 'pending' && (
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedReport(null)}
                                >
                                  Close
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No content reports found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
