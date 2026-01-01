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
  TrendingUp,
  Play,
  Pause,
} from 'lucide-react';
import { EmailEditModal } from './EmailEditModal';

interface SubscriptionEmail {
  id: string;
  type:
    | 'confirmation'
    | 'billing_reminder'
    | 'payment_success'
    | 'payment_failure'
    | 'renewal'
    | 'change';
  name: string;
  subject: string;
  status: 'active' | 'paused' | 'draft';
  sentCount: number;
  openRate: number;
  clickRate: number;
  templateId: string;
  triggerEvent: string;
  timing: string;
}

interface SubscriptionEmailsProps {
  subscriptionId?: string;
  onEmailSent?: (emailId: string, type: string) => void;
}

export function SubscriptionEmails({
  subscriptionId: _subscriptionId,
  onEmailSent: _onEmailSent,
}: SubscriptionEmailsProps) {
  const [emails, setEmails] = useState<SubscriptionEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<SubscriptionEmail | null>(
    null
  );
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
    const mockEmails: SubscriptionEmail[] = [
      {
        id: '1',
        type: 'confirmation',
        name: 'Subscription Confirmation',
        subject: 'Welcome to EventProsNZ Premium!',
        status: 'active',
        sentCount: 1250,
        openRate: 78.5,
        clickRate: 35.2,
        templateId: 'subscription-confirmation',
        triggerEvent: 'subscription_created',
        timing: 'Immediate',
      },
      {
        id: '2',
        type: 'billing_reminder',
        name: 'Billing Reminder',
        subject: 'Your subscription will renew soon',
        status: 'active',
        sentCount: 2100,
        openRate: 65.3,
        clickRate: 28.7,
        templateId: 'billing-reminder',
        triggerEvent: 'billing_reminder',
        timing: '7 days before',
      },
      {
        id: '3',
        type: 'payment_success',
        name: 'Payment Success',
        subject: 'Payment received successfully',
        status: 'active',
        sentCount: 1890,
        openRate: 72.1,
        clickRate: 31.4,
        templateId: 'payment-success',
        triggerEvent: 'payment_successful',
        timing: 'Immediate',
      },
      {
        id: '4',
        type: 'payment_failure',
        name: 'Payment Failure',
        subject: 'Payment failed - action required',
        status: 'active',
        sentCount: 450,
        openRate: 85.2,
        clickRate: 42.8,
        templateId: 'payment-failure',
        triggerEvent: 'payment_failed',
        timing: 'Immediate',
      },
      {
        id: '5',
        type: 'renewal',
        name: 'Subscription Renewal',
        subject: 'Your subscription has been renewed',
        status: 'active',
        sentCount: 1680,
        openRate: 68.9,
        clickRate: 29.6,
        templateId: 'subscription-renewal',
        triggerEvent: 'subscription_renewed',
        timing: 'Immediate',
      },
      {
        id: '6',
        type: 'change',
        name: 'Subscription Change',
        subject: 'Your subscription has been updated',
        status: 'active',
        sentCount: 320,
        openRate: 71.4,
        clickRate: 33.1,
        templateId: 'subscription-change',
        triggerEvent: 'subscription_changed',
        timing: 'Immediate',
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

      let triggerAction = 'subscription_email';
      if (editingEmail.type === 'confirmation') {
        triggerAction = 'subscription_created';
      } else if (editingEmail.type === 'billing_reminder') {
        triggerAction = 'billing_reminder';
      } else if (editingEmail.type === 'payment_success') {
        triggerAction = 'payment_successful';
      } else if (editingEmail.type === 'payment_failure') {
        triggerAction = 'payment_failed';
      } else if (editingEmail.type === 'renewal') {
        triggerAction = 'subscription_renewed';
      } else if (editingEmail.type === 'change') {
        triggerAction = 'subscription_changed';
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
              'subscriptionPlan',
              'amount',
              'billingDate',
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
      case 'confirmation':
        return 'bg-green-100 text-green-800';
      case 'billing_reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_success':
        return 'bg-green-100 text-green-800';
      case 'payment_failure':
        return 'bg-red-100 text-red-800';
      case 'renewal':
        return 'bg-blue-100 text-blue-800';
      case 'change':
        return 'bg-purple-100 text-purple-800';
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
          <h2 className="text-2xl font-bold">Subscription Emails</h2>
          <p className="text-muted-foreground">
            Automated emails for subscription and billing communications
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
                +22% from last month
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
                +5.1% from last month
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
                +3.2% from last month
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
                        <span className="text-xs text-muted-foreground">
                          {email.timing}
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
