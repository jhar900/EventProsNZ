import { NotificationType } from '@/types/inquiries';

export interface NotificationData {
  inquiryId: string;
  userId: string;
  notificationType: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export class NotificationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/inquiries/notifications';
  }

  // Send a notification
  async sendNotification(
    inquiryId: string,
    notificationType: NotificationType
  ): Promise<NotificationData> {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        notification_type: notificationType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send notification');
    }

    const result = await response.json();
    return result.notification;
  }

  // Get notifications for a user
  async getNotifications(
    userId?: string,
    inquiryId?: string,
    isRead?: boolean
  ): Promise<NotificationData[]> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);
    if (inquiryId) queryParams.append('inquiry_id', inquiryId);
    if (isRead !== undefined) queryParams.append('is_read', isRead.toString());

    const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch notifications');
    }

    const result = await response.json();
    return result.notifications;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${notificationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_read: true }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to mark notification as read'
      );
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/mark-all-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to mark all notifications as read'
      );
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${notificationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete notification');
    }
  }

  // Get notification counts
  async getNotificationCounts(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
  }> {
    const response = await fetch(`${this.baseUrl}/counts?user_id=${userId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch notification counts'
      );
    }

    return await response.json();
  }

  // Send email notification (if email service is configured)
  async sendEmailNotification(
    inquiryId: string,
    notificationType: NotificationType,
    recipientEmail: string,
    templateData?: any
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        notification_type: notificationType,
        recipient_email: recipientEmail,
        template_data: templateData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send email notification');
    }
  }

  // Get notification preferences for a user
  async getNotificationPreferences(userId: string): Promise<{
    email_enabled: boolean;
    push_enabled: boolean;
    sms_enabled: boolean;
    preferences: Record<NotificationType, boolean>;
  }> {
    const response = await fetch(
      `${this.baseUrl}/preferences?user_id=${userId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to fetch notification preferences'
      );
    }

    return await response.json();
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: {
      email_enabled?: boolean;
      push_enabled?: boolean;
      sms_enabled?: boolean;
      preferences?: Record<NotificationType, boolean>;
    }
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        ...preferences,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 'Failed to update notification preferences'
      );
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
