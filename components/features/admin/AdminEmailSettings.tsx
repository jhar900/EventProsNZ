'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';
import EmailTemplatesManager from './EmailTemplatesManager';

export default function AdminEmailSettings() {
  const [testEmailStatus, setTestEmailStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [testEmailAddress, setTestEmailAddress] = useState('');

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
      const response = await adminFetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          Email is configured via environment variables (RESEND_API_KEY and
          RESEND_FROM_EMAIL). Use the form below to send a test email and verify
          the configuration is working.
        </p>
      </div>

      {/* Test Email Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">
          Send Test Email
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

      {/* Email Templates Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <EmailTemplatesManager />
      </div>
    </div>
  );
}
