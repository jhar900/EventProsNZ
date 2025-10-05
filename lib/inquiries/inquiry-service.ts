import {
  Inquiry,
  InquiryData,
  InquiryFilters,
  InquiryStatus as InquiryStatusType,
  NotificationType,
} from '@/types/inquiries';

export class InquiryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/inquiries';
  }

  // Create a new inquiry
  async createInquiry(inquiryData: InquiryData): Promise<Inquiry> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create inquiry');
    }

    const result = await response.json();
    return result.inquiry;
  }

  // Get inquiries with filtering
  async getInquiries(filters?: InquiryFilters): Promise<{
    inquiries: Inquiry[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch inquiries');
    }

    return await response.json();
  }

  // Get a specific inquiry
  async getInquiry(inquiryId: string): Promise<{
    inquiry: Inquiry;
    responses: any[];
  }> {
    const response = await fetch(`${this.baseUrl}/${inquiryId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch inquiry');
    }

    return await response.json();
  }

  // Update an inquiry
  async updateInquiry(
    inquiryId: string,
    updateData: Partial<Inquiry>
  ): Promise<Inquiry> {
    const response = await fetch(`${this.baseUrl}/${inquiryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update inquiry');
    }

    const result = await response.json();
    return result.inquiry;
  }

  // Delete an inquiry
  async deleteInquiry(inquiryId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${inquiryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete inquiry');
    }
  }

  // Send an inquiry
  async sendInquiry(inquiryData: InquiryData): Promise<Inquiry> {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send inquiry');
    }

    const result = await response.json();
    return result.inquiry;
  }

  // Bulk send inquiries
  async bulkSendInquiries(
    contractorIds: string[],
    inquiryData: InquiryData
  ): Promise<Inquiry[]> {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractor_ids: contractorIds,
        inquiry_data: inquiryData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send bulk inquiries');
    }

    const result = await response.json();
    return result.inquiries;
  }

  // Update inquiry status
  async updateInquiryStatus(
    inquiryId: string,
    status: InquiryStatusType,
    reason?: string
  ): Promise<Inquiry> {
    const response = await fetch(`${this.baseUrl}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        status,
        reason,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update inquiry status');
    }

    const result = await response.json();
    return result.inquiry;
  }

  // Get inquiry status overview
  async getInquiryStatus(
    userId?: string,
    status?: InquiryStatusType
  ): Promise<{
    inquiries: Inquiry[];
    status_counts: {
      sent: number;
      viewed: number;
      responded: number;
      quoted: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);
    if (status) queryParams.append('status', status);

    const response = await fetch(
      `${this.baseUrl}/status?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch inquiry status');
    }

    return await response.json();
  }

  // Send notification
  async sendNotification(
    inquiryId: string,
    notificationType: NotificationType
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/notifications/send`, {
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

  // Get notifications
  async getNotifications(
    userId?: string,
    inquiryId?: string,
    isRead?: boolean
  ): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);
    if (inquiryId) queryParams.append('inquiry_id', inquiryId);
    if (isRead !== undefined) queryParams.append('is_read', isRead.toString());

    const response = await fetch(
      `${this.baseUrl}/notifications?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch notifications');
    }

    const result = await response.json();
    return result.notifications;
  }

  // Get inquiry history
  async getInquiryHistory(
    userId: string,
    dateFrom?: string,
    dateTo?: string,
    status?: InquiryStatusType
  ): Promise<{
    inquiries: Inquiry[];
    analytics: any;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('user_id', userId);
    if (dateFrom) queryParams.append('date_from', dateFrom);
    if (dateTo) queryParams.append('date_to', dateTo);
    if (status) queryParams.append('status', status);

    const response = await fetch(
      `${this.baseUrl}/history?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch inquiry history');
    }

    return await response.json();
  }

  // Export inquiries
  async exportInquiries(
    userId: string,
    format: string = 'csv',
    dateFrom?: string,
    dateTo?: string
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('user_id', userId);
    queryParams.append('format', format);
    if (dateFrom) queryParams.append('date_from', dateFrom);
    if (dateTo) queryParams.append('date_to', dateTo);

    const response = await fetch(
      `${this.baseUrl}/history/export?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to export inquiries');
    }

    return await response.blob();
  }

  // Validate inquiry data
  async validateInquiry(inquiryData: InquiryData): Promise<{
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
    suggestions: Array<{ field: string; message: string }>;
  }> {
    const response = await fetch(`${this.baseUrl}/validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to validate inquiry');
    }

    return await response.json();
  }
}

// Export singleton instance
export const inquiryService = new InquiryService();
