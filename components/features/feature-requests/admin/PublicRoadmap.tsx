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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Globe,
  Eye,
  Share2,
  Calendar,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Settings,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_date?: string;
  created_at: string;
  updated_at: string;
  feature_requests: Array<{
    id: string;
    title: string;
    vote_count: number;
    status: string;
  }>;
  is_public: boolean;
  public_url?: string;
}

interface PublicRoadmapSettings {
  enabled: boolean;
  show_votes: boolean;
  show_comments: boolean;
  allow_feedback: boolean;
  custom_domain?: string;
  theme: 'light' | 'dark' | 'auto';
  layout: 'timeline' | 'kanban' | 'list';
}

export default function PublicRoadmap() {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [settings, setSettings] = useState<PublicRoadmapSettings>({
    enabled: false,
    show_votes: true,
    show_comments: true,
    allow_feedback: true,
    theme: 'light',
    layout: 'timeline',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  useEffect(() => {
    fetchRoadmapItems();
    fetchSettings();
  }, []);

  const fetchRoadmapItems = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/roadmap/public'
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch roadmap items');
      }

      setRoadmapItems(data.items || []);
    } catch (err) {
      console.error('Error fetching roadmap items:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch roadmap items'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/public-roadmap-settings'
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings');
      }

      setSettings(data.settings || settings);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleUpdateSettings = async (
    newSettings: Partial<PublicRoadmapSettings>
  ) => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/public-roadmap-settings',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        }
      );

      if (response.ok) {
        toast.success('Settings updated successfully');
        setSettings(prev => ({ ...prev, ...newSettings }));
        fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings');
    }
  };

  const handleTogglePublic = async (itemId: string, isPublic: boolean) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/roadmap/${itemId}/public`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_public: isPublic }),
        }
      );

      if (response.ok) {
        toast.success(
          `Roadmap item ${isPublic ? 'published' : 'unpublished'} successfully`
        );
        fetchRoadmapItems();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update public status');
      }
    } catch (err) {
      console.error('Error updating public status:', err);
      toast.error('Failed to update public status');
    }
  };

  const handleShareRoadmap = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/roadmap/share',
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.public_url) {
          navigator.clipboard.writeText(data.public_url);
          toast.success('Public roadmap URL copied to clipboard');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate share URL');
      }
    } catch (err) {
      console.error('Error sharing roadmap:', err);
      toast.error('Failed to share roadmap');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Target className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const filteredItems = roadmapItems.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
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
          <Button onClick={fetchRoadmapItems} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Public Roadmap Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Public Roadmap
              </CardTitle>
              <CardDescription>
                Share your development roadmap with the community
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={handleShareRoadmap}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant={settings.enabled ? 'default' : 'outline'}
                onClick={() =>
                  handleUpdateSettings({ enabled: !settings.enabled })
                }
              >
                {settings.enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{roadmapItems.length}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {roadmapItems.filter(item => item.is_public).length}
              </div>
              <div className="text-sm text-gray-500">Public Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {
                  roadmapItems.filter(item => item.status === 'completed')
                    .length
                }
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {
                  roadmapItems.filter(item => item.status === 'in_progress')
                    .length
                }
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Public Roadmap Preview</CardTitle>
              <CardDescription>
                Preview how your roadmap will appear to the public
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(item.status)}
                      </div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {item.description}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          {item.target_date && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(
                                  item.target_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.is_public ? (
                        <Badge className="bg-green-100 text-green-800">
                          Public
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          Private
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleTogglePublic(item.id, !item.is_public)
                        }
                      >
                        {item.is_public ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roadmap Items</CardTitle>
                  <CardDescription>
                    Manage which items are visible on the public roadmap
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Target Date</TableHead>
                      <TableHead>Public</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {item.description}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.feature_requests.length} feature requests
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {item.target_date
                              ? new Date(item.target_date).toLocaleDateString()
                              : 'No date'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.is_public
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {item.is_public ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleTogglePublic(item.id, !item.is_public)
                              }
                            >
                              {item.is_public ? 'Hide' : 'Show'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(`/roadmap/${item.id}`, '_blank')
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Public Roadmap Analytics</CardTitle>
              <CardDescription>
                Analytics and metrics for the public roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500">
                Analytics data would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Public Roadmap Settings</DialogTitle>
            <DialogDescription>
              Configure how your public roadmap appears to visitors
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Vote Counts</div>
                <div className="text-sm text-gray-500">
                  Display vote counts on feature requests
                </div>
              </div>
              <Button
                variant={settings.show_votes ? 'default' : 'outline'}
                onClick={() =>
                  handleUpdateSettings({ show_votes: !settings.show_votes })
                }
              >
                {settings.show_votes ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Comments</div>
                <div className="text-sm text-gray-500">
                  Display comments on feature requests
                </div>
              </div>
              <Button
                variant={settings.show_comments ? 'default' : 'outline'}
                onClick={() =>
                  handleUpdateSettings({
                    show_comments: !settings.show_comments,
                  })
                }
              >
                {settings.show_comments ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Allow Feedback</div>
                <div className="text-sm text-gray-500">
                  Allow visitors to provide feedback
                </div>
              </div>
              <Button
                variant={settings.allow_feedback ? 'default' : 'outline'}
                onClick={() =>
                  handleUpdateSettings({
                    allow_feedback: !settings.allow_feedback,
                  })
                }
              >
                {settings.allow_feedback ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div>
              <Label htmlFor="custom-domain">Custom Domain (Optional)</Label>
              <Input
                id="custom-domain"
                value={settings.custom_domain || ''}
                onChange={e =>
                  handleUpdateSettings({ custom_domain: e.target.value })
                }
                placeholder="roadmap.yourcompany.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: any) =>
                    handleUpdateSettings({ theme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="layout">Layout</Label>
                <Select
                  value={settings.layout}
                  onValueChange={(value: any) =>
                    handleUpdateSettings({ layout: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="kanban">Kanban</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowSettingsDialog(false)}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
