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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  User,
  Tag,
  Eye,
  MessageCircle,
  ThumbsUp,
  Settings,
  Download,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: 'submitted' | 'planned' | 'in_development' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vote_count: number;
  view_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    color: string;
  };
  tags?: Array<{ name: string }>;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  assigned_to?: {
    first_name: string;
    last_name: string;
  };
  effort_estimate?: number;
  roadmap_status?: string;
}

interface FeatureRequestManagementDashboardProps {
  onRequestUpdate?: () => void;
}

export default function FeatureRequestManagementDashboard({
  onRequestUpdate,
}: FeatureRequestManagementDashboardProps) {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [
    currentPage,
    statusFilter,
    priorityFilter,
    sortBy,
    sortOrder,
    searchTerm,
  ]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        status: statusFilter !== 'all' ? statusFilter : '',
        priority: priorityFilter !== 'all' ? priorityFilter : '',
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/admin/feature-requests?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests');
      }

      setRequests(data.requests || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/feature-requests/analytics');
      const data = await response.json();

      if (response.ok) {
        setStats(data.overview || stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/${requestId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toast.success('Status updated successfully');
        fetchRequests();
        fetchStats();
        if (onRequestUpdate) onRequestUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (
    requestId: string,
    newPriority: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/${requestId}/priority`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priority: newPriority }),
        }
      );

      if (response.ok) {
        toast.success('Priority updated successfully');
        fetchRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update priority');
      }
    } catch (err) {
      console.error('Error updating priority:', err);
      toast.error('Failed to update priority');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRequests.length === 0) {
      toast.error('Please select requests to perform bulk action');
      return;
    }

    try {
      const response = await fetch('/api/admin/feature-requests/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_ids: selectedRequests,
          action: action,
        }),
      });

      if (response.ok) {
        toast.success(`Bulk ${action} completed successfully`);
        setSelectedRequests([]);
        fetchRequests();
        fetchStats();
        if (onRequestUpdate) onRequestUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to perform bulk ${action}`);
      }
    } catch (err) {
      console.error(`Error performing bulk ${action}:`, err);
      toast.error(`Failed to perform bulk ${action}`);
    }
  };

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    setSelectedRequests(
      selectedRequests.length === requests.length ? [] : requests.map(r => r.id)
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'planned':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'in_development':
        return <PlayCircle className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'planned':
        return 'bg-purple-100 text-purple-800';
      case 'in_development':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchRequests} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Request Management</CardTitle>
          <CardDescription>
            Manage and prioritize feature requests from the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_development">In Development</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="updated_at">Updated Date</SelectItem>
                <SelectItem value="vote_count">Votes</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedRequests.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedRequests.length} request(s) selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('approve')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('reject')}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('assign')}
              >
                Assign
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRequests([])}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Requests Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedRequests.length === requests.length &&
                        requests.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{request.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {request.description}
                        </div>
                        {request.category && (
                          <Badge variant="outline" className="text-xs">
                            {request.category.name}
                          </Badge>
                        )}
                        {request.tags && request.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {request.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {request.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{request.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {request.author?.first_name}{' '}
                          {request.author?.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-gray-400" />
                        <span>{request.vote_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span>{request.view_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(request.id, 'planned')
                            }
                          >
                            Mark as Planned
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(request.id, 'in_development')
                            }
                          >
                            Mark as In Development
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(request.id, 'completed')
                            }
                          >
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(request.id, 'rejected')
                            }
                          >
                            Mark as Rejected
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
