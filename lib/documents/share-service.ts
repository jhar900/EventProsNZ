import { createClient } from '@/lib/supabase/server';
import { DocumentShare, ShareData, PermissionLevel } from '@/types/documents';

export class ShareService {
  private supabase = createClient();

  async shareDocument(
    documentId: string,
    shareData: ShareData
  ): Promise<DocumentShare> {
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
        throw new Error('Access denied: You can only share documents you own');
      }

      // Check if user exists
      const { data: targetUser, error: userCheckError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', shareData.shared_with)
        .single();

      if (userCheckError || !targetUser) {
        throw new Error('Target user not found');
      }

      // Check if document is already shared with this user
      const { data: existingShare, error: existingShareError } =
        await this.supabase
          .from('document_shares')
          .select('id')
          .eq('document_id', documentId)
          .eq('shared_with', shareData.shared_with)
          .eq('is_active', true)
          .single();

      if (existingShare && !existingShareError) {
        throw new Error('Document is already shared with this user');
      }

      // Create share record
      const { data: documentShare, error: shareError } = await this.supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          shared_by: user.id,
          shared_with: shareData.shared_with,
          permission_level: shareData.permission_level,
          expires_at: shareData.expires_at,
          is_active: true,
        })
        .select()
        .single();

      if (shareError) {
        throw new Error(`Share creation failed: ${shareError.message}`);
      }

      return documentShare;
    } catch (error) {
      console.error('Share document error:', error);
      throw error;
    }
  }

  async getDocumentShares(documentId: string): Promise<DocumentShare[]> {
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

      const { data: shares, error } = await this.supabase
        .from('document_shares')
        .select(
          `
          *,
          shared_by_user:users!document_shares_shared_by_fkey(id, email),
          shared_with_user:users!document_shares_shared_with_fkey(id, email)
        `
        )
        .eq('document_id', documentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch shares: ${error.message}`);
      }

      return shares || [];
    } catch (error) {
      console.error('Get document shares error:', error);
      throw error;
    }
  }

  async updateShare(
    shareId: string,
    updates: Partial<ShareData>
  ): Promise<DocumentShare> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns the share
      const { data: share, error: shareError } = await this.supabase
        .from('document_shares')
        .select('shared_by')
        .eq('id', shareId)
        .single();

      if (shareError) {
        throw new Error(`Share not found: ${shareError.message}`);
      }

      if (share.shared_by !== user.id) {
        throw new Error(
          'Access denied: You can only update shares you created'
        );
      }

      // Update share
      const { data: updatedShare, error: updateError } = await this.supabase
        .from('document_shares')
        .update(updates)
        .eq('id', shareId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      return updatedShare;
    } catch (error) {
      console.error('Update share error:', error);
      throw error;
    }
  }

  async revokeShare(shareId: string): Promise<boolean> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns the share
      const { data: share, error: shareError } = await this.supabase
        .from('document_shares')
        .select('shared_by')
        .eq('id', shareId)
        .single();

      if (shareError) {
        throw new Error(`Share not found: ${shareError.message}`);
      }

      if (share.shared_by !== user.id) {
        throw new Error(
          'Access denied: You can only revoke shares you created'
        );
      }

      // Deactivate share
      const { error: updateError } = await this.supabase
        .from('document_shares')
        .update({ is_active: false })
        .eq('id', shareId);

      if (updateError) {
        throw new Error(`Revoke failed: ${updateError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Revoke share error:', error);
      throw error;
    }
  }

  async getSharedWithMe(): Promise<DocumentShare[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: shares, error } = await this.supabase
        .from('document_shares')
        .select(
          `
          *,
          document:documents(*),
          shared_by_user:users!document_shares_shared_by_fkey(id, email)
        `
        )
        .eq('shared_with', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch shared documents: ${error.message}`);
      }

      return shares || [];
    } catch (error) {
      console.error('Get shared with me error:', error);
      throw error;
    }
  }

  async getSharedByMe(): Promise<DocumentShare[]> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: shares, error } = await this.supabase
        .from('document_shares')
        .select(
          `
          *,
          document:documents(*),
          shared_with_user:users!document_shares_shared_with_fkey(id, email)
        `
        )
        .eq('shared_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch shared documents: ${error.message}`);
      }

      return shares || [];
    } catch (error) {
      console.error('Get shared by me error:', error);
      throw error;
    }
  }

  async checkSharePermissions(
    documentId: string,
    userId: string
  ): Promise<PermissionLevel | null> {
    try {
      const { data: share, error } = await this.supabase
        .from('document_shares')
        .select('permission_level')
        .eq('document_id', documentId)
        .eq('shared_with', userId)
        .eq('is_active', true)
        .single();

      if (error || !share) {
        return null;
      }

      return share.permission_level;
    } catch (error) {
      console.error('Check share permissions error:', error);
      return null;
    }
  }

  async checkSharePermission(
    documentId: string,
    userId: string,
    requiredPermission: PermissionLevel
  ): Promise<boolean> {
    try {
      const permission = await this.checkSharePermissions(documentId, userId);
      if (!permission) {
        return false;
      }

      // Define permission hierarchy
      const permissionLevels = {
        read: 1,
        write: 2,
        admin: 3,
      };

      const userLevel = permissionLevels[permission] || 0;
      const requiredLevel = permissionLevels[requiredPermission] || 0;

      return userLevel >= requiredLevel;
    } catch (error) {
      console.error('Check share permission error:', error);
      return false;
    }
  }

  async getShareAnalytics(documentId: string): Promise<{
    totalShares: number;
    activeShares: number;
    expiredShares: number;
    permissionBreakdown: Record<PermissionLevel, number>;
  }> {
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

      if (documentError || document.user_id !== user.id) {
        throw new Error('Access denied');
      }

      // Get all shares for the document
      const { data: shares, error: sharesError } = await this.supabase
        .from('document_shares')
        .select('permission_level, is_active, expires_at')
        .eq('document_id', documentId);

      if (sharesError) {
        throw new Error(
          `Failed to fetch share analytics: ${sharesError.message}`
        );
      }

      const now = new Date();
      const activeShares =
        shares?.filter(
          share =>
            share.is_active &&
            (!share.expires_at || new Date(share.expires_at) > now)
        ) || [];

      const expiredShares =
        shares?.filter(
          share => share.expires_at && new Date(share.expires_at) <= now
        ) || [];

      const permissionBreakdown =
        shares?.reduce(
          (acc, share) => {
            acc[share.permission_level] =
              (acc[share.permission_level] || 0) + 1;
            return acc;
          },
          {} as Record<PermissionLevel, number>
        ) || {};

      return {
        totalShares: shares?.length || 0,
        activeShares: activeShares.length,
        expiredShares: expiredShares.length,
        permissionBreakdown,
      };
    } catch (error) {
      console.error('Get share analytics error:', error);
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
