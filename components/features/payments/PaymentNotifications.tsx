/**
 * Payment Notifications Component
 * Manages payment-related notifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Calendar,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

interface PaymentNotification {
  id: string;
  payment_id: string;
  notification_type: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

interface PaymentNotificationsProps {
  userId?: string;
  paymentId?: string;
  onSendNotification?: (notification: PaymentNotification) => void;
}

export function PaymentNotifications({
  userId,
  paymentId,
  onSendNotification,
}: PaymentNotificationsProps) {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { getNotificationHistory, sendPaymentNotification } = usePayment();

  useEffect(() => {
    loadNotifications();
  }, [userId, paymentId]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const history = await getNotificationHistory(userId, paymentId);
      setNotifications(history);
    } catch (error: any) {
      setError(error.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async (notificationType: string) => {
    if (!paymentId) return;

    try {
      setSendingId(notificationType);
      const notification = await sendPaymentNotification(
        paymentId,
        notificationType
      );
      setNotifications(prev => [notification, ...prev]);
      onSendNotification?.(notification);
    } catch (error: any) {
      setError(error.message || 'Failed to send notification');
    } finally {
      setSendingId(null);
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'payment_success':
        return 'Payment Success';
      case 'payment_failed':
        return 'Payment Failed';
      case 'payment_receipt':
        return 'Payment Receipt';
      case 'payment_reminder':
        return 'Payment Reminder';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Notifications</h2>
        <Button onClick={loadNotifications} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Quick Actions */}
      {paymentId && (
        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleSendNotification('payment_success')}
                disabled={sendingId === 'payment_success'}
                className="flex items-center gap-2"
              >
                {sendingId === 'payment_success' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Success Notification
              </Button>

              <Button
                onClick={() => handleSendNotification('payment_failed')}
                disabled={sendingId === 'payment_failed'}
                className="flex items-center gap-2"
              >
                {sendingId === 'payment_failed' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                Failure Notification
              </Button>

              <Button
                onClick={() => handleSendNotification('payment_receipt')}
                disabled={sendingId === 'payment_receipt'}
                className="flex items-center gap-2"
              >
                {sendingId === 'payment_receipt' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Receipt Notification
              </Button>

              <Button
                onClick={() => handleSendNotification('payment_reminder')}
                disabled={sendingId === 'payment_reminder'}
                className="flex items-center gap-2"
              >
                {sendingId === 'payment_reminder' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                Reminder Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Notifications
            </h3>
            <p className="text-gray-600">
              {paymentId
                ? 'No notifications have been sent for this payment.'
                : 'No payment notifications found.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notifications.map(notification => (
            <Card key={notification.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {getNotificationTypeLabel(
                            notification.notification_type
                          )}
                        </span>
                        {getStatusBadge(notification.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Payment ID: {notification.payment_id}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Created: {formatDate(notification.created_at)}
                          </span>
                        </div>
                        {notification.sent_at && (
                          <div className="flex items-center gap-1">
                            <Send className="h-4 w-4" />
                            <span>
                              Sent: {formatDate(notification.sent_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {notification.status === 'sent'
                        ? 'Delivered'
                        : notification.status === 'pending'
                          ? 'Scheduled'
                          : notification.status === 'failed'
                            ? 'Failed'
                            : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {notifications.length}
                </p>
                <p className="text-sm text-gray-600">Total Notifications</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.status === 'sent').length}
                </p>
                <p className="text-sm text-gray-600">Sent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {notifications.filter(n => n.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.status === 'failed').length}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
