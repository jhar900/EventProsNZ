'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Send,
  Eye,
  Edit,
  BarChart3,
  Play,
  Pause,
  TrendingUp,
} from 'lucide-react';
import { EmailEditModal } from './EmailEditModal';

interface PlatformAnnouncementEmail {
  id: string;
  type:
    | 'feature_announcement'
    | 'maintenance'
    | 'policy_update'
    | 'security_alert'
    | 'newsletter';
  name: string;
  subject: string;
  status: 'active' | 'paused' | 'draft';
  sentCount: number;
  openRate: number;
  clickRate: number;
  templateId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string;
}

interface PlatformAnnouncementEmailsProps {
  onEmailSent?: (emailId: string, type: string) => void;
}

export function PlatformAnnouncementEmails({
  onEmailSent: _onEmailSent,
}: PlatformAnnouncementEmailsProps) {
  const [emails, setEmails] = useState<PlatformAnnouncementEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] =
    useState<PlatformAnnouncementEmail | null>(null);
  const [_editTemplate, setEditTemplate] = useState<any>(null);
  const [loadingEditTemplate, setLoadingEditTemplate] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    subject: '',
    status: 'active' as 'active' | 'paused' | 'draft',
    htmlContent: '',
    textContent: '',
  });

  useEffect(() => {
    const mockEmails: PlatformAnnouncementEmail[] = [
      {
        id: '1',
        type: 'feature_announcement',
        name: 'New Feature Announcement',
        subject: 'Exciting new features are now available!',
        status: 'active',
        sentCount: 3200,
        openRate: 45.2,
        clickRate: 18.7,
        templateId: 'feature-announcement',
        priority: 'medium',
        targetAudience: 'All users',
      },
      {
        id: '2',
        type: 'maintenance',
        name: 'Scheduled Maintenance',
        subject: 'Scheduled maintenance notification',
        status: 'active',
        sentCount: 4500,
        openRate: 72.8,
        clickRate: 25.4,
        templateId: 'maintenance-notification',
        priority: 'high',
        targetAudience: 'All users',
      },
      {
        id: '3',
        type: 'policy_update',
        name: 'Policy Update',
        subject: 'Important policy updates',
        status: 'active',
        sentCount: 2800,
        openRate: 58.3,
        clickRate: 22.1,
        templateId: 'policy-update',
        priority: 'medium',
        targetAudience: 'All users',
      },
      {
        id: '4',
        type: 'security_alert',
        name: 'Security Alert',
        subject: 'Important security update',
        status: 'active',
        sentCount: 1200,
        openRate: 89.5,
        clickRate: 45.2,
        templateId: 'security-alert',
        priority: 'urgent',
        targetAudience: 'All users',
      },
      {
        id: '5',
        type: 'newsletter',
        name: 'Monthly Newsletter',
        subject: 'EventProsNZ Monthly Update',
        status: 'active',
        sentCount: 5600,
        openRate: 38.9,
        clickRate: 15.6,
        templateId: 'newsletter',
        priority: 'low',
        targetAudience: 'Subscribed users',
      },
    ];

    setEmails(mockEmails);
    setLoading(false);
  }, []);

  const handleToggleEmail = async (emailId: string) => {
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId
          ? {
              ...email,
              status: email.status === 'active' ? 'paused' : 'active',
            }
          : email
      )
    );
  };

  const handleSendTestEmail = (emailId: string) => {
    console.log('Send test email:', emailId);
  };

  const handlePreviewEmail = (emailId: string) => {
    console.log('Preview email:', emailId);
  };

  const handleEditEmail = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    setEditingEmail(email);
    setEditDialogOpen(true);
    setLoadingEditTemplate(true);

    setEditFormData({
      name: email.name,
      subject: email.subject,
      status: email.status,
      htmlContent: '',
      textContent: '',
    });

    try {
      const adminToken =
        process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN ||
        'admin-secure-token-2024-eventpros';

      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          email.templateId
        );

      let template = null;

      if (isValidUUID) {
        const response = await fetch(
          `/api/admin/email-templates/${email.templateId}`,
          {
            credentials: 'include',
            headers: {
              'x-admin-token': adminToken,
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          template = data.template;
        }
      }

      if (!template) {
        const allTemplatesResponse = await fetch('/api/admin/email-templates', {
          credentials: 'include',
          headers: {
            'x-admin-token': adminToken,
            'Content-Type': 'application/json',
          },
        });

        if (allTemplatesResponse.ok) {
          const allTemplatesData = await allTemplatesResponse.json();
          const allTemplates = allTemplatesData.templates || [];

          template = allTemplates.find(
            (t: any) => t.name.toLowerCase() === email.name.toLowerCase()
          );

          if (!template && email.id) {
            const slugFromEmailKey = email.id.toLowerCase();
            template = allTemplates.find(
              (t: any) =>
                t.slug === slugFromEmailKey ||
                t.slug?.includes(slugFromEmailKey)
            );
          }
        }
      }

      if (template) {
        setEditTemplate(template);
        setEditFormData(prev => ({
          ...prev,
          htmlContent: template.html_body || '',
          textContent: template.text_body || '',
        }));
      } else {
        setEditTemplate(null);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      setEditTemplate(null);
    } finally {
      setLoadingEditTemplate(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!editingEmail) return;

    try {
      const adminToken =
        process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN ||
        'admin-secure-token-2024-eventpros';

      const baseSlug = editingEmail.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const slug = `${baseSlug}-${Date.now()}`;

      const textContent =
        editFormData.textContent ||
        editFormData.htmlContent
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();

      let triggerAction = 'platform_announcement';
      if (editingEmail.type === 'feature_announcement') {
        triggerAction = 'feature_announcement';
      } else if (editingEmail.type === 'maintenance') {
        triggerAction = 'maintenance_notification';
      } else if (editingEmail.type === 'policy_update') {
        triggerAction = 'policy_update';
      } else if (editingEmail.type === 'security_alert') {
        triggerAction = 'security_alert';
      } else if (editingEmail.type === 'newsletter') {
        triggerAction = 'newsletter';
      }

      let existingTemplate = null;
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          editingEmail.templateId
        );

      if (isValidUUID) {
        const response = await fetch(
          `/api/admin/email-templates/${editingEmail.templateId}`,
          {
            credentials: 'include',
            headers: {
              'x-admin-token': adminToken,
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          existingTemplate = data.template;
        }
      }

      if (!existingTemplate) {
        const allTemplatesResponse = await fetch('/api/admin/email-templates', {
          credentials: 'include',
          headers: {
            'x-admin-token': adminToken,
            'Content-Type': 'application/json',
          },
        });

        if (allTemplatesResponse.ok) {
          const allTemplatesData = await allTemplatesResponse.json();
          const allTemplates = allTemplatesData.templates || [];

          existingTemplate = allTemplates.find(
            (t: any) => t.name.toLowerCase() === editingEmail.name.toLowerCase()
          );

          if (!existingTemplate && editingEmail.id) {
            const slugFromEmailKey = editingEmail.id.toLowerCase();
            existingTemplate = allTemplates.find(
              (t: any) =>
                t.slug === slugFromEmailKey ||
                t.slug?.includes(slugFromEmailKey)
            );
          }
        }
      }

      let templateId = editingEmail.templateId;

      if (existingTemplate) {
        const updateResponse = await fetch(
          `/api/admin/email-templates/${existingTemplate.id}`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'x-admin-token': adminToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: editingEmail.name,
              slug: existingTemplate.slug,
              subject: editFormData.subject,
              html_body: editFormData.htmlContent,
              text_body: textContent,
              trigger_action: triggerAction,
              is_active: true,
            }),
          }
        );

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'Failed to update template');
        }

        templateId = existingTemplate.id;
      } else {
        const createResponse = await fetch('/api/admin/email-templates', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'x-admin-token': adminToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editingEmail.name,
            slug: slug,
            subject: editFormData.subject,
            html_body: editFormData.htmlContent,
            text_body: textContent,
            trigger_action: triggerAction,
            is_active: true,
            variables: [
              'firstName',
              'email',
              'announcementTitle',
              'announcementContent',
            ],
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create template');
        }

        const createData = await createResponse.json();
        templateId = createData.template.id;
      }

      setEmails(prev =>
        prev.map(email =>
          email.id === editingEmail.id
            ? {
                ...email,
                templateId: templateId,
                name: editFormData.name,
                subject: editFormData.subject,
                status: editFormData.status,
              }
            : email
        )
      );

      setEditDialogOpen(false);
      alert('Email template saved successfully!');
    } catch (error) {
      console.error('Error saving email:', error);
      alert(
        `Failed to save email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const getEmailTypeColor = (type: string) => {
    switch (type) {
      case 'feature_announcement':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'policy_update':
        return 'bg-purple-100 text-purple-800';
      case 'security_alert':
        return 'bg-red-100 text-red-800';
      case 'newsletter':
        return 'bg-green-100 text-green-800';
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

  const totalSent = emails.reduce((sum, email) => sum + email.sentCount, 0);
  const avgOpenRate =
    emails.length > 0
      ? emails.reduce((sum, email) => sum + email.openRate, 0) / emails.length
      : 0;
  const avgClickRate =
    emails.length > 0
      ? emails.reduce((sum, email) => sum + email.clickRate, 0) / emails.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Announcement Emails</h2>
          <p className="text-muted-foreground">
            Automated emails for platform updates and announcements
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +18% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Open Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgOpenRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                +2.8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Click Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgClickRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                +1.9% from last month
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          {emails.map((email, index) => (
            <Card key={email.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{email.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {email.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            email.status === 'active' ? 'default' : 'secondary'
                          }
                        >
                          {email.status}
                        </Badge>
                        <Badge className={getEmailTypeColor(email.type)}>
                          {email.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(email.priority)}>
                          {email.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {email.targetAudience}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-medium">
                        {email.sentCount.toLocaleString()} sent
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {email.openRate}% open • {email.clickRate}% click
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleEmail(email.id)}
                    >
                      {email.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewEmail(email.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditEmail(email.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendTestEmail(email.id)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Email Dialog */}
      <EmailEditModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        email={editingEmail}
        formData={editFormData}
        onFormDataChange={data => setEditFormData(data as typeof editFormData)}
        loading={loadingEditTemplate}
        onSave={handleSaveEmail}
      />
    </div>
  );
}
