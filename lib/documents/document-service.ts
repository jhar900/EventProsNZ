import { createClient } from '@/lib/supabase/server';
import { UploadService } from './upload-service';
import {
  Document,
  DocumentMetadata,
  DocumentListResponse,
  DocumentDetailResponse,
  DocumentFilters,
} from '@/types/documents';

export class DocumentService {
  private supabase = createClient();
  private uploadService = new UploadService();

  async uploadDocument(
    file: File,
    metadata: DocumentMetadata
  ): Promise<Document> {
    try {
      // Use UploadService for validation and upload
      return await this.uploadService.uploadFile(file, metadata);
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  async createDocument(data: any): Promise<Document> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const documentData = {
        ...data,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: document, error } = await this.supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create document: ${error.message}`);
      }

      return document;
    } catch (error) {
      console.error('Create document error:', error);
      throw error;
    }
  }

  async listDocuments(
    filters?: DocumentFilters,
    page = 1,
    limit = 20
  ): Promise<DocumentListResponse> {
    return this.getDocuments(filters, page, limit);
  }

  async getDocuments(
    filters?: DocumentFilters,
    page = 1,
    limit = 20
  ): Promise<DocumentListResponse> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      let query = this.supabase
        .from('documents')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.document_category) {
        query = query.eq('document_category', filters.document_category);
      }
      if (filters?.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }
      if (filters?.file_type) {
        query = query.like('mime_type', `${filters.file_type}%`);
      }
      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: documents, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      return {
        documents: documents || [],
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }

  async getDocument(id: string): Promise<DocumentDetailResponse> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get document
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      // Check access permissions
      const hasAccess = await this.checkDocumentAccess(id, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get versions
      const { data: versions, error: versionsError } = await this.supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', id)
        .order('version_number', { ascending: false });

      if (versionsError) {
        console.warn('Failed to fetch versions:', versionsError.message);
      }

      // Get shares
      const { data: shares, error: sharesError } = await this.supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', id)
        .eq('is_active', true);

      if (sharesError) {
        console.warn('Failed to fetch shares:', sharesError.message);
      }

      return {
        document,
        versions: versions || [],
        shares: shares || [],
      };
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  }

  async updateDocument(
    id: string,
    updates: Partial<DocumentMetadata>
  ): Promise<Document> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns the document
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('user_id')
        .eq('id', id)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      if (document.user_id !== user.id) {
        throw new Error('Access denied');
      }

      // Update document
      const { data: updatedDocument, error: updateError } = await this.supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      return updatedDocument;
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns the document
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('user_id, file_path')
        .eq('id', id)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      if (document.user_id !== user.id) {
        throw new Error('Access denied');
      }

      // Delete file from storage
      const { error: storageError } = await this.supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn(
          'Failed to delete file from storage:',
          storageError.message
        );
      }

      // Delete document record (cascades to related tables)
      const { error: deleteError } = await this.supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  async searchDocuments(
    query: string,
    filters?: DocumentFilters
  ): Promise<Document[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      let searchQuery = this.supabase
        .from('documents')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .textSearch('document_name', query);

      // Apply additional filters
      if (filters?.document_category) {
        searchQuery = searchQuery.eq(
          'document_category',
          filters.document_category
        );
      }
      if (filters?.file_type) {
        searchQuery = searchQuery.like('mime_type', `${filters.file_type}%`);
      }

      const { data: documents, error } = await searchQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      return documents || [];
    } catch (error) {
      console.error('Search documents error:', error);
      throw error;
    }
  }

  async shareDocument(
    documentId: string,
    shareData: {
      shared_with: string;
      permission_level: string;
      expires_at?: string;
    }
  ): Promise<any> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns the document
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('user_id')
        .eq('id', documentId)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      if (document.user_id !== user.id) {
        throw new Error('Access denied');
      }

      // Validate permission level
      const validPermissions = ['read', 'write', 'admin'];
      if (!validPermissions.includes(shareData.permission_level)) {
        throw new Error('Invalid permission level');
      }

      // Create share record
      const { data: share, error: shareError } = await this.supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          shared_by: user.id,
          shared_with: shareData.shared_with,
          permission_level: shareData.permission_level,
          expires_at: shareData.expires_at,
        })
        .select()
        .single();

      if (shareError) {
        throw new Error(`Share failed: ${shareError.message}`);
      }

      return share;
    } catch (error) {
      console.error('Share document error:', error);
      throw error;
    }
  }

  async getDocumentVersions(documentId: string): Promise<any[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check access permissions
      const hasAccess = await this.checkDocumentAccess(documentId, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const { data: versions, error } = await this.supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch versions: ${error.message}`);
      }

      return versions || [];
    } catch (error) {
      console.error('Get document versions error:', error);
      throw error;
    }
  }

  async createDocumentVersion(
    documentId: string,
    file: File,
    changeSummary?: string
  ): Promise<any> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check access permissions
      const hasAccess = await this.checkDocumentAccess(documentId, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get current version number
      const { data: currentVersions, error: versionsError } =
        await this.supabase
          .from('document_versions')
          .select('version_number')
          .eq('document_id', documentId)
          .order('version_number', { ascending: false })
          .limit(1);

      const nextVersion = currentVersions?.[0]?.version_number + 1 || 1;

      // Generate unique file path for version
      const fileExtension = file.name.split('.').pop();
      const fileName = `${documentId}-v${nextVersion}-${Date.now()}.${fileExtension}`;
      const filePath = `documents/versions/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await this.supabase.storage.from('documents').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create version record
      const { data: version, error: versionError } = await this.supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: nextVersion,
          file_path: filePath,
          file_size: file.size,
          change_summary: changeSummary,
          created_by: user.id,
        })
        .select()
        .single();

      if (versionError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from('documents').remove([filePath]);
        throw new Error(`Version creation failed: ${versionError.message}`);
      }

      return version;
    } catch (error) {
      console.error('Create document version error:', error);
      throw error;
    }
  }

  private async checkDocumentAccess(
    documentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if user owns the document
      const { data: document } = await this.supabase
        .from('documents')
        .select('user_id, is_public')
        .eq('id', documentId)
        .single();

      if (document?.user_id === userId) {
        return true;
      }

      if (document?.is_public) {
        return true;
      }

      // Check if document is shared with user
      const { data: share } = await this.supabase
        .from('document_shares')
        .select('id')
        .eq('document_id', documentId)
        .eq('shared_with', userId)
        .eq('is_active', true)
        .single();

      return !!share;
    } catch (error) {
      console.error('Check document access error:', error);
      return false;
    }
  }
}
