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
  MessageCircle,
  Send,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Target,
  Bell,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: 'all' | 'feature_requesters' | 'voters' | 'specific';
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  created_by: {
    first_name: string;
    last_name: string;
  };
  metrics?: {
    sent_count: number;
    opened_count: number;
    clicked_count: number;
  };
}

interface UpdateNotification {
  id: string;
  feature_request_id: string;
  title: string;
  content: string;
  status: 'pending' | 'sent';
  created_at: string;
  sent_at?: string;
  feature_request: {
    title: string;
    status: string;
  };
}

export default function CommunityCommunication() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('announcements');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  // Form state for creating announcements
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    target_audience: 'all' as
      | 'all'
      | 'feature_requesters'
      | 'voters'
      | 'specific',
    scheduled_at: '',
  });

  // Template state
  const [templates, setTemplates] = useState([
    {
      id: 'status_update',
      name: 'Status Update',
      subject: 'Update on your feature request: {{title}}',
      content:
        'Hi {{user_name}},\n\nWe have an update on your feature request "{{title}}".\n\nStatus: {{status}}\n\n{{message}}\n\nThank you for your feedback!\n\nThe EventProsNZ Team',
    },
    {
      id: 'roadmap_announcement',
      name: 'Roadmap Announcement',
      subject: 'New features coming to EventProsNZ',
      content:
        "Hi {{user_name}},\n\nWe're excited to share our latest roadmap updates with you!\n\n{{content}}\n\nThank you for being part of our community!\n\nThe EventProsNZ Team",
    },
    {
      id: 'feature_completion',
      name: 'Feature Completion',
      subject: 'Your requested feature is now live!',
      content:
        'Hi {{user_name}},\n\nGreat news! The feature you requested "{{title}}" has been completed and is now available.\n\n{{description}}\n\nThank you for your valuable feedback!\n\nThe EventProsNZ Team',
    },
  ]);

  useEffect(() => {
    fetchAnnouncements();
    fetchNotifications();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/feature-requests/announcements');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch announcements');
      }

      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch announcements'
      );
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/feature-requests/notifications');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const response = await fetch(
        '/api/admin/feature-requests/announcements',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(announcementForm),
        }
      );

      if (response.ok) {
        toast.success('Announcement created successfully');
        setShowCreateDialog(false);
        setAnnouncementForm({
          title: '',
          content: '',
          target_audience: 'all',
          scheduled_at: '',
        });
        fetchAnnouncements();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create announcement');
      }
    } catch (err) {
      console.error('Error creating announcement:', err);
      toast.error('Failed to create announcement');
    }
  };

  const handleSendAnnouncement = async (announcementId: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/announcements/${announcementId}/send`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        toast.success('Announcement sent successfully');
        fetchAnnouncements();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send announcement');
      }
    } catch (err) {
      console.error('Error sending announcement:', err);
      toast.error('Failed to send announcement');
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/announcements/${announcementId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Announcement deleted successfully');
        fetchAnnouncements();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete announcement');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      toast.error('Failed to delete announcement');
    }
  };

  const handleSendStatusUpdate = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/feature-requests/notifications/${notificationId}/send`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        toast.success('Status update sent successfully');
        fetchNotifications();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send status update');
      }
    } catch (err) {
      console.error('Error sending status update:', err);
      toast.error('Failed to send status update');
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

  const getTargetAudienceColor = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'bg-blue-100 text-blue-800';
      case 'feature_requesters':
        return 'bg-purple-100 text-purple-800';
      case 'voters':
        return 'bg-green-100 text-green-800';
      case 'specific':
        return 'bg-orange-100 text-orange-800';
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
          <Button onClick={fetchAnnouncements} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Communication Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Communication Templates
          </CardTitle>
          <CardDescription>
            Pre-built templates for common communication scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {template.content}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAnnouncementForm({
                        title: template.subject,
                        content: template.content,
                        target_audience: 'all',
                        scheduled_at: '',
                      });
                      setShowCreateDialog(true);
                    }}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Communication Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="announcements"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Status Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Community Announcements</CardTitle>
                  <CardDescription>
                    Send announcements to the community about new features and
                    updates
                  </CardDescription>
                </div>
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Community Announcement</DialogTitle>
                      <DialogDescription>
                        Send an announcement to the community about new features
                        or updates
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="announcement-title">Title</Label>
                        <Input
                          id="announcement-title"
                          value={announcementForm.title}
                          onChange={e =>
                            setAnnouncementForm(prev => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Enter announcement title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="announcement-content">Content</Label>
                        <Textarea
                          id="announcement-content"
                          value={announcementForm.content}
                          onChange={e =>
                            setAnnouncementForm(prev => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          placeholder="Enter announcement content"
                          rows={6}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="target-audience">
                            Target Audience
                          </Label>
                          <Select
                            value={announcementForm.target_audience}
                            onValueChange={(value: any) =>
                              setAnnouncementForm(prev => ({
                                ...prev,
                                target_audience: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              <SelectItem value="feature_requesters">
                                Feature Requesters
                              </SelectItem>
                              <SelectItem value="voters">Voters</SelectItem>
                              <SelectItem value="specific">
                                Specific Users
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="scheduled-at">
                            Schedule (Optional)
                          </Label>
                          <Input
                            id="scheduled-at"
                            type="datetime-local"
                            value={announcementForm.scheduled_at}
                            onChange={e =>
                              setAnnouncementForm(prev => ({
                                ...prev,
                                scheduled_at: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateAnnouncement}>
                          Create Announcement
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
                      <TableHead>Title</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map(announcement => (
                      <TableRow key={announcement.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {announcement.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {announcement.content}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getTargetAudienceColor(
                              announcement.target_audience
                            )}
                          >
                            {announcement.target_audience.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(announcement.status)}
                            <Badge
                              className={getStatusColor(announcement.status)}
                            >
                              {announcement.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              announcement.created_at
                            ).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {announcement.metrics && (
                            <div className="text-sm">
                              <div>Sent: {announcement.metrics.sent_count}</div>
                              <div>
                                Opened: {announcement.metrics.opened_count}
                              </div>
                              <div>
                                Clicked: {announcement.metrics.clicked_count}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {announcement.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSendAnnouncement(announcement.id)
                                }
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSelectedAnnouncement(announcement)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDeleteAnnouncement(announcement.id)
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

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Update Notifications</CardTitle>
              <CardDescription>
                Automated notifications for feature request status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature Request</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map(notification => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="font-medium">
                            {notification.feature_request.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusColor(
                              notification.feature_request.status
                            )}
                          >
                            {notification.feature_request.status.replace(
                              '_',
                              ' '
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              notification.created_at
                            ).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusColor(notification.status)}
                          >
                            {notification.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {notification.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleSendStatusUpdate(notification.id)
                              }
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
