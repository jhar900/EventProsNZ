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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Template,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'verification' | 'reminder' | 'notification' | 'custom';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  usage_count: number;
}

interface Communication {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'bounced';
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  template_id?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface UserCommunicationToolsProps {
  onSendCommunication: (
    communication: Omit<Communication, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onScheduleCommunication: (
    communication: Omit<Communication, 'id' | 'created_at' | 'updated_at'>,
    scheduledAt: string
  ) => Promise<void>;
  onUpdateTemplate: (
    templateId: string,
    template: Partial<EmailTemplate>
  ) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  loading?: boolean;
}

export default function UserCommunicationTools({
  onSendCommunication,
  onScheduleCommunication,
  onUpdateTemplate,
  onDeleteTemplate,
  loading = false,
}: UserCommunicationToolsProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [composeForm, setComposeForm] = useState({
    type: 'email',
    subject: '',
    content: '',
    template_id: '',
    scheduled_at: '',
    admin_notes: '',
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'custom',
  });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: 'template1',
        name: 'Welcome Email',
        subject: 'Welcome to EventProsNZ!',
        content:
          "Welcome to EventProsNZ! We're excited to have you on board...",
        type: 'welcome',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        usage_count: 25,
      },
      {
        id: 'template2',
        name: 'Profile Approval',
        subject: 'Your profile has been approved!',
        content:
          'Great news! Your profile has been approved and is now live...',
        type: 'verification',
        status: 'active',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        usage_count: 12,
      },
      {
        id: 'template3',
        name: 'Subscription Reminder',
        subject: 'Your subscription is expiring soon',
        content:
          'Your subscription will expire in 7 days. Renew now to continue...',
        type: 'reminder',
        status: 'active',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        usage_count: 8,
      },
    ];
    setTemplates(mockTemplates);

    const mockCommunications: Communication[] = [
      {
        id: 'comm1',
        user_id: 'user1',
        user_email: 'john.doe@example.com',
        user_name: 'John Doe',
        type: 'email',
        subject: 'Welcome to EventProsNZ!',
        content:
          "Welcome to EventProsNZ! We're excited to have you on board...",
        status: 'sent',
        sent_at: '2024-01-15T10:30:00Z',
        delivered_at: '2024-01-15T10:31:00Z',
        template_id: 'template1',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:31:00Z',
      },
      {
        id: 'comm2',
        user_id: 'user2',
        user_email: 'jane.smith@example.com',
        user_name: 'Jane Smith',
        type: 'email',
        subject: 'Your profile has been approved!',
        content:
          'Great news! Your profile has been approved and is now live...',
        status: 'scheduled',
        scheduled_at: '2024-01-20T14:00:00Z',
        template_id: 'template2',
        created_at: '2024-01-15T14:20:00Z',
        updated_at: '2024-01-15T14:20:00Z',
      },
    ];
    setCommunications(mockCommunications);
  }, []);

  const filteredCommunications = communications.filter(comm => {
    const matchesFilter =
      filter === 'all' || comm.status === filter || comm.type === filter;
    const matchesSearch =
      search === '' ||
      comm.user_name.toLowerCase().includes(search.toLowerCase()) ||
      comm.user_email.toLowerCase().includes(search.toLowerCase()) ||
      comm.subject.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'default',
      delivered: 'default',
      failed: 'destructive',
      bounced: 'destructive',
      scheduled: 'secondary',
      draft: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      case 'in_app':
        return <Users className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setComposeForm(prev => ({
        ...prev,
        template_id: templateId,
        subject: template.subject,
        content: template.content,
      }));
    }
  };

  const handleSendCommunication = async () => {
    try {
      const communication: Omit<
        Communication,
        'id' | 'created_at' | 'updated_at'
      > = {
        user_id: selectedUsers[0], // For single user communication
        user_email: 'user@example.com', // Get from user data
        user_name: 'User Name', // Get from user data
        type: composeForm.type as any,
        subject: composeForm.subject,
        content: composeForm.content,
        status: 'draft',
        template_id: composeForm.template_id || undefined,
        admin_notes: composeForm.admin_notes,
      };

      if (composeForm.scheduled_at) {
        await onScheduleCommunication(communication, composeForm.scheduled_at);
      } else {
        await onSendCommunication(communication);
      }

      setShowComposeDialog(false);
      setComposeForm({
        type: 'email',
        subject: '',
        content: '',
        template_id: '',
        scheduled_at: '',
        admin_notes: '',
      });
    } catch (error) {
      console.error('Communication failed:', error);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const template: Omit<
        EmailTemplate,
        'id' | 'created_at' | 'updated_at' | 'usage_count'
      > = {
        name: templateForm.name,
        subject: templateForm.subject,
        content: templateForm.content,
        type: templateForm.type as any,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      // Call API to save template
      setShowTemplateDialog(false);
      setTemplateForm({
        name: '',
        subject: '',
        content: '',
        type: 'custom',
      });
    } catch (error) {
      console.error('Template save failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                User Communication Tools
              </CardTitle>
              <CardDescription>
                Send emails, manage templates, and track communication history
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowComposeDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Compose
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTemplateDialog(true)}
              >
                <Template className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search communications..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="filter">Filter</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Template className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <CardDescription>
            Manage email templates for common communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{template.name}</h3>
                  <Badge
                    variant={
                      template.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {template.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {template.subject}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Used {template.usage_count} times
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowComposeDialog(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Communication History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Communication History
          </CardTitle>
          <CardDescription>
            Track all user communications and their status
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommunications.map(communication => (
                <TableRow key={communication.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {communication.user_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {communication.user_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(communication.type)}
                      <span className="text-sm">
                        {communication.type.toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {communication.subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(communication.status)}
                      {getStatusBadge(communication.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {communication.sent_at ? (
                      format(
                        new Date(communication.sent_at),
                        'MMM dd, yyyy HH:mm'
                      )
                    ) : communication.scheduled_at ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {format(
                            new Date(communication.scheduled_at),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not sent</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setShowHistoryDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compose Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Communication</DialogTitle>
            <DialogDescription>
              Send email or schedule communication to users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={composeForm.type}
                  onValueChange={value =>
                    setComposeForm(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="in_app">In-App Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template">Template</Label>
                <Select
                  value={composeForm.template_id}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject..."
                value={composeForm.subject}
                onChange={e =>
                  setComposeForm(prev => ({ ...prev, subject: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Email content..."
                value={composeForm.content}
                onChange={e =>
                  setComposeForm(prev => ({ ...prev, content: e.target.value }))
                }
                rows={8}
              />
            </div>

            <div>
              <Label htmlFor="scheduled-at">Schedule (Optional)</Label>
              <Input
                id="scheduled-at"
                type="datetime-local"
                value={composeForm.scheduled_at}
                onChange={e =>
                  setComposeForm(prev => ({
                    ...prev,
                    scheduled_at: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Input
                id="admin-notes"
                placeholder="Internal notes..."
                value={composeForm.admin_notes}
                onChange={e =>
                  setComposeForm(prev => ({
                    ...prev,
                    admin_notes: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowComposeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendCommunication} disabled={loading}>
              {composeForm.scheduled_at ? 'Schedule' : 'Send'} Communication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for common communications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="Template name..."
                value={templateForm.name}
                onChange={e =>
                  setTemplateForm(prev => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="template-type">Type</Label>
              <Select
                value={templateForm.type}
                onValueChange={value =>
                  setTemplateForm(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-subject">Subject</Label>
              <Input
                id="template-subject"
                placeholder="Email subject..."
                value={templateForm.subject}
                onChange={e =>
                  setTemplateForm(prev => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="template-content">Content</Label>
              <Textarea
                id="template-content"
                placeholder="Email content..."
                value={templateForm.content}
                onChange={e =>
                  setTemplateForm(prev => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={loading}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
