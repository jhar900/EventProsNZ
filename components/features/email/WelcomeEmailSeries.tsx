'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  TrendingUp,
  Play,
  Pause,
  Edit,
  Eye,
  BarChart3,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailEditModal } from './EmailEditModal';

interface WelcomeEmail {
  id: string;
  name: string;
  subject: string;
  delay: number; // hours
  status: 'active' | 'paused' | 'draft';
  sentCount: number;
  openRate: number;
  clickRate: number;
  templateId: string;
  userType: 'event_manager' | 'contractor' | 'both';
}

interface WelcomeEmailSeriesProps {
  userId?: string;
  userType?: 'event_manager' | 'contractor';
  onEmailSent?: (emailId: string) => void;
  onSeriesComplete?: () => void;
}

export function WelcomeEmailSeries({
  userId: _userId,
  userType: _userType = 'event_manager',
  onEmailSent: _onEmailSent,
  onSeriesComplete: _onSeriesComplete,
}: WelcomeEmailSeriesProps) {
  const [emails, setEmails] = useState<WelcomeEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<WelcomeEmail | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<WelcomeEmail | null>(null);
  const [_editTemplate, setEditTemplate] = useState<any>(null);
  const [loadingEditTemplate, setLoadingEditTemplate] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    subject: '',
    delay: 0,
    status: 'active' as 'active' | 'paused' | 'draft',
    htmlContent: '',
    textContent: '',
  });
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState<WelcomeEmail | null>(null);
  const [testEmailTemplate, setTestEmailTemplate] = useState<any>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Load welcome email series from API
  useEffect(() => {
    const loadEmails = async () => {
      try {
        setLoading(true);
        const adminToken =
          process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN ||
          'admin-secure-token-2024-eventpros';

        const response = await fetch('/api/admin/welcome-email-series', {
          credentials: 'include',
          headers: {
            'x-admin-token': adminToken,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Map database records to WelcomeEmail format
          const loadedEmails: WelcomeEmail[] = (data.series || []).map(
            (item: any) => ({
              id: item.email_key || item.id, // Use email_key as primary identifier
              name: item.name,
              subject: item.subject,
              delay: item.delay_hours || 0,
              status: item.status || 'active',
              sentCount: 0, // TODO: Calculate from email_communications table
              openRate: 0, // TODO: Calculate from email_communications table
              clickRate: 0, // TODO: Calculate from email_communications table
              templateId: item.template_id || item.email_key, // Store email_key in templateId for backward compatibility
              userType: item.user_type || 'both',
            })
          );
          setEmails(loadedEmails);
        } else {
          console.error(
            'Failed to load welcome email series:',
            response.statusText
          );
          // Fallback to mock data if API fails
          const mockEmails: WelcomeEmail[] = [
            {
              id: 'email-verification-1',
              name: 'Email Verification',
              subject: 'Verify your email address',
              delay: 0,
              status: 'active',
              sentCount: 1350,
              openRate: 72.3,
              clickRate: 68.1,
              templateId: 'email-verification-1',
              userType: 'both',
            },
            {
              id: 'welcome-1',
              name: 'Welcome to EventProsNZ',
              subject: "Welcome to EventProsNZ - Let's Get Started!",
              delay: 0,
              status: 'active',
              sentCount: 1250,
              openRate: 68.5,
              clickRate: 24.3,
              templateId: 'welcome-1',
              userType: 'both',
            },
            {
              id: 'welcome-2',
              name: 'Platform Tour',
              subject: 'Take a tour of your new dashboard',
              delay: 24,
              status: 'active',
              sentCount: 1180,
              openRate: 45.2,
              clickRate: 18.7,
              templateId: 'welcome-2',
              userType: 'both',
            },
            {
              id: 'welcome-3',
              name: 'First Steps',
              subject: 'Your first steps to success',
              delay: 72,
              status: 'active',
              sentCount: 1100,
              openRate: 52.1,
              clickRate: 22.4,
              templateId: 'welcome-3',
              userType: 'both',
            },
            {
              id: 'welcome-4',
              name: 'Feature Spotlight',
              subject: 'Discover powerful features',
              delay: 168, // 7 days
              status: 'paused',
              sentCount: 950,
              openRate: 38.9,
              clickRate: 15.2,
              templateId: 'welcome-4',
              userType: 'both',
            },
          ];
          setEmails(mockEmails);
        }
      } catch (error) {
        console.error('Error loading welcome email series:', error);
        // Keep existing emails or set empty array
      } finally {
        setLoading(false);
      }
    };

    loadEmails();
  }, []);

  const handleToggleEmail = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    const newStatus = email.status === 'active' ? 'paused' : 'active';

    // Optimistically update UI
    setEmails(prev =>
      prev.map(e =>
        e.id === emailId
          ? {
              ...e,
              status: newStatus,
            }
          : e
      )
    );

    try {
      const adminToken =
        process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN ||
        'admin-secure-token-2024-eventpros';

      // Use email.id as email_key (since we set id to email_key when loading from DB)
      // For mock data, templateId contains the email_key
      const emailKey =
        email.id.includes('-') &&
        !email.id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
          ? email.id // It's an email_key like 'welcome-1'
          : email.templateId; // Fallback to templateId for mock data

      const response = await fetch('/api/admin/welcome-email-series', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'x-admin-token': adminToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_key: emailKey,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update email status');
      }

      const data = await response.json();
      // Update with the response data to ensure consistency
      if (data.email) {
        setEmails(prev =>
          prev.map(e =>
            e.id === emailId
              ? {
                  ...e,
                  status: data.email.status,
                }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Error updating email status:', error);
      // Revert optimistic update on error
      setEmails(prev =>
        prev.map(e =>
          e.id === emailId
            ? {
                ...e,
                status: email.status, // Revert to original status
              }
            : e
        )
      );
      alert(
        `Failed to update email status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handlePreviewEmail = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    setPreviewEmail(email);
    setPreviewDialogOpen(true);
    setLoadingTemplate(true);

    try {
      // Fetch template from API
      const adminToken =
        process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN ||
        'admin-secure-token-2024-eventpros';

      // Check if templateId is a valid UUID
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          email.templateId
        );

      let template = null;

      if (isValidUUID) {
        // Try to fetch by UUID
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

      // If not found by UUID or not a UUID, try to find by name
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

          // Try to find template by exact name match first (case-insensitive)
          template = allTemplates.find(
            (t: any) => t.name.toLowerCase() === email.name.toLowerCase()
          );

          // If not found, try by slug or trigger_action
          if (!template) {
            template = allTemplates.find((t: any) => {
              const templateNameLower = t.name.toLowerCase();
              const emailNameLower = email.name.toLowerCase();

              // Check slug match (e.g., "welcome-to-eventprosnz")
              if (t.slug && email.id) {
                const slugFromEmailKey = email.id
                  .replace(/-/g, '-')
                  .toLowerCase();
                if (
                  t.slug === slugFromEmailKey ||
                  t.slug.includes(slugFromEmailKey)
                ) {
                  return true;
                }
              }

              // For "Email Verification"
              if (
                emailNameLower.includes('verification') ||
                emailNameLower === 'email verification'
              ) {
                return (
                  templateNameLower.includes('verification') ||
                  templateNameLower.includes('verify') ||
                  t.trigger_action === 'email_verification' ||
                  t.slug?.includes('verification')
                );
              }

              // For "Welcome to EventProsNZ" - check exact name, slug, or trigger_action
              if (
                emailNameLower.includes('welcome') ||
                emailNameLower === 'welcome to eventprosnz'
              ) {
                return (
                  templateNameLower.includes('welcome') ||
                  templateNameLower.includes('eventprosnz') ||
                  templateNameLower.includes('event pros') ||
                  t.trigger_action === 'user_signup' ||
                  t.slug === 'welcome-to-eventprosnz' ||
                  t.slug?.includes('welcome')
                );
              }

              // Partial name match
              return (
                templateNameLower.includes(emailNameLower) ||
                emailNameLower.includes(templateNameLower)
              );
            });
          }
        }
      }

      if (template) {
        setPreviewTemplate(template);
      } else {
        console.error('Template not found for:', email.name);
        // Use mock template data if template not found
        setPreviewTemplate({
          subject: email.subject,
          html_body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">${email.name}</h1>
            <p style="color: #666; line-height: 1.6;">This is a preview of the ${email.name} email template.</p>
            <p style="color: #666; line-height: 1.6;">Subject: ${email.subject}</p>
            <p style="color: #666; line-height: 1.6;">This email is sent ${email.delay === 0 ? 'immediately' : `after ${email.delay} hours`}.</p>
          </div>`,
          text_body: `${email.name}\n\n${email.subject}\n\nThis email is sent ${email.delay === 0 ? 'immediately' : `after ${email.delay} hours`}.`,
        });
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      // Use mock template data on error
      setPreviewTemplate({
        subject: email.subject,
        html_body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">${email.name}</h1>
          <p style="color: #666; line-height: 1.6;">This is a preview of the ${email.name} email template.</p>
          <p style="color: #666; line-height: 1.6;">Subject: ${email.subject}</p>
          <p style="color: #666; line-height: 1.6;">This email is sent ${email.delay === 0 ? 'immediately' : `after ${email.delay} hours`}.</p>
        </div>`,
        text_body: `${email.name}\n\n${email.subject}\n\nThis email is sent ${email.delay === 0 ? 'immediately' : `after ${email.delay} hours`}.`,
      });
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleEditEmail = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    setEditingEmail(email);
    setEditDialogOpen(true);
    setLoadingEditTemplate(true);

    // Set initial form data
    setEditFormData({
      name: email.name,
      subject: email.subject,
      delay: email.delay,
      status: email.status,
      htmlContent: '',
      textContent: '',
    });

    try {
      // Fetch template from API
      const adminToken =
        process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN ||
        'admin-secure-token-2024-eventpros';

      // Check if templateId is a valid UUID
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          email.templateId
        );

      let template = null;

      if (isValidUUID) {
        // Try to fetch by UUID
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

      // If not found by UUID or not a UUID, try to find by name
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

          // Try to find template by exact name match first (case-insensitive)
          template = allTemplates.find(
            (t: any) => t.name.toLowerCase() === email.name.toLowerCase()
          );

          // If not found, try by slug or trigger_action
          if (!template) {
            template = allTemplates.find((t: any) => {
              const templateNameLower = t.name.toLowerCase();
              const emailNameLower = email.name.toLowerCase();

              // Check slug match (e.g., "welcome-to-eventprosnz")
              if (t.slug && email.id) {
                const slugFromEmailKey = email.id
                  .replace(/-/g, '-')
                  .toLowerCase();
                if (
                  t.slug === slugFromEmailKey ||
                  t.slug.includes(slugFromEmailKey)
                ) {
                  return true;
                }
              }

              // For "Email Verification"
              if (
                emailNameLower.includes('verification') ||
                emailNameLower === 'email verification'
              ) {
                return (
                  templateNameLower.includes('verification') ||
                  templateNameLower.includes('verify') ||
                  t.trigger_action === 'email_verification' ||
                  t.slug?.includes('verification')
                );
              }

              // For "Welcome to EventProsNZ" - check exact name, slug, or trigger_action
              if (
                emailNameLower.includes('welcome') ||
                emailNameLower === 'welcome to eventprosnz'
              ) {
                return (
                  templateNameLower.includes('welcome') ||
                  templateNameLower.includes('eventprosnz') ||
                  templateNameLower.includes('event pros') ||
                  t.trigger_action === 'user_signup' ||
                  t.slug === 'welcome-to-eventprosnz' ||
                  t.slug?.includes('welcome')
                );
              }

              // For "Platform Tour"
              if (
                emailNameLower.includes('tour') ||
                emailNameLower.includes('platform tour')
              ) {
                return (
                  templateNameLower.includes('tour') ||
                  templateNameLower.includes('platform') ||
                  t.trigger_action === 'platform_tour' ||
                  t.slug?.includes('tour') ||
                  t.slug?.includes('platform')
                );
              }

              // For "First Steps"
              if (
                emailNameLower.includes('first steps') ||
                emailNameLower.includes('first-steps')
              ) {
                return (
                  templateNameLower.includes('first steps') ||
                  templateNameLower.includes('first-steps') ||
                  templateNameLower.includes('first') ||
                  t.trigger_action === 'first_steps' ||
                  t.slug?.includes('first-steps') ||
                  t.slug?.includes('first')
                );
              }

              // Partial name match
              return (
                templateNameLower.includes(emailNameLower) ||
                emailNameLower.includes(templateNameLower)
              );
            });
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
        console.error('Template not found for:', email.name);
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

      // Generate slug from email name
      const baseSlug = editingEmail.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const slug = `${baseSlug}-${Date.now()}`;

      // Generate text content from HTML if not provided
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

      // Determine trigger_action based on email name
      let triggerAction = 'welcome_email';
      const emailNameLower = editingEmail.name.toLowerCase();
      if (emailNameLower.includes('verification')) {
        triggerAction = 'email_verification';
      } else if (emailNameLower.includes('welcome')) {
        triggerAction = 'user_signup';
      } else if (
        emailNameLower.includes('tour') ||
        emailNameLower.includes('platform')
      ) {
        triggerAction = 'platform_tour';
      } else if (
        emailNameLower.includes('first steps') ||
        emailNameLower.includes('first-steps')
      ) {
        triggerAction = 'first_steps';
      }

      // Try to find existing template
      let existingTemplate = null;
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          editingEmail.templateId
        );

      if (isValidUUID) {
        // Try to fetch by UUID
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

      // If not found by UUID, try to find by name or slug
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

          // Try exact name match
          existingTemplate = allTemplates.find(
            (t: any) => t.name.toLowerCase() === editingEmail.name.toLowerCase()
          );

          // Try slug match
          if (!existingTemplate && editingEmail.id) {
            const slugFromEmailKey = editingEmail.id
              .replace(/-/g, '-')
              .toLowerCase();
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
        // Update existing template
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
              slug: existingTemplate.slug, // Keep existing slug
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
        // Create new template
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
              'dashboardUrl',
              'onboardingUrl',
              'unsubscribeUrl',
              'privacyUrl',
              'helpUrl',
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

      // Update welcome_email_series with the templateId
      const emailKey =
        editingEmail.id.includes('-') &&
        !editingEmail.id.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
          ? editingEmail.id
          : editingEmail.templateId;

      const seriesUpdateResponse = await fetch(
        '/api/admin/welcome-email-series',
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'x-admin-token': adminToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_key: emailKey,
            template_id: templateId,
            name: editFormData.name,
            subject: editFormData.subject,
            delay_hours: editFormData.delay,
            status: editFormData.status,
          }),
        }
      );

      if (!seriesUpdateResponse.ok) {
        console.error('Failed to update welcome email series');
      }

      // Update local state
      setEmails(prev =>
        prev.map(email =>
          email.id === editingEmail.id
            ? {
                ...email,
                templateId: templateId,
                name: editFormData.name,
                subject: editFormData.subject,
                delay: editFormData.delay,
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

  const handleTestEmail = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    setTestEmail(email);
    setTestEmailAddress('');
    setTestEmailStatus({ status: 'idle', message: '' });
    setTestEmailDialogOpen(true);

    // Fetch template for test email
    try {
      const adminToken =
        process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN ||
        'admin-secure-token-2024-eventpros';

      // Check if templateId is a valid UUID
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          email.templateId
        );

      let template = null;

      if (isValidUUID) {
        // Try to fetch by UUID
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

      // If not found by UUID or not a UUID, try to find by name
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

          // Try to find template by exact name match first (case-insensitive)
          template = allTemplates.find(
            (t: any) => t.name.toLowerCase() === email.name.toLowerCase()
          );

          // If not found, try by slug or trigger_action (similar logic to handleEditEmail)
          if (!template) {
            template = allTemplates.find((t: any) => {
              const templateNameLower = t.name.toLowerCase();
              const emailNameLower = email.name.toLowerCase();

              // Check slug match
              if (t.slug && email.id) {
                const slugFromEmailKey = email.id
                  .replace(/-/g, '-')
                  .toLowerCase();
                if (
                  t.slug === slugFromEmailKey ||
                  t.slug.includes(slugFromEmailKey)
                ) {
                  return true;
                }
              }

              // For "Email Verification"
              if (
                emailNameLower.includes('verification') ||
                emailNameLower === 'email verification'
              ) {
                return (
                  templateNameLower.includes('verification') ||
                  templateNameLower.includes('verify') ||
                  t.trigger_action === 'email_verification' ||
                  t.slug?.includes('verification')
                );
              }

              // For "Welcome to EventProsNZ"
              if (
                emailNameLower.includes('welcome') ||
                emailNameLower === 'welcome to eventprosnz'
              ) {
                return (
                  templateNameLower.includes('welcome') ||
                  templateNameLower.includes('eventprosnz') ||
                  templateNameLower.includes('event pros') ||
                  t.trigger_action === 'user_signup' ||
                  t.slug === 'welcome-to-eventprosnz' ||
                  t.slug?.includes('welcome')
                );
              }

              // Partial name match
              return (
                templateNameLower.includes(emailNameLower) ||
                emailNameLower.includes(templateNameLower)
              );
            });
          }
        }
      }

      setTestEmailTemplate(template);
    } catch (error) {
      console.error('Error fetching template for test email:', error);
      setTestEmailTemplate(null);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmailAddress || !testEmailAddress.includes('@')) {
      setTestEmailStatus({
        status: 'error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    setTestEmailLoading(true);
    setTestEmailStatus({ status: 'idle', message: 'Sending test email...' });

    try {
      const adminToken =
        process.env.NEXT_PUBLIC_ADMIN_ACCESS_TOKEN ||
        'admin-secure-token-2024-eventpros';

      // Prepare email content
      let subject = testEmail.subject;
      let htmlContent = '';
      let textContent = '';

      if (testEmailTemplate) {
        subject = testEmailTemplate.subject || testEmail.subject;
        htmlContent = testEmailTemplate.html_body || '';
        textContent = testEmailTemplate.text_body || '';
      } else {
        // Use default content if template not found
        htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">${testEmail.name}</h1>
          <p style="color: #666; line-height: 1.6;">This is a test email for ${testEmail.name}.</p>
          <p style="color: #666; line-height: 1.6;">Subject: ${testEmail.subject}</p>
        </div>`;
        textContent = `${testEmail.name}\n\n${testEmail.subject}\n\nThis is a test email.`;
      }

      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          subject,
          htmlContent,
          textContent,
          recipientEmail: testEmailAddress,
          emailType: 'welcome_email',
          variables: {
            firstName: 'Test',
            email: testEmailAddress,
            dashboardUrl: 'https://eventpros.co.nz/dashboard',
            unsubscribeUrl: 'https://eventpros.co.nz/unsubscribe',
            privacyUrl: 'https://eventpros.co.nz/privacy',
            helpUrl: 'https://eventpros.co.nz/help',
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email');
      }

      setTestEmailStatus({
        status: 'success',
        message: `Test email sent successfully to ${testEmailAddress}`,
      });

      // Close dialog after 2 seconds
      setTimeout(() => {
        setTestEmailDialogOpen(false);
        setTestEmailStatus({ status: 'idle', message: '' });
        setTestEmailAddress('');
      }, 2000);
    } catch (error) {
      setTestEmailStatus({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send test email. Please try again.',
      });
    } finally {
      setTestEmailLoading(false);
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
          <h2 className="text-2xl font-bold">Welcome Email Series</h2>
          <p className="text-muted-foreground">
            Automated onboarding emails for new users
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
                +12% from last month
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
                +2.1% from last month
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
                +1.8% from last month
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
                        <span className="text-xs text-muted-foreground">
                          {email.delay === 0
                            ? 'Immediate'
                            : `After ${email.delay}h`}
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
                      onClick={() => handleTestEmail(email.id)}
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

      {/* Preview Email Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewEmail?.name}</DialogTitle>
            <DialogDescription>{previewEmail?.subject}</DialogDescription>
          </DialogHeader>
          {loadingTemplate ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : previewTemplate ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  HTML Email Preview:
                </Label>
                <div className="border border-gray-300 rounded-md bg-white shadow-sm">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="ml-auto text-xs text-gray-500">
                      HTML Email
                    </div>
                  </div>
                  <div
                    className="p-4 min-h-[200px] bg-white"
                    style={{
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      maxWidth: '600px',
                      margin: '0 auto',
                    }}
                    dangerouslySetInnerHTML={{
                      __html:
                        previewTemplate.html_body ||
                        previewTemplate.html_content ||
                        '<p>No content available</p>',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No template content available
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <EmailEditModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        email={editingEmail}
        formData={editFormData}
        onFormDataChange={data => setEditFormData(data as typeof editFormData)}
        loading={loadingEditTemplate}
        onSave={handleSaveEmail}
        showDelayField={true}
        nameLabel="Name"
        previewLabel="HTML Email Preview (as recipient will see it):"
      />

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email for &quot;{testEmail?.name}&quot; to verify the
              template looks correct.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Recipient Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={e => setTestEmailAddress(e.target.value)}
                disabled={testEmailLoading}
              />
            </div>
            {testEmailStatus.status !== 'idle' && (
              <div
                className={`p-3 rounded-md text-sm ${
                  testEmailStatus.status === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {testEmailStatus.message}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestEmailDialogOpen(false);
                setTestEmailStatus({ status: 'idle', message: '' });
                setTestEmailAddress('');
              }}
              disabled={testEmailLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={testEmailLoading || !testEmailAddress}
            >
              {testEmailLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
