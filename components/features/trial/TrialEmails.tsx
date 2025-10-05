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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface TrialEmailsProps {
  userId: string;
}

interface TrialEmail {
  id: string;
  email_type: string;
  scheduled_date: string;
  sent_date?: string;
  email_status: string;
  email_content?: any;
  created_at: string;
}

export default function TrialEmails({ userId }: TrialEmailsProps) {
  const [emails, setEmails] = useState<TrialEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, [userId]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trial/emails?user_id=${userId}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setEmails(data.emails || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch trial emails'
      );
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (emailType: string) => {
    try {
      setSending(emailType);
      const response = await fetch('/api/trial/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          email_type: emailType,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh emails list
      await fetchEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'opened':
        return 'bg-purple-100 text-purple-800';
      case 'clicked':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'opened':
        return <CheckCircle className="h-4 w-4" />;
      case 'clicked':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEmailTypeLabel = (type: string) => {
    switch (type) {
      case 'day_2_optimization':
        return 'Day 2: Profile Optimization';
      case 'day_7_checkin':
        return 'Day 7: Check-in';
      case 'day_12_ending':
        return 'Day 12: Trial Ending';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Management Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Trial Email Management
          </CardTitle>
          <CardDescription>
            Manage and send trial conversion emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => sendEmail('day_2_optimization')}
              disabled={sending === 'day_2_optimization'}
              variant="outline"
              size="sm"
            >
              {sending === 'day_2_optimization' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Day 2 Email
            </Button>

            <Button
              onClick={() => sendEmail('day_7_checkin')}
              disabled={sending === 'day_7_checkin'}
              variant="outline"
              size="sm"
            >
              {sending === 'day_7_checkin' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Day 7 Email
            </Button>

            <Button
              onClick={() => sendEmail('day_12_ending')}
              disabled={sending === 'day_12_ending'}
              variant="outline"
              size="sm"
            >
              {sending === 'day_12_ending' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Day 12 Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email List */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Emails</CardTitle>
          <CardDescription>All trial emails for this user</CardDescription>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No trial emails found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map(email => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div className="font-medium">
                        {getEmailTypeLabel(email.email_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(email.email_status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(email.email_status)}
                          {email.email_status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(email.scheduled_date)}</TableCell>
                    <TableCell>
                      {email.sent_date ? formatDate(email.sent_date) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {email.email_status === 'pending' && (
                          <Button
                            onClick={() => sendEmail(email.email_type)}
                            disabled={sending === email.email_type}
                            size="sm"
                            variant="outline"
                          >
                            {sending === email.email_type ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Send
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Email Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Email Statistics</CardTitle>
          <CardDescription>Overview of email performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {emails.filter(e => e.email_status === 'sent').length}
              </div>
              <div className="text-sm text-gray-500">Sent</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {emails.filter(e => e.email_status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-500">Delivered</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {emails.filter(e => e.email_status === 'opened').length}
              </div>
              <div className="text-sm text-gray-500">Opened</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {emails.filter(e => e.email_status === 'clicked').length}
              </div>
              <div className="text-sm text-gray-500">Clicked</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
