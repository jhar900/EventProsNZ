import { createClient } from '@/lib/supabase/server';
import { PreviewData } from '@/types/documents';

export class PreviewService {
  private supabase = createClient();

  async getDocumentPreview(documentId: string): Promise<PreviewData> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user has access to the document
      const hasAccess = await this.checkDocumentAccess(documentId, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get document details
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('file_path, mime_type')
        .eq('id', documentId)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      // Generate preview URL based on file type
      const previewData = await this.generatePreviewData(
        document.file_path,
        document.mime_type
      );

      return previewData;
    } catch (error) {
      console.error('Get document preview error:', error);
      throw error;
    }
  }

  async getDocumentDownloadUrl(
    documentId: string
  ): Promise<{ download_url: string; expires_at: string }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user has access to the document
      const hasAccess = await this.checkDocumentAccess(documentId, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get document details
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      // Create signed URL for download
      const { data, error } = await this.supabase.storage
        .from('documents')
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

      return {
        download_url: data.signedUrl,
        expires_at: expiresAt,
      };
    } catch (error) {
      console.error('Get document download URL error:', error);
      throw error;
    }
  }

  async getVersionPreview(
    documentId: string,
    versionNumber: number
  ): Promise<PreviewData> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user has access to the document
      const hasAccess = await this.checkDocumentAccess(documentId, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get version details
      const { data: version, error: versionError } = await this.supabase
        .from('document_versions')
        .select('file_path')
        .eq('document_id', documentId)
        .eq('version_number', versionNumber)
        .single();

      if (versionError) {
        throw new Error(`Version not found: ${versionError.message}`);
      }

      // Get document mime type
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('mime_type')
        .eq('id', documentId)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      // Generate preview URL for version
      const previewData = await this.generatePreviewData(
        version.file_path,
        document.mime_type
      );

      return previewData;
    } catch (error) {
      console.error('Get version preview error:', error);
      throw error;
    }
  }

  async getVersionDownloadUrl(
    documentId: string,
    versionNumber: number
  ): Promise<{ download_url: string; expires_at: string }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user has access to the document
      const hasAccess = await this.checkDocumentAccess(documentId, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get version details
      const { data: version, error: versionError } = await this.supabase
        .from('document_versions')
        .select('file_path')
        .eq('document_id', documentId)
        .eq('version_number', versionNumber)
        .single();

      if (versionError) {
        throw new Error(`Version not found: ${versionError.message}`);
      }

      // Create signed URL for download
      const { data, error } = await this.supabase.storage
        .from('documents')
        .createSignedUrl(version.file_path, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

      return {
        download_url: data.signedUrl,
        expires_at: expiresAt,
      };
    } catch (error) {
      console.error('Get version download URL error:', error);
      throw error;
    }
  }

  async generateThumbnail(documentId: string): Promise<string> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user has access to the document
      const hasAccess = await this.checkDocumentAccess(documentId, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get document details
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('file_path, mime_type')
        .eq('id', documentId)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      // For images, return the original file URL
      if (document.mime_type.startsWith('image/')) {
        const { data, error } = await this.supabase.storage
          .from('documents')
          .createSignedUrl(document.file_path, 3600);

        if (error) {
          throw new Error(`Failed to create thumbnail URL: ${error.message}`);
        }

        return data.signedUrl;
      }

      // For other file types, you might want to generate thumbnails
      // This would typically involve a separate service or function
      throw new Error('Thumbnail generation not supported for this file type');
    } catch (error) {
      console.error('Generate thumbnail error:', error);
      throw error;
    }
  }

  async getPreviewMetadata(documentId: string): Promise<{
    file_size: number;
    mime_type: string;
    last_modified: string;
    dimensions?: { width: number; height: number };
  }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user has access to the document
      const hasAccess = await this.checkDocumentAccess(documentId, user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get document details
      const { data: document, error: documentError } = await this.supabase
        .from('documents')
        .select('file_size, mime_type, updated_at')
        .eq('id', documentId)
        .single();

      if (documentError) {
        throw new Error(`Document not found: ${documentError.message}`);
      }

      const metadata: any = {
        file_size: document.file_size,
        mime_type: document.mime_type,
        last_modified: document.updated_at,
      };

      // For images, try to get dimensions
      if (document.mime_type.startsWith('image/')) {
        try {
          // This would typically involve loading the image and getting dimensions
          // For now, we'll skip this as it requires additional processing
          // metadata.dimensions = await this.getImageDimensions(documentId);
        } catch (error) {
          console.warn('Failed to get image dimensions:', error);
        }
      }

      return metadata;
    } catch (error) {
      console.error('Get preview metadata error:', error);
      throw error;
    }
  }

  private async generatePreviewData(
    filePath: string,
    mimeType: string
  ): Promise<PreviewData> {
    try {
      // Create signed URL for preview
      const { data, error } = await this.supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Failed to create preview URL: ${error.message}`);
      }

      // Determine preview type based on mime type
      let previewType = 'download';

      if (mimeType.startsWith('image/')) {
        previewType = 'image';
      } else if (mimeType.includes('pdf')) {
        previewType = 'pdf';
      } else if (mimeType.startsWith('video/')) {
        previewType = 'video';
      } else if (mimeType.startsWith('audio/')) {
        previewType = 'audio';
      } else if (mimeType.includes('text/')) {
        previewType = 'text';
      }

      return {
        preview_url: data.signedUrl,
        preview_type: previewType,
      };
    } catch (error) {
      console.error('Generate preview data error:', error);
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
