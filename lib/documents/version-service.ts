import { createClient } from '@/lib/supabase/server';
import { DocumentVersion, DocumentMetadata } from '@/types/documents';

export class VersionService {
  private supabase = createClient();

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
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

  async createVersion(
    documentId: string,
    file: File,
    changeSummary?: string
  ): Promise<DocumentVersion> {
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

      // Get current version number
      const { data: latestVersion, error: versionError } = await this.supabase
        .from('document_versions')
        .select('version_number')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersionNumber = latestVersion
        ? latestVersion.version_number + 1
        : 1;

      // Generate unique file path for version
      const fileExtension = file.name.split('.').pop();
      const fileName = `${documentId}-v${nextVersionNumber}-${Date.now()}.${fileExtension}`;
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
      const { data: version, error: versionCreateError } = await this.supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: nextVersionNumber,
          file_path: filePath,
          file_size: file.size,
          change_summary: changeSummary,
          created_by: user.id,
        })
        .select()
        .single();

      if (versionCreateError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from('documents').remove([filePath]);
        throw new Error(
          `Version creation failed: ${versionCreateError.message}`
        );
      }

      return version;
    } catch (error) {
      console.error('Create version error:', error);
      throw error;
    }
  }

  async getVersion(
    documentId: string,
    versionNumber: number
  ): Promise<DocumentVersion> {
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

      const { data: version, error } = await this.supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .eq('version_number', versionNumber)
        .single();

      if (error) {
        throw new Error(`Version not found: ${error.message}`);
      }

      return version;
    } catch (error) {
      console.error('Get version error:', error);
      throw error;
    }
  }

  async getVersionDownloadUrl(
    documentId: string,
    versionNumber: number
  ): Promise<string> {
    try {
      const version = await this.getVersion(documentId, versionNumber);

      const { data, error } = await this.supabase.storage
        .from('documents')
        .createSignedUrl(version.file_path, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Get version download URL error:', error);
      throw error;
    }
  }

  async getVersionPreviewUrl(
    documentId: string,
    versionNumber: number
  ): Promise<string> {
    try {
      const version = await this.getVersion(documentId, versionNumber);

      // For now, return the same URL as download
      // In a real implementation, you might want to create a preview-specific URL
      return await this.getVersionDownloadUrl(documentId, versionNumber);
    } catch (error) {
      console.error('Get version preview URL error:', error);
      throw error;
    }
  }

  async deleteVersion(
    documentId: string,
    versionNumber: number
  ): Promise<boolean> {
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

      // Get version to delete
      const { data: version, error: versionError } = await this.supabase
        .from('document_versions')
        .select('file_path')
        .eq('document_id', documentId)
        .eq('version_number', versionNumber)
        .single();

      if (versionError) {
        throw new Error(`Version not found: ${versionError.message}`);
      }

      // Delete version record
      const { error: deleteError } = await this.supabase
        .from('document_versions')
        .delete()
        .eq('document_id', documentId)
        .eq('version_number', versionNumber);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      // Delete file from storage
      const { error: storageError } = await this.supabase.storage
        .from('documents')
        .remove([version.file_path]);

      if (storageError) {
        console.warn(
          'Failed to delete file from storage:',
          storageError.message
        );
      }

      return true;
    } catch (error) {
      console.error('Delete version error:', error);
      throw error;
    }
  }

  async compareVersions(
    documentId: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: DocumentVersion;
    version2: DocumentVersion;
    differences: string[];
  }> {
    try {
      const [v1, v2] = await Promise.all([
        this.getVersion(documentId, version1),
        this.getVersion(documentId, version2),
      ]);

      // Basic comparison - in a real implementation, you might want to do content comparison
      const differences: string[] = [];

      if (v1.file_size !== v2.file_size) {
        differences.push(
          `File size changed from ${v1.file_size} to ${v2.file_size} bytes`
        );
      }

      if (v1.change_summary !== v2.change_summary) {
        differences.push('Change summary updated');
      }

      return {
        version1: v1,
        version2: v2,
        differences,
      };
    } catch (error) {
      console.error('Compare versions error:', error);
      throw error;
    }
  }

  async getVersionHistory(documentId: string): Promise<{
    versions: DocumentVersion[];
    totalSize: number;
    averageSize: number;
    versionCount: number;
  }> {
    try {
      const versions = await this.getDocumentVersions(documentId);

      const totalSize = versions.reduce(
        (sum, version) => sum + version.file_size,
        0
      );
      const averageSize = versions.length > 0 ? totalSize / versions.length : 0;

      return {
        versions,
        totalSize,
        averageSize,
        versionCount: versions.length,
      };
    } catch (error) {
      console.error('Get version history error:', error);
      throw error;
    }
  }

  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    return this.getDocumentVersions(documentId);
  }

  async getLatestVersion(documentId: string): Promise<DocumentVersion | null> {
    try {
      const versions = await this.getDocumentVersions(documentId);
      return versions.length > 0 ? versions[0] : null;
    } catch (error) {
      console.error('Get latest version error:', error);
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
