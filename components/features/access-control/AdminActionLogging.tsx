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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangleIcon,
  ShieldIcon,
  ActivityIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FileTextIcon,
  SearchIcon,
  FilterIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  resource: string;
  resource_id?: string;
  details: any;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  admin_email?: string;
}

interface AdminActionLoggingProps {
  adminId?: string;
}

export default function AdminActionLogging({
  adminId,
}: AdminActionLoggingProps) {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActionType, setFilterActionType] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    total_actions: 0,
    today_actions: 0,
    this_week_actions: 0,
    this_month_actions: 0,
  });

  // Load actions on component mount
  useEffect(() => {
    loadActions();
    loadStats();
  }, [adminId]);

  const loadActions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (adminId) params.append('admin_id', adminId);
      if (filterActionType !== 'all')
        params.append('action_type', filterActionType);
      if (filterResource !== 'all') params.append('resource', filterResource);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/access/admin-actions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load admin actions');
      }

      const data = await response.json();
      setActions(data.actions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/access/admin-actions/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSearch = () => {
    loadActions();
  };

  const handleFilterChange = () => {
    loadActions();
  };

  const getActionTypeBadge = (actionType: string) => {
    const variants = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      login: 'outline',
      logout: 'outline',
      grant_access: 'default',
      revoke_access: 'destructive',
      create_user: 'default',
      update_user: 'secondary',
      delete_user: 'destructive',
    } as const;

    return (
      <Badge
        variant={variants[actionType as keyof typeof variants] || 'secondary'}
      >
        {actionType.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getResourceBadge = (resource: string) => {
    const variants = {
      users: 'default',
      roles: 'secondary',
      permissions: 'outline',
      sessions: 'default',
      files: 'secondary',
      api_tokens: 'outline',
      suspicious_activities: 'destructive',
      access_reviews: 'default',
    } as const;

    return (
      <Badge
        variant={variants[resource as keyof typeof variants] || 'secondary'}
      >
        {resource.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
      case 'create_user':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'update':
      case 'update_user':
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'delete':
      case 'delete_user':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'login':
        return <ActivityIcon className="h-4 w-4 text-green-500" />;
      case 'logout':
        return <ActivityIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <FileTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredActions = actions.filter(action => {
    if (activeTab === 'all') return true;
    if (activeTab === 'today') {
      const today = new Date();
      const actionDate = new Date(action.timestamp);
      return actionDate.toDateString() === today.toDateString();
    }
    if (activeTab === 'this_week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(action.timestamp) >= weekAgo;
    }
    if (activeTab === 'this_month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(action.timestamp) >= monthAgo;
    }
    return true;
  });

  const actionTypes = [...new Set(actions.map(action => action.action_type))];
  const resources = [...new Set(actions.map(action => action.resource))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5" />
            Admin Action Logging
          </CardTitle>
          <CardDescription>
            Monitor and audit admin actions and system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total_actions})</TabsTrigger>
              <TabsTrigger value="today">
                Today ({stats.today_actions})
              </TabsTrigger>
              <TabsTrigger value="this_week">
                This Week ({stats.this_week_actions})
              </TabsTrigger>
              <TabsTrigger value="this_month">
                This Month ({stats.this_month_actions})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search actions..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filterActionType}
                    onValueChange={value => {
                      setFilterActionType(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {actionTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterResource}
                    onValueChange={value => {
                      setFilterResource(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Resource" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {resources.map(resource => (
                        <SelectItem key={resource} value={resource}>
                          {resource.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch} variant="outline">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map(action => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(action.action_type)}
                          {getActionTypeBadge(action.action_type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {action.admin_email || action.admin_id}
                      </TableCell>
                      <TableCell>{getResourceBadge(action.resource)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {JSON.stringify(action.details).substring(0, 50)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {action.ip_address || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(action.timestamp),
                          'MMM dd, yyyy HH:mm'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAction(action);
                            setIsDialogOpen(true);
                          }}
                        >
                          <ActivityIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredActions.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No admin actions found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Admin Action Details</DialogTitle>
            <DialogDescription>
              View detailed information about this admin action
            </DialogDescription>
          </DialogHeader>

          {selectedAction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action Type</Label>
                  <div className="mt-1">
                    {getActionTypeBadge(selectedAction.action_type)}
                  </div>
                </div>
                <div>
                  <Label>Resource</Label>
                  <div className="mt-1">
                    {getResourceBadge(selectedAction.resource)}
                  </div>
                </div>
                <div>
                  <Label>Admin</Label>
                  <p className="text-sm font-medium">
                    {selectedAction.admin_email || selectedAction.admin_id}
                  </p>
                </div>
                <div>
                  <Label>Resource ID</Label>
                  <p className="text-sm">
                    {selectedAction.resource_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <p className="text-sm font-mono">
                    {selectedAction.ip_address || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">
                    {format(
                      new Date(selectedAction.timestamp),
                      'MMM dd, yyyy HH:mm:ss'
                    )}
                  </p>
                </div>
              </div>

              <div>
                <Label>User Agent</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md break-all">
                  {selectedAction.user_agent || 'N/A'}
                </p>
              </div>

              <div>
                <Label>Action Details</Label>
                <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-auto max-h-60">
                  {JSON.stringify(selectedAction.details, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
