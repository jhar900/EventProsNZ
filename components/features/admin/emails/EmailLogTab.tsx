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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmailLog {
  id: string;
  user_id: string;
  recipient_email: string | null;
  email_type: string;
  template_id: string | null;
  template_name: string | null;
  trigger_action: string | null;
  status: string;
  sent_at: string;
  metadata: any;
}

interface EmailLogResponse {
  logs: EmailLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function EmailLogTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    email_type: 'all',
    status: 'all',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.email_type && filters.email_type !== 'all') {
        params.append('email_type', filters.email_type);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }

      const adminToken = 'admin-secure-token-2024-eventpros';
      const response = await fetch(`/api/admin/emails/logs?${params}`, {
        credentials: 'include',
        headers: {
          'x-admin-token': adminToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.details || errorData.error || 'Failed to fetch email logs';
        throw new Error(errorMessage);
      }

      const data: EmailLogResponse = await response.json();
      setLogs(data.logs);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load email logs'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handleViewDetails = (log: EmailLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-blue-100 text-blue-800',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Recipient Email',
      'Email Type',
      'Template Name',
      'Trigger Action',
      'Status',
      'Sent At',
    ];
    const rows = logs.map(log => [
      log.id,
      log.recipient_email || '',
      log.email_type,
      log.template_name || '',
      log.trigger_action || '',
      log.status,
      log.sent_at || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Log</CardTitle>
              <CardDescription>
                View all emails sent through the platform
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.email_type}
              onValueChange={value => handleFilterChange('email_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Email Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="job_application">Job Application</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="platform">Platform Announcement</SelectItem>
                <SelectItem value="admin_notification">
                  Admin Notification
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={value => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="From Date"
                value={filters.date_from}
                onChange={e => handleFilterChange('date_from', e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                placeholder="To Date"
                value={filters.date_to}
                onChange={e => handleFilterChange('date_to', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">
                Loading email logs...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadLogs} variant="outline">
                Try Again
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No email logs found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Email Type</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.recipient_email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.email_type}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {log.template_name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {log.trigger_action || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(log.sent_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{' '}
                  of {pagination.total} emails
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Email Log Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  ×
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Recipient Email
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.recipient_email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.email_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Template Name
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.template_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Trigger Action
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.trigger_action || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sent At
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedLog.sent_at)}
                  </p>
                </div>
                {selectedLog.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Metadata
                    </label>
                    <pre className="text-xs bg-gray-50 p-3 rounded-md mt-1 overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
