'use client';

import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Inquiry,
  InquiryFilters,
  InquiryAnalytics,
  INQUIRY_STATUS,
  INQUIRY_PRIORITY,
} from '@/types/inquiries';

interface InquiryHistoryProps {
  inquiries: Inquiry[];
  filters: InquiryFilters;
  onFiltersChange: (filters: InquiryFilters) => void;
  analytics?: InquiryAnalytics;
}

export function InquiryHistory({
  inquiries = [],
  filters = {},
  onFiltersChange,
  analytics,
}: InquiryHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Apply filters
  const filteredInquiries = (inquiries || []).filter(inquiry => {
    const matchesSearch =
      !searchTerm ||
      inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.contractor?.profiles?.first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      inquiry.contractor?.profiles?.last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesDateFrom =
      !dateRange.from ||
      new Date(inquiry.created_at) >= new Date(dateRange.from);
    const matchesDateTo =
      !dateRange.to || new Date(inquiry.created_at) <= new Date(dateRange.to);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Handle filter changes
  const handleFilterChange = (key: keyof InquiryFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle date range change
  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Export inquiries
  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    // TODO: Implement export functionality
    console.log(`Exporting inquiries as ${format}`);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case INQUIRY_STATUS.SENT:
        return 'bg-blue-100 text-blue-800';
      case INQUIRY_STATUS.VIEWED:
        return 'bg-yellow-100 text-yellow-800';
      case INQUIRY_STATUS.RESPONDED:
        return 'bg-green-100 text-green-800';
      case INQUIRY_STATUS.QUOTED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Overview
                </CardTitle>
                <CardDescription>
                  Insights into your inquiry performance
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                {showAnalytics ? 'Hide' : 'Show'} Details
              </Button>
            </div>
          </CardHeader>
          {showAnalytics && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.total_inquiries}
                  </div>
                  <div className="text-sm text-blue-800">Total Inquiries</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.conversion_rate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-800">Conversion Rate</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round(analytics.response_time_avg / (1000 * 60 * 60))}
                    h
                  </div>
                  <div className="text-sm text-yellow-800">
                    Avg Response Time
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.popular_services.length}
                  </div>
                  <div className="text-sm text-purple-800">
                    Service Categories
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="mt-6">
                <h4 className="font-medium mb-3">Status Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.status_counts).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="text-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="text-lg font-semibold">{count}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {status}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Popular Services */}
              {analytics.popular_services.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Popular Services</h4>
                  <div className="space-y-2">
                    {analytics.popular_services.map((service, index) => (
                      <div
                        key={service.service}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{service.service}</span>
                        <Badge variant="outline">
                          {service.count} inquiries
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search inquiries..."
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={value =>
                  handleFilterChange(
                    'status',
                    value === 'all' ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(INQUIRY_STATUS).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key
                        .replace('_', ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={e => handleDateRangeChange('from', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={e => handleDateRangeChange('to', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setDateRange({ from: '', to: '' });
                  onFiltersChange({});
                }}
              >
                Clear Filters
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('xlsx')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiry List */}
      <div className="space-y-4">
        {filteredInquiries.length === 0 ? (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              No inquiries found matching your criteria.
            </AlertDescription>
          </Alert>
        ) : (
          filteredInquiries.map(inquiry => (
            <Card
              key={inquiry.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={inquiry.contractor?.profiles?.avatar_url}
                        />
                        <AvatarFallback>
                          {inquiry.contractor?.profiles?.first_name?.[0]}
                          {inquiry.contractor?.profiles?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">
                          {inquiry.contractor?.profiles?.first_name}{' '}
                          {inquiry.contractor?.profiles?.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {inquiry.contractor?.business_profiles?.company_name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">{inquiry.subject}</h3>
                      <p className="text-gray-600 line-clamp-2">
                        {inquiry.message}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(inquiry.created_at)}
                      </div>
                      {inquiry.event && (
                        <div className="flex items-center">
                          <span className="mr-1">Event:</span>
                          {inquiry.event.title}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getStatusColor(inquiry.status)}>
                      {inquiry.status}
                    </Badge>
                    {inquiry.priority && (
                      <Badge variant="outline">{inquiry.priority}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
