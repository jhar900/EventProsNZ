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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  FileText,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Bell,
  Mail,
  Settings,
  Users,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface StatusUpdate {
  id: string;
  feature_request_id: string;
  title: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  created_by: {
    first_name: string;
    last_name: string;
  };
  feature_request: {
    title: string;
    status: string;
    author: {
      first_name: string;
      last_name: string;
    };
  };
  metrics?: {
    sent_count: number;
    opened_count: number;
    clicked_count: number;
  };
}

interface StatusTemplate {
  id: string;
  name: string;
  trigger_status: string;
  subject_template: string;
  content_template: string;
  is_active: boolean;
  created_at: string;
}

interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  status_changes: boolean;
  milestone_updates: boolean;
  community_announcements: boolean;
}

export default function StatusUpdateSystem() {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [templates, setTemplates] = useState<StatusTemplate[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('updates');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<StatusUpdate | null>(
    null
  );

  // Form state for creating status updates
  const [updateForm, setUpdateForm] = useState({
    feature_request_id: '',
    title: '',
    content: '',
    scheduled_at: '',
  });

  // Form state for creating templates
  const [templateForm, setTemplateForm] = useState({
    name: '',
    trigger_status: '',
    subject_template: '',
    content_template: '',
    is_active: true,
  });

  useEffect(() => {
    fetchStatusUpdates();
    fetchTemplates();
    fetchPreferences();
  }, []);

  const fetchStatusUpdates = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/status-updates'
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status updates');
      }

      setStatusUpdates(data.updates || []);
    } catch (err) {
      console.error('Error fetching status updates:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch status updates'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/status-templates'
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch templates');
      }

      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/notification-preferences'
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preferences');
      }

      setPreferences(data.preferences || []);
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  const handleCreateStatusUpdate = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/status-updates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateForm),
        }
      );

      if (response.ok) {
        toast.success('Status update created successfully');
        setShowCreateDialog(false);
        setUpdateForm({
          feature_request_id: '',
          title: '',
          content: '',
          scheduled_at: '',
        });
        fetchStatusUpdates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create status update');
      }
    } catch (err) {
      console.error('Error creating status update:', err);
      toast.error('Failed to create status update');
    }
  };

  const handleSendStatusUpdate = async (updateId: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/status-updates/${updateId}/send`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        toast.success('Status update sent successfully');
        fetchStatusUpdates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send status update');
      }
    } catch (err) {
      console.error('Error sending status update:', err);
      toast.error('Failed to send status update');
    }
  };

  const handleDeleteStatusUpdate = async (updateId: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/status-updates/${updateId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Status update deleted successfully');
        fetchStatusUpdates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete status update');
      }
    } catch (err) {
      console.error('Error deleting status update:', err);
      toast.error('Failed to delete status update');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/status-templates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateForm),
        }
      );

      if (response.ok) {
        toast.success('Template created successfully');
        setShowTemplateDialog(false);
        setTemplateForm({
          name: '',
          trigger_status: '',
          subject_template: '',
          content_template: '',
          is_active: true,
        });
        fetchTemplates();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create template');
      }
    } catch (err) {
      console.error('Error creating template:', err);
      toast.error('Failed to create template');
    }
  };

  const handleUpdatePreferences = async (
    userId: string,
    newPreferences: Partial<NotificationPreferences>
  ) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/notification-preferences/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPreferences),
        }
      );

      if (response.ok) {
        toast.success('Notification preferences updated successfully');
        fetchPreferences();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update preferences');
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      toast.error('Failed to update preferences');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <Button onClick={fetchStatusUpdates} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Update Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Status Updates
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Status Updates</CardTitle>
                  <CardDescription>
                    Manage and send status updates for feature requests
                  </CardDescription>
                </div>
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Status Update</DialogTitle>
                      <DialogDescription>
                        Create a status update for a feature request
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="feature-request">Feature Request</Label>
                        <Select
                          value={updateForm.feature_request_id}
                          onValueChange={value =>
                            setUpdateForm(prev => ({
                              ...prev,
                              feature_request_id: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select feature request" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* This would be populated with actual feature requests */}
                            <SelectItem value="1">
                              Sample Feature Request 1
                            </SelectItem>
                            <SelectItem value="2">
                              Sample Feature Request 2
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="update-title">Title</Label>
                        <Input
                          id="update-title"
                          value={updateForm.title}
                          onChange={e =>
                            setUpdateForm(prev => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Enter update title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="update-content">Content</Label>
                        <Textarea
                          id="update-content"
                          value={updateForm.content}
                          onChange={e =>
                            setUpdateForm(prev => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          placeholder="Enter update content"
                          rows={6}
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduled-at">
                          Schedule (Optional)
                        </Label>
                        <Input
                          id="scheduled-at"
                          type="datetime-local"
                          value={updateForm.scheduled_at}
                          onChange={e =>
                            setUpdateForm(prev => ({
                              ...prev,
                              scheduled_at: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateStatusUpdate}>
                          Create Update
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature Request</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusUpdates.map(update => (
                      <TableRow key={update.id}>
                        <TableCell>
                          <div className="font-medium">
                            {update.feature_request.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            by {update.feature_request.author.first_name}{' '}
                            {update.feature_request.author.last_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{update.title}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {update.content}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(update.status)}
                            <Badge className={getStatusColor(update.status)}>
                              {update.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(update.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {update.metrics && (
                            <div className="text-sm">
                              <div>Sent: {update.metrics.sent_count}</div>
                              <div>Opened: {update.metrics.opened_count}</div>
                              <div>Clicked: {update.metrics.clicked_count}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {update.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSendStatusUpdate(update.id)
                                }
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUpdate(update)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDeleteStatusUpdate(update.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
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

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Status Update Templates</CardTitle>
                  <CardDescription>
                    Create and manage automated status update templates
                  </CardDescription>
                </div>
                <Dialog
                  open={showTemplateDialog}
                  onOpenChange={setShowTemplateDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Status Update Template</DialogTitle>
                      <DialogDescription>
                        Create a template for automated status updates
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          value={templateForm.name}
                          onChange={e =>
                            setTemplateForm(prev => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Enter template name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="trigger-status">Trigger Status</Label>
                        <Select
                          value={templateForm.trigger_status}
                          onValueChange={value =>
                            setTemplateForm(prev => ({
                              ...prev,
                              trigger_status: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under_review">
                              Under Review
                            </SelectItem>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="in_development">
                              In Development
                            </SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subject-template">
                          Subject Template
                        </Label>
                        <Input
                          id="subject-template"
                          value={templateForm.subject_template}
                          onChange={e =>
                            setTemplateForm(prev => ({
                              ...prev,
                              subject_template: e.target.value,
                            }))
                          }
                          placeholder="Enter subject template"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content-template">
                          Content Template
                        </Label>
                        <Textarea
                          id="content-template"
                          value={templateForm.content_template}
                          onChange={e =>
                            setTemplateForm(prev => ({
                              ...prev,
                              content_template: e.target.value,
                            }))
                          }
                          placeholder="Enter content template"
                          rows={6}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowTemplateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTemplate}>
                          Create Template
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Trigger Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="font-medium">{template.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {template.trigger_status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              template.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {template.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(template.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
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

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage user notification preferences for status updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {preferences.map(pref => (
                  <div
                    key={pref.user_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">User {pref.user_id}</div>
                      <div className="text-sm text-gray-500">
                        Email:{' '}
                        {pref.email_notifications ? 'Enabled' : 'Disabled'} |
                        Push: {pref.push_notifications ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdatePreferences(pref.user_id, {
                            email_notifications: !pref.email_notifications,
                          })
                        }
                      >
                        Toggle Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdatePreferences(pref.user_id, {
                            push_notifications: !pref.push_notifications,
                          })
                        }
                      >
                        Toggle Push
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Update Analytics</CardTitle>
              <CardDescription>
                Analytics and metrics for status update performance
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
    </div>
  );
}
