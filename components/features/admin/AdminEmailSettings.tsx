'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import EmailTemplatesManager from './EmailTemplatesManager';

const emailSettingsSchema = z.object({
  email_provider: z.enum(['resend', 'brevo', 'smtp', 'sendgrid']),
  from_email: z.string().email('Invalid email address'),
  resend_api_key: z.string().optional(),
  brevo_api_key: z.string().optional(),
  smtp_host: z.string().optional(),
  smtp_port: z.number().min(1).max(65535).optional(),
  smtp_secure: z.boolean().optional(),
  smtp_user: z.string().optional(),
  smtp_password: z.string().optional(),
  sendgrid_api_key: z.string().optional(),
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

interface AdminEmailSettingsProps {
  onSuccess?: (settings: any) => void;
  onError?: (error: string) => void;
}

export default function AdminEmailSettings({
  onSuccess,
  onError,
}: AdminEmailSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testEmailStatus, setTestEmailStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      email_provider: 'resend',
      smtp_secure: false,
      smtp_port: 587,
    },
  });

  const selectedProvider = watch('email_provider');

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/email', {
        headers: {
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
      });

      if (response.ok) {
        const result = await response.json();
        reset(result.settings || {});
      }
    } catch (err) {
      console.error('Failed to load email settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onSubmit = async (data: EmailSettingsFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/settings/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update email settings');
      }

      setSuccess('Email settings updated successfully!');
      onSuccess?.(result.settings);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update email settings';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      setTestEmailStatus({
        status: 'error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    setTestEmailStatus({ status: 'sending', message: 'Sending test email...' });

    try {
      const response = await fetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        body: JSON.stringify({ to: testEmailAddress }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email');
      }

      setTestEmailStatus({
        status: 'success',
        message: 'Test email sent successfully!',
      });
    } catch (err) {
      setTestEmailStatus({
        status: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to send test email. Please check your email configuration.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Email Configuration
        </h3>
        <p className="text-sm text-gray-500">
          Configure your email service provider and settings for sending
          transactional emails.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Provider *
          </label>
          <select
            {...register('email_provider')}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          >
            <option value="resend">
              Resend (Recommended - 3,000 emails/month free)
            </option>
            <option value="brevo">
              Brevo/Sendinblue (300 emails/day free)
            </option>
            <option value="smtp">SMTP (Gmail, Outlook, or custom SMTP)</option>
            <option value="sendgrid">SendGrid (Paid service)</option>
          </select>
          {errors.email_provider && (
            <p className="mt-1 text-sm text-red-600">
              {errors.email_provider.message}
            </p>
          )}
        </div>

        {/* From Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Email Address *
          </label>
          <input
            {...register('from_email')}
            type="email"
            placeholder="noreply@yourdomain.com"
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          />
          {errors.from_email && (
            <p className="mt-1 text-sm text-red-600">
              {errors.from_email.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            This email address will appear as the sender for all system emails.
          </p>
        </div>

        {/* Resend Settings */}
        {selectedProvider === 'resend' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resend API Key
            </label>
            <input
              {...register('resend_api_key')}
              type="password"
              placeholder="re_..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get your API key from{' '}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700"
              >
                resend.com/api-keys
              </a>
            </p>
          </div>
        )}

        {/* Brevo Settings */}
        {selectedProvider === 'brevo' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brevo API Key
            </label>
            <input
              {...register('brevo_api_key')}
              type="password"
              placeholder="xkeysib-..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get your API key from{' '}
              <a
                href="https://app.brevo.com/settings/keys/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700"
              >
                Brevo Settings
              </a>
            </p>
          </div>
        )}

        {/* SMTP Settings */}
        {selectedProvider === 'smtp' && (
          <div className="space-y-4 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900">
              SMTP Configuration
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                {...register('smtp_host')}
                type="text"
                placeholder="smtp.gmail.com"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  {...register('smtp_port', { valueAsNumber: true })}
                  type="number"
                  placeholder="587"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>

              <div className="flex items-center pt-6">
                <input
                  {...register('smtp_secure')}
                  type="checkbox"
                  id="smtp_secure"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="smtp_secure"
                  className="ml-2 text-sm text-gray-700"
                >
                  Use SSL/TLS
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username
              </label>
              <input
                {...register('smtp_user')}
                type="text"
                placeholder="your-email@gmail.com"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <input
                {...register('smtp_password')}
                type="password"
                placeholder="Your app password"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                For Gmail, use an App Password instead of your regular password.
              </p>
            </div>
          </div>
        )}

        {/* SendGrid Settings */}
        {selectedProvider === 'sendgrid' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SendGrid API Key
            </label>
            <input
              {...register('sendgrid_api_key')}
              type="password"
              placeholder="SG..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Get your API key from{' '}
              <a
                href="https://app.sendgrid.com/settings/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700"
              >
                SendGrid Settings
              </a>
            </p>
          </div>
        )}

        {/* Test Email Section */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            Test Email Configuration
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmailAddress}
              onChange={e => setTestEmailAddress(e.target.value)}
              placeholder="Enter email address to test"
              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testEmailStatus.status === 'sending'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 mr-2" />
              {testEmailStatus.status === 'sending'
                ? 'Sending...'
                : 'Send Test Email'}
            </button>
          </div>
          {testEmailStatus.status !== 'idle' && (
            <div
              className={`mt-2 flex items-center gap-2 text-sm ${
                testEmailStatus.status === 'success'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {testEmailStatus.status === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{testEmailStatus.message}</span>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Email Settings'}
          </button>
        </div>
      </form>

      {/* Email Templates Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <EmailTemplatesManager />
      </div>
    </div>
  );
}
