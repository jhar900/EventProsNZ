import { createClient } from '@/lib/supabase/server';
import { DataEncryptionService } from '@/lib/security/data-encryption-service';

export interface DataExport {
  id: string;
  user_id: string;
  export_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_path?: string;
  file_size?: number;
  created_at: Date;
  completed_at?: Date;
  expires_at: Date;
}

export interface ExportRequest {
  user_id: string;
  export_type: string;
  data_categories: string[];
  format: 'json' | 'csv' | 'xml';
  include_metadata?: boolean;
}

export interface ExportData {
  user_profile: any;
  contacts: any[];
  messages: any[];
  events: any[];
  payments: any[];
  analytics: any[];
  metadata: {
    export_date: Date;
    data_categories: string[];
    total_records: number;
  };
}

export class DataExportService {
  private supabase;
  private encryptionService: DataEncryptionService;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
    this.encryptionService = new DataEncryptionService();
  }

  static create(supabaseClient?: any): DataExportService {
    return new DataExportService(supabaseClient);
  }

  /**
   * Create data export request
   */
  async createExportRequest(
    request: ExportRequest
  ): Promise<{ success: boolean; data?: DataExport; error?: string }> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error } = await this.supabase
        .from('data_exports')
        .insert({
          user_id: request.user_id,
          export_type: request.export_type,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create export request: ${error.message}`);
      }

      // Process export asynchronously
      this.processExport(data.id, request).catch(error => {
        console.error('Error processing export:', error);
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error creating export request:', error);
      return { success: false, error: 'Failed to create export request' };
    }
  }

  /**
   * Process data export
   */
  private async processExport(
    exportId: string,
    request: ExportRequest
  ): Promise<void> {
    try {
      // Update status to processing
      await this.supabase
        .from('data_exports')
        .update({ status: 'processing' })
        .eq('id', exportId);

      // Collect user data
      const exportData = await this.collectUserData(request);

      // Generate export file
      const filePath = await this.generateExportFile(exportData, request);

      // Update export record
      await this.supabase
        .from('data_exports')
        .update({
          status: 'completed',
          file_path: filePath,
          file_size: await this.getFileSize(filePath),
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportId);
    } catch (error) {
      console.error('Error processing export:', error);

      // Update status to failed
      await this.supabase
        .from('data_exports')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportId);
    }
  }

  /**
   * Collect user data for export
   */
  private async collectUserData(request: ExportRequest): Promise<ExportData> {
    const exportData: ExportData = {
      user_profile: null,
      contacts: [],
      messages: [],
      events: [],
      payments: [],
      analytics: [],
      metadata: {
        export_date: new Date(),
        data_categories: request.data_categories,
        total_records: 0,
      },
    };

    // Get user profile
    if (request.data_categories.includes('profile')) {
      const { data: userProfile } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', request.user_id)
        .single();

      exportData.user_profile = userProfile;
    }

    // Get contacts
    if (request.data_categories.includes('contacts')) {
      const { data: contacts } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('user_id', request.user_id);

      exportData.contacts = contacts || [];
    }

    // Get messages
    if (request.data_categories.includes('messages')) {
      const { data: messages } = await this.supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', request.user_id);

      exportData.messages = messages || [];
    }

    // Get events
    if (request.data_categories.includes('events')) {
      const { data: events } = await this.supabase
        .from('events')
        .select('*')
        .eq('user_id', request.user_id);

      exportData.events = events || [];
    }

    // Get payments
    if (request.data_categories.includes('payments')) {
      const { data: payments } = await this.supabase
        .from('payments')
        .select('*')
        .eq('user_id', request.user_id);

      exportData.payments = payments || [];
    }

    // Get analytics
    if (request.data_categories.includes('analytics')) {
      const { data: analytics } = await this.supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', request.user_id);

      exportData.analytics = analytics || [];
    }

    // Calculate total records
    exportData.metadata.total_records =
      (exportData.user_profile ? 1 : 0) +
      exportData.contacts.length +
      exportData.messages.length +
      exportData.events.length +
      exportData.payments.length +
      exportData.analytics.length;

    return exportData;
  }

  /**
   * Generate export file
   */
  private async generateExportFile(
    data: ExportData,
    request: ExportRequest
  ): Promise<string> {
    const fileName = `user_data_export_${request.user_id}_${Date.now()}.${request.format}`;
    const filePath = `/exports/${fileName}`;

    let fileContent: string;

    switch (request.format) {
      case 'json':
        fileContent = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        fileContent = this.convertToCSV(data);
        break;
      case 'xml':
        fileContent = this.convertToXML(data);
        break;
      default:
        throw new Error(`Unsupported export format: ${request.format}`);
    }

    // Encrypt file content
    const encryptedContent = await this.encryptionService.encrypt(
      fileContent,
      'export'
    );

    // Store file in Supabase Storage
    const { error } = await this.supabase.storage
      .from('data-exports')
      .upload(filePath, encryptedContent, {
        contentType: 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload export file: ${error.message}`);
    }

    return filePath;
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: ExportData): string {
    const csvRows: string[] = [];

    // Add metadata
    csvRows.push('Data Category,Record Count');
    csvRows.push(`User Profile,${data.user_profile ? 1 : 0}`);
    csvRows.push(`Contacts,${data.contacts.length}`);
    csvRows.push(`Messages,${data.messages.length}`);
    csvRows.push(`Events,${data.events.length}`);
    csvRows.push(`Payments,${data.payments.length}`);
    csvRows.push(`Analytics,${data.analytics.length}`);
    csvRows.push('');

    // Add detailed data
    if (data.contacts.length > 0) {
      csvRows.push('Contacts Data:');
      csvRows.push('ID,Contact Type,Relationship Status,Created At');
      data.contacts.forEach(contact => {
        csvRows.push(
          `${contact.id},${contact.contact_type},${contact.relationship_status},${contact.created_at}`
        );
      });
      csvRows.push('');
    }

    if (data.messages.length > 0) {
      csvRows.push('Messages Data:');
      csvRows.push('ID,Message Type,Content,Created At');
      data.messages.forEach(message => {
        csvRows.push(
          `${message.id},${message.message_type},"${message.content}",${message.created_at}`
        );
      });
      csvRows.push('');
    }

    return csvRows.join('\n');
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(data: ExportData): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<user_data_export>\n';
    xml += `  <metadata>\n`;
    xml += `    <export_date>${data.metadata.export_date.toISOString()}</export_date>\n`;
    xml += `    <data_categories>${data.metadata.data_categories.join(',')}</data_categories>\n`;
    xml += `    <total_records>${data.metadata.total_records}</total_records>\n`;
    xml += `  </metadata>\n`;

    if (data.user_profile) {
      xml += `  <user_profile>\n`;
      xml += `    <id>${data.user_profile.id}</id>\n`;
      xml += `    <email>${data.user_profile.email}</email>\n`;
      xml += `    <created_at>${data.user_profile.created_at}</created_at>\n`;
      xml += `  </user_profile>\n`;
    }

    if (data.contacts.length > 0) {
      xml += `  <contacts>\n`;
      data.contacts.forEach(contact => {
        xml += `    <contact>\n`;
        xml += `      <id>${contact.id}</id>\n`;
        xml += `      <contact_type>${contact.contact_type}</contact_type>\n`;
        xml += `      <relationship_status>${contact.relationship_status}</relationship_status>\n`;
        xml += `      <created_at>${contact.created_at}</created_at>\n`;
        xml += `    </contact>\n`;
      });
      xml += `  </contacts>\n`;
    }

    xml += '</user_data_export>';
    return xml;
  }

  /**
   * Get file size
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const { data } = await this.supabase.storage
        .from('data-exports')
        .download(filePath);

      if (data) {
        const arrayBuffer = await data.arrayBuffer();
        return arrayBuffer.byteLength;
      }
      return 0;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  /**
   * Get user's export requests
   */
  async getUserExports(
    userId: string,
    filters: { status?: string; export_type?: string } = {}
  ): Promise<{ success: boolean; data?: DataExport[]; error?: string }> {
    try {
      let query = this.supabase
        .from('data_exports')
        .select('*')
        .eq('user_id', userId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.export_type) {
        query = query.eq('export_type', filters.export_type);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to get user exports: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting user exports:', error);
      return { success: false, error: 'Failed to get user exports' };
    }
  }

  /**
   * Get export by ID
   */
  async getExportById(
    exportId: string,
    userId: string
  ): Promise<{ success: boolean; data?: DataExport; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('data_exports')
        .select('*')
        .eq('id', exportId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to get export: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting export:', error);
      return { success: false, error: 'Failed to get export' };
    }
  }

  /**
   * Download export file
   */
  async downloadExport(
    exportId: string,
    userId: string
  ): Promise<{ success: boolean; data?: Buffer; error?: string }> {
    try {
      const exportRecord = await this.getExportById(exportId, userId);
      if (!exportRecord.success || !exportRecord.data) {
        return { success: false, error: 'Export not found' };
      }

      if (exportRecord.data.status !== 'completed') {
        return { success: false, error: 'Export not ready' };
      }

      if (!exportRecord.data.file_path) {
        return { success: false, error: 'Export file not found' };
      }

      // Check if export has expired
      if (new Date() > new Date(exportRecord.data.expires_at)) {
        return { success: false, error: 'Export has expired' };
      }

      // Download file from storage
      const { data, error } = await this.supabase.storage
        .from('data-exports')
        .download(exportRecord.data.file_path);

      if (error) {
        throw new Error(`Failed to download export file: ${error.message}`);
      }

      if (!data) {
        return { success: false, error: 'Export file not found' };
      }

      // Decrypt file content
      const arrayBuffer = await data.arrayBuffer();
      const encryptedContent = Buffer.from(arrayBuffer);
      const decryptedContent = await this.encryptionService.decrypt(
        JSON.parse(encryptedContent.toString())
      );

      return { success: true, data: Buffer.from(decryptedContent) };
    } catch (error) {
      console.error('Error downloading export:', error);
      return { success: false, error: 'Failed to download export' };
    }
  }

  /**
   * Delete export
   */
  async deleteExport(
    exportId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const exportRecord = await this.getExportById(exportId, userId);
      if (!exportRecord.success || !exportRecord.data) {
        return { success: false, error: 'Export not found' };
      }

      // Delete file from storage if it exists
      if (exportRecord.data.file_path) {
        await this.supabase.storage
          .from('data-exports')
          .remove([exportRecord.data.file_path]);
      }

      // Delete export record
      const { error } = await this.supabase
        .from('data_exports')
        .delete()
        .eq('id', exportId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete export: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting export:', error);
      return { success: false, error: 'Failed to delete export' };
    }
  }

  /**
   * Get export analytics
   */
  async getExportAnalytics(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data: exports, error } = await this.supabase
        .from('data_exports')
        .select('*');

      if (error) {
        throw new Error(`Failed to get export analytics: ${error.message}`);
      }

      const analytics = {
        total_exports: exports?.length || 0,
        completed_exports:
          exports?.filter(e => e.status === 'completed').length || 0,
        failed_exports: exports?.filter(e => e.status === 'failed').length || 0,
        pending_exports:
          exports?.filter(e => e.status === 'pending').length || 0,
        by_type:
          exports?.reduce((acc: any, exp: any) => {
            acc[exp.export_type] = (acc[exp.export_type] || 0) + 1;
            return acc;
          }, {}) || {},
        total_file_size:
          exports?.reduce(
            (total: number, exp: any) => total + (exp.file_size || 0),
            0
          ) || 0,
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error getting export analytics:', error);
      return { success: false, error: 'Failed to get export analytics' };
    }
  }

  /**
   * Cleanup expired exports
   */
  async cleanupExpiredExports(): Promise<{
    success: boolean;
    data?: number;
    error?: string;
  }> {
    try {
      const now = new Date().toISOString();

      // Get expired exports
      const { data: expiredExports, error: fetchError } = await this.supabase
        .from('data_exports')
        .select('*')
        .lt('expires_at', now);

      if (fetchError) {
        throw new Error(`Failed to get expired exports: ${fetchError.message}`);
      }

      if (!expiredExports || expiredExports.length === 0) {
        return { success: true, data: 0 };
      }

      // Delete files from storage
      const filePaths = expiredExports
        .filter(exp => exp.file_path)
        .map(exp => exp.file_path);

      if (filePaths.length > 0) {
        await this.supabase.storage.from('data-exports').remove(filePaths);
      }

      // Delete export records
      const { error: deleteError } = await this.supabase
        .from('data_exports')
        .delete()
        .lt('expires_at', now);

      if (deleteError) {
        throw new Error(
          `Failed to delete expired exports: ${deleteError.message}`
        );
      }

      return { success: true, data: expiredExports.length };
    } catch (error) {
      console.error('Error cleaning up expired exports:', error);
      return { success: false, error: 'Failed to cleanup expired exports' };
    }
  }
}
