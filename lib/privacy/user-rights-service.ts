import { supabase } from '@/lib/supabase/client';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';

export interface UserRightsRequest {
  id: string;
  userId: string;
  requestType:
    | 'access'
    | 'rectification'
    | 'erasure'
    | 'portability'
    | 'restriction'
    | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestData?: any;
  responseData?: any;
  requestedAt: Date;
  processedAt?: Date;
  expiresAt: Date;
  notes?: string;
  createdBy: string;
  updatedAt: Date;
}

export interface DataSubjectRights {
  id: string;
  userId: string;
  rightType:
    | 'access'
    | 'rectification'
    | 'erasure'
    | 'portability'
    | 'restriction'
    | 'objection';
  status: 'active' | 'suspended' | 'revoked';
  grantedAt: Date;
  expiresAt?: Date;
  conditions?: string;
  createdBy: string;
  updatedAt: Date;
}

export interface RightsAnalytics {
  totalRequests: number;
  requestsByType: Record<string, number>;
  requestsByStatus: Record<string, number>;
  averageProcessingTime: number;
  completionRate: number;
  topRequestTypes: Array<{ type: string; count: number }>;
  recentRequests: UserRightsRequest[];
}

export class UserRightsService {
  private encryptionService: DataEncryptionService;

  constructor() {
    this.encryptionService = new DataEncryptionService();
  }

  /**
   * Create a new user rights request
   */
  async createRightsRequest(
    requestData: Omit<UserRightsRequest, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserRightsRequest> {
    try {
      const { data, error } = await supabase
        .from('user_rights_requests')
        .insert([
          {
            ...requestData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return this.mapToUserRightsRequest(data);
    } catch (error) {
      console.error('Error creating user rights request:', error);
      throw new Error('Failed to create user rights request');
    }
  }

  /**
   * Get user rights request by ID
   */
  async getRightsRequest(requestId: string): Promise<UserRightsRequest | null> {
    try {
      const { data, error } = await supabase
        .from('user_rights_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapToUserRightsRequest(data);
    } catch (error) {
      console.error('Error getting user rights request:', error);
      throw new Error('Failed to get user rights request');
    }
  }

  /**
   * Get all user rights requests for a user
   */
  async getUserRightsRequests(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<UserRightsRequest[]> {
    try {
      const { data, error } = await supabase
        .from('user_rights_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(item => this.mapToUserRightsRequest(item));
    } catch (error) {
      console.error('Error getting user rights requests:', error);
      throw new Error('Failed to get user rights requests');
    }
  }

  /**
   * Update user rights request status
   */
  async updateRightsRequestStatus(
    requestId: string,
    status: UserRightsRequest['status'],
    responseData?: any,
    notes?: string
  ): Promise<UserRightsRequest> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (responseData) {
        updateData.response_data = responseData;
      }

      if (notes) {
        updateData.notes = notes;
      }

      if (status === 'completed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('user_rights_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToUserRightsRequest(data);
    } catch (error) {
      console.error('Error updating user rights request status:', error);
      throw new Error('Failed to update user rights request status');
    }
  }

  /**
   * Grant data subject rights to a user
   */
  async grantDataSubjectRights(
    rightsData: Omit<DataSubjectRights, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataSubjectRights> {
    try {
      const { data, error } = await supabase
        .from('data_subject_rights')
        .insert([
          {
            ...rightsData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return this.mapToDataSubjectRights(data);
    } catch (error) {
      console.error('Error granting data subject rights:', error);
      throw new Error('Failed to grant data subject rights');
    }
  }

  /**
   * Get data subject rights for a user
   */
  async getDataSubjectRights(userId: string): Promise<DataSubjectRights[]> {
    try {
      const { data, error } = await supabase
        .from('data_subject_rights')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      return data.map(item => this.mapToDataSubjectRights(item));
    } catch (error) {
      console.error('Error getting data subject rights:', error);
      throw new Error('Failed to get data subject rights');
    }
  }

  /**
   * Revoke data subject rights
   */
  async revokeDataSubjectRights(
    rightsId: string,
    reason?: string
  ): Promise<DataSubjectRights> {
    try {
      const { data, error } = await supabase
        .from('data_subject_rights')
        .update({
          status: 'revoked',
          conditions: reason || 'Rights revoked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', rightsId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToDataSubjectRights(data);
    } catch (error) {
      console.error('Error revoking data subject rights:', error);
      throw new Error('Failed to revoke data subject rights');
    }
  }

  /**
   * Process data access request
   */
  async processDataAccessRequest(
    requestId: string,
    userId: string
  ): Promise<any> {
    try {
      // Collect all user data from various tables
      const userData = await this.collectUserData(userId);

      // Update request status
      await this.updateRightsRequestStatus(requestId, 'completed', userData);

      return userData;
    } catch (error) {
      console.error('Error processing data access request:', error);
      await this.updateRightsRequestStatus(
        requestId,
        'rejected',
        null,
        'Failed to process request'
      );
      throw new Error('Failed to process data access request');
    }
  }

  /**
   * Process data rectification request
   */
  async processDataRectificationRequest(
    requestId: string,
    userId: string,
    rectificationData: any
  ): Promise<boolean> {
    try {
      // Update user data based on rectification request
      const { error } = await supabase
        .from('users')
        .update(rectificationData)
        .eq('id', userId);

      if (error) throw error;

      // Update request status
      await this.updateRightsRequestStatus(requestId, 'completed', {
        updated: true,
      });

      return true;
    } catch (error) {
      console.error('Error processing data rectification request:', error);
      await this.updateRightsRequestStatus(
        requestId,
        'rejected',
        null,
        'Failed to process rectification'
      );
      throw new Error('Failed to process data rectification request');
    }
  }

  /**
   * Process data erasure request
   */
  async processDataErasureRequest(
    requestId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Anonymize user data instead of complete deletion for audit purposes
      const anonymizedData = {
        email: `deleted_${Date.now()}@example.com`,
        first_name: 'Deleted',
        last_name: 'User',
        phone: null,
        address: null,
        deleted_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update(anonymizedData)
        .eq('id', userId);

      if (error) throw error;

      // Update request status
      await this.updateRightsRequestStatus(requestId, 'completed', {
        anonymized: true,
      });

      return true;
    } catch (error) {
      console.error('Error processing data erasure request:', error);
      await this.updateRightsRequestStatus(
        requestId,
        'rejected',
        null,
        'Failed to process erasure'
      );
      throw new Error('Failed to process data erasure request');
    }
  }

  /**
   * Process data portability request
   */
  async processDataPortabilityRequest(
    requestId: string,
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    try {
      // Collect user data
      const userData = await this.collectUserData(userId);

      // Generate export file
      const exportData = this.formatUserData(userData, format);

      // Update request status
      await this.updateRightsRequestStatus(requestId, 'completed', {
        exportFormat: format,
        dataSize: exportData.length,
      });

      return exportData;
    } catch (error) {
      console.error('Error processing data portability request:', error);
      await this.updateRightsRequestStatus(
        requestId,
        'rejected',
        null,
        'Failed to process portability'
      );
      throw new Error('Failed to process data portability request');
    }
  }

  /**
   * Get user rights analytics
   */
  async getRightsAnalytics(
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<RightsAnalytics> {
    try {
      const startDate = this.getStartDate(timeframe);

      const { data: requests, error } = await supabase
        .from('user_rights_requests')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const analytics: RightsAnalytics = {
        totalRequests: requests.length,
        requestsByType: {},
        requestsByStatus: {},
        averageProcessingTime: 0,
        completionRate: 0,
        topRequestTypes: [],
        recentRequests: requests
          .slice(0, 10)
          .map(item => this.mapToUserRightsRequest(item)),
      };

      // Calculate analytics
      requests.forEach(request => {
        analytics.requestsByType[request.request_type] =
          (analytics.requestsByType[request.request_type] || 0) + 1;
        analytics.requestsByStatus[request.status] =
          (analytics.requestsByStatus[request.status] || 0) + 1;
      });

      // Calculate completion rate
      const completedRequests = requests.filter(
        r => r.status === 'completed'
      ).length;
      analytics.completionRate =
        requests.length > 0 ? (completedRequests / requests.length) * 100 : 0;

      // Calculate average processing time
      const processedRequests = requests.filter(r => r.processed_at);
      if (processedRequests.length > 0) {
        const totalTime = processedRequests.reduce((sum, r) => {
          const created = new Date(r.created_at);
          const processed = new Date(r.processed_at);
          return sum + (processed.getTime() - created.getTime());
        }, 0);
        analytics.averageProcessingTime =
          totalTime / processedRequests.length / (1000 * 60 * 60); // hours
      }

      // Get top request types
      analytics.topRequestTypes = Object.entries(analytics.requestsByType)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return analytics;
    } catch (error) {
      console.error('Error getting user rights analytics:', error);
      throw new Error('Failed to get user rights analytics');
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string): Promise<any> {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get user events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId);

      if (eventsError) throw eventsError;

      // Get user inquiries
      const { data: inquiries, error: inquiriesError } = await supabase
        .from('inquiries')
        .select('*')
        .eq('user_id', userId);

      if (inquiriesError) throw inquiriesError;

      // Get user payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId);

      if (paymentsError) throw paymentsError;

      return {
        user,
        events,
        inquiries,
        payments,
        collectedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error collecting user data:', error);
      throw new Error('Failed to collect user data');
    }
  }

  /**
   * Format user data for export
   */
  private formatUserData(
    userData: any,
    format: 'json' | 'csv' | 'xml'
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify(userData, null, 2);
      case 'csv':
        return this.convertToCSV(userData);
      case 'xml':
        return this.convertToXML(userData);
      default:
        return JSON.stringify(userData, null, 2);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    const rows: string[] = [];

    // Add user data
    if (data.user) {
      rows.push('User Data');
      rows.push(Object.keys(data.user).join(','));
      rows.push(Object.values(data.user).join(','));
      rows.push('');
    }

    // Add events data
    if (data.events && data.events.length > 0) {
      rows.push('Events Data');
      rows.push(Object.keys(data.events[0]).join(','));
      data.events.forEach((event: any) => {
        rows.push(Object.values(event).join(','));
      });
      rows.push('');
    }

    return rows.join('\n');
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(data: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<userData>\n';

    if (data.user) {
      xml += '  <user>\n';
      Object.entries(data.user).forEach(([key, value]) => {
        xml += `    <${key}>${value}</${key}>\n`;
      });
      xml += '  </user>\n';
    }

    if (data.events && data.events.length > 0) {
      xml += '  <events>\n';
      data.events.forEach((event: any) => {
        xml += '    <event>\n';
        Object.entries(event).forEach(([key, value]) => {
          xml += `      <${key}>${value}</${key}>\n`;
        });
        xml += '    </event>\n';
      });
      xml += '  </events>\n';
    }

    xml += '</userData>';
    return xml;
  }

  /**
   * Get start date for analytics timeframe
   */
  private getStartDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Map database record to UserRightsRequest
   */
  private mapToUserRightsRequest(record: any): UserRightsRequest {
    return {
      id: record.id,
      userId: record.user_id,
      requestType: record.request_type,
      status: record.status,
      requestData: record.request_data,
      responseData: record.response_data,
      requestedAt: new Date(record.created_at),
      processedAt: record.processed_at
        ? new Date(record.processed_at)
        : undefined,
      expiresAt: new Date(record.expires_at),
      notes: record.notes,
      createdBy: record.created_by,
      updatedAt: new Date(record.updated_at),
    };
  }

  /**
   * Map database record to DataSubjectRights
   */
  private mapToDataSubjectRights(record: any): DataSubjectRights {
    return {
      id: record.id,
      userId: record.user_id,
      rightType: record.right_type,
      status: record.status,
      grantedAt: new Date(record.granted_at),
      expiresAt: record.expires_at ? new Date(record.expires_at) : undefined,
      conditions: record.conditions,
      createdBy: record.created_by,
      updatedAt: new Date(record.updated_at),
    };
  }
}
