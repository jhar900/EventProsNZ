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
  Bell,
  Clock,
  User,
  Plus,
  Filter,
  Eye,
  AlertCircle,
  Info,
  Zap,
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  is_resolved: boolean;
  created_at: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution?: string;
}

interface AlertFilters {
  severity?: string;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

export default function AlertSystem() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlertFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [showResolved, setShowResolved] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertType: '',
    severity: 'medium',
    message: '',
    details: '',
  });

  const { fetchAlerts, resolveAlert, dismissAlert, createAlert } = useAdmin();

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const alertFilters = {
        ...filters,
        severity: selectedSeverity === 'all' ? undefined : selectedSeverity,
        resolved: showResolved ? undefined : false,
      };

      const result = await fetchAlerts(alertFilters);
      if (result) {
        setAlerts(result.alerts || []);
        setSummary(result.summary || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [filters, selectedSeverity, showResolved]);

  const handleResolveAlert = async (alert: SystemAlert) => {
    try {
      setIsResolving(true);
      const result = await resolveAlert(alert.id, resolutionText);

      if (result?.success) {
        await loadAlerts();
        setSelectedAlert(null);
        setResolutionText('');
      }
    } catch (err) {
      } finally {
      setIsResolving(false);
    }
  };

  const handleDismissAlert = async (alert: SystemAlert) => {
    try {
      const result = await dismissAlert(alert.id);

      if (result?.success) {
        await loadAlerts();
      }
    } catch (err) {
      }
  };

  const handleCreateAlert = async () => {
    try {
      setIsCreating(true);
      const result = await createAlert(
        newAlert.alertType,
        newAlert.severity,
        newAlert.message,
        newAlert.details ? JSON.parse(newAlert.details) : undefined
      );

      if (result?.alert) {
        await loadAlerts();
        setNewAlert({
          alertType: '',
          severity: 'medium',
          message: '',
          details: '',
        });
      }
    } catch (err) {
      } finally {
      setIsCreating(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
      <Badge
        className={
          colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        }
      >
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (isResolved: boolean) => {
    if (isResolved) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Resolved
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'performance':
        return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'system':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'user':
        return <User className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        alert.alert_type.toLowerCase().includes(searchLower) ||
        alert.message.toLowerCase().includes(searchLower) ||
        alert.severity.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading alerts...</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Alert System</h1>
          <p className="text-muted-foreground">
            Monitor and manage system alerts and notifications
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Create a new system alert for monitoring purposes
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alertType">Alert Type</Label>
                  <Input
                    id="alertType"
                    placeholder="e.g., security, performance, system"
                    value={newAlert.alertType}
                    onChange={e =>
                      setNewAlert(prev => ({
                        ...prev,
                        alertType: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={newAlert.severity}
                    onValueChange={value =>
                      setNewAlert(prev => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Input
                    id="message"
                    placeholder="Alert message"
                    value={newAlert.message}
                    onChange={e =>
                      setNewAlert(prev => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">Details (JSON)</Label>
                  <Textarea
                    id="details"
                    placeholder='{"key": "value"}'
                    value={newAlert.details}
                    onChange={e =>
                      setNewAlert(prev => ({
                        ...prev,
                        details: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCreateAlert}
                  disabled={
                    isCreating || !newAlert.alertType || !newAlert.message
                  }
                >
                  {isCreating ? 'Creating...' : 'Create Alert'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={loadAlerts} variant="outline" size="sm">
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
                Total Alerts
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAlerts}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.activeAlerts}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical Alerts
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.criticalAlerts}
              </div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Resolved Today
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.resolvedToday}
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
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
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={selectedSeverity}
                onValueChange={setSelectedSeverity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={showResolved ? 'all' : 'active'}
                onValueChange={value => setShowResolved(value === 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="all">All Alerts</SelectItem>
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

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <div className="font-medium max-w-xs truncate">
                            {alert.message}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {alert.alert_type}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getAlertTypeIcon(alert.alert_type)}
                        <span className="text-sm">{alert.alert_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>{getStatusBadge(alert.is_resolved)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(alert.created_at).toLocaleString()}
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
                              onClick={() => setSelectedAlert(alert)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Alert Details</DialogTitle>
                              <DialogDescription>
                                View and manage this system alert
                              </DialogDescription>
                            </DialogHeader>

                            {selectedAlert && (
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Alert Type
                                    </Label>
                                    <div className="text-sm text-muted-foreground">
                                      {selectedAlert.alert_type}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Severity
                                    </Label>
                                    <div className="text-sm text-muted-foreground">
                                      {getSeverityBadge(selectedAlert.severity)}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">
                                    Message
                                  </Label>
                                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                                    {selectedAlert.message}
                                  </div>
                                </div>

                                {selectedAlert.details && (
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Details
                                    </Label>
                                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                                      <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(
                                          selectedAlert.details,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Created
                                    </Label>
                                    <div className="text-sm text-muted-foreground">
                                      {new Date(
                                        selectedAlert.created_at
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Status
                                    </Label>
                                    <div className="text-sm text-muted-foreground">
                                      {getStatusBadge(
                                        selectedAlert.is_resolved
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {selectedAlert.is_resolved &&
                                  selectedAlert.resolution && (
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Resolution
                                      </Label>
                                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                                        {selectedAlert.resolution}
                                      </div>
                                    </div>
                                  )}

                                {!selectedAlert.is_resolved && (
                                  <div>
                                    <Label htmlFor="resolution">
                                      Resolution Notes
                                    </Label>
                                    <Textarea
                                      id="resolution"
                                      placeholder="Enter resolution details..."
                                      value={resolutionText}
                                      onChange={e =>
                                        setResolutionText(e.target.value)
                                      }
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            <DialogFooter>
                              {!selectedAlert?.is_resolved && (
                                <>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleDismissAlert(selectedAlert!)
                                    }
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Dismiss
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleResolveAlert(selectedAlert!)
                                    }
                                    disabled={
                                      isResolving || !resolutionText.trim()
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {isResolving ? 'Resolving...' : 'Resolve'}
                                  </Button>
                                </>
                              )}
                              {selectedAlert?.is_resolved && (
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedAlert(null)}
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

          {filteredAlerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No alerts found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
