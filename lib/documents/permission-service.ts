import { createClient } from '@/lib/supabase/server';
import { DocumentAccess, AccessType } from '@/types/documents';

export class PermissionService {
  private supabase = createClient();

  async getDocumentPermissions(documentId: string): Promise<DocumentAccess[]> {
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

      const { data: permissions, error } = await this.supabase
        .from('document_access')
        .select(
          `
          *,
          user:users!document_access_user_id_fkey(id, email),
          granted_by_user:users!document_access_granted_by_fkey(id, email)
        `
        )
        .eq('document_id', documentId)
        .order('granted_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch permissions: ${error.message}`);
      }

      return permissions || [];
    } catch (error) {
      console.error('Get document permissions error:', error);
      throw error;
    }
  }

  async createPermission(
    documentId: string,
    userId: string,
    accessType: AccessType,
    expiresAt?: string
  ): Promise<DocumentAccess> {
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
        throw new Error(
          'Access denied: You can only set permissions for documents you own'
        );
      }

      // Check if user exists
      const { data: targetUser, error: userCheckError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userCheckError || !targetUser) {
        throw new Error('Target user not found');
      }

      // Check if permission already exists
      const { data: existingPermission, error: existingError } =
        await this.supabase
          .from('document_access')
          .select('id')
          .eq('document_id', documentId)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

      if (existingPermission && !existingError) {
        throw new Error('Permission already exists for this user');
      }

      // Create permission record
      const { data: permission, error: permissionError } = await this.supabase
        .from('document_access')
        .insert({
          document_id: documentId,
          user_id: userId,
          access_type: accessType,
          granted_by: user.id,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (permissionError) {
        throw new Error(
          `Permission creation failed: ${permissionError.message}`
        );
      }

      return permission;
    } catch (error) {
      console.error('Create permission error:', error);
      throw error;
    }
  }

  async updatePermission(
    permissionId: string,
    accessType: AccessType,
    expiresAt?: string,
    isActive?: boolean
  ): Promise<DocumentAccess> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns the document
      const { data: permission, error: permissionError } = await this.supabase
        .from('document_access')
        .select(
          `
          *,
          document:documents(user_id)
        `
        )
        .eq('id', permissionId)
        .single();

      if (permissionError) {
        throw new Error(`Permission not found: ${permissionError.message}`);
      }

      if (permission.document.user_id !== user.id) {
        throw new Error(
          'Access denied: You can only update permissions for documents you own'
        );
      }

      // Update permission
      const { data: updatedPermission, error: updateError } =
        await this.supabase
          .from('document_access')
          .update({
            access_type: accessType,
            expires_at: expiresAt,
            is_active: isActive,
          })
          .eq('id', permissionId)
          .select()
          .single();

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      return updatedPermission;
    } catch (error) {
      console.error('Update permission error:', error);
      throw error;
    }
  }

  async deletePermission(permissionId: string): Promise<boolean> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Check if user owns the document
      const { data: permission, error: permissionError } = await this.supabase
        .from('document_access')
        .select(
          `
          *,
          document:documents(user_id)
        `
        )
        .eq('id', permissionId)
        .single();

      if (permissionError) {
        throw new Error(`Permission not found: ${permissionError.message}`);
      }

      if (permission.document.user_id !== user.id) {
        throw new Error(
          'Access denied: You can only delete permissions for documents you own'
        );
      }

      // Delete permission
      const { error: deleteError } = await this.supabase
        .from('document_access')
        .delete()
        .eq('id', permissionId);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Delete permission error:', error);
      throw error;
    }
  }

  async checkUserPermission(
    documentId: string,
    userId: string
  ): Promise<AccessType | null> {
    try {
      // Check if user owns the document
      const { data: document } = await this.supabase
        .from('documents')
        .select('user_id, is_public')
        .eq('id', documentId)
        .single();

      if (document?.user_id === userId) {
        return 'admin'; // Document owner has admin access
      }

      if (document?.is_public) {
        return 'view'; // Public documents have view access
      }

      // Check specific permissions
      const { data: permission } = await this.supabase
        .from('document_access')
        .select('access_type, expires_at, is_active')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!permission) {
        return null;
      }

      // Check if permission is expired
      if (
        permission.expires_at &&
        new Date(permission.expires_at) < new Date()
      ) {
        return null;
      }

      return permission.access_type;
    } catch (error) {
      console.error('Check user permission error:', error);
      return null;
    }
  }

  async getPermissionAnalytics(documentId: string): Promise<{
    totalPermissions: number;
    activePermissions: number;
    expiredPermissions: number;
    accessTypeBreakdown: Record<AccessType, number>;
    expiringSoon: number;
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

      // Get all permissions for the document
      const { data: permissions, error: permissionsError } = await this.supabase
        .from('document_access')
        .select('access_type, expires_at, is_active')
        .eq('document_id', documentId);

      if (permissionsError) {
        throw new Error(
          `Failed to fetch permission analytics: ${permissionsError.message}`
        );
      }

      const now = new Date();
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const activePermissions =
        permissions?.filter(
          p => p.is_active && (!p.expires_at || new Date(p.expires_at) > now)
        ) || [];

      const expiredPermissions =
        permissions?.filter(
          p => p.expires_at && new Date(p.expires_at) <= now
        ) || [];

      const expiringSoon =
        permissions?.filter(
          p =>
            p.expires_at &&
            new Date(p.expires_at) > now &&
            new Date(p.expires_at) <= sevenDaysFromNow
        ).length || 0;

      const accessTypeBreakdown =
        permissions?.reduce(
          (acc, permission) => {
            acc[permission.access_type] =
              (acc[permission.access_type] || 0) + 1;
            return acc;
          },
          {} as Record<AccessType, number>
        ) || {};

      return {
        totalPermissions: permissions?.length || 0,
        activePermissions: activePermissions.length,
        expiredPermissions: expiredPermissions.length,
        accessTypeBreakdown,
        expiringSoon,
      };
    } catch (error) {
      console.error('Get permission analytics error:', error);
      throw error;
    }
  }

  async bulkUpdatePermissions(
    documentId: string,
    updates: Array<{
      userId: string;
      accessType: AccessType;
      expiresAt?: string;
      isActive?: boolean;
    }>
  ): Promise<DocumentAccess[]> {
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
        throw new Error(
          'Access denied: You can only update permissions for documents you own'
        );
      }

      const results: DocumentAccess[] = [];

      for (const update of updates) {
        try {
          // Check if permission exists
          const { data: existingPermission } = await this.supabase
            .from('document_access')
            .select('id')
            .eq('document_id', documentId)
            .eq('user_id', update.userId)
            .single();

          if (existingPermission) {
            // Update existing permission
            const { data: updatedPermission } = await this.supabase
              .from('document_access')
              .update({
                access_type: update.accessType,
                expires_at: update.expiresAt,
                is_active: update.isActive,
              })
              .eq('id', existingPermission.id)
              .select()
              .single();

            if (updatedPermission) {
              results.push(updatedPermission);
            }
          } else {
            // Create new permission
            const { data: newPermission } = await this.supabase
              .from('document_access')
              .insert({
                document_id: documentId,
                user_id: update.userId,
                access_type: update.accessType,
                granted_by: user.id,
                expires_at: update.expiresAt,
                is_active: update.isActive,
              })
              .select()
              .single();

            if (newPermission) {
              results.push(newPermission);
            }
          }
        } catch (error) {
          console.error(
            `Failed to update permission for user ${update.userId}:`,
            error
          );
        }
      }

      return results;
    } catch (error) {
      console.error('Bulk update permissions error:', error);
      throw error;
    }
  }

  async grantPermission(
    documentId: string,
    userId: string,
    accessType: AccessType,
    expiresAt?: string
  ): Promise<DocumentAccess> {
    return this.createPermission(documentId, userId, accessType, expiresAt);
  }

  async revokePermission(permissionId: string): Promise<boolean> {
    return this.deletePermission(permissionId);
  }

  async checkPermission(
    documentId: string,
    userId: string
  ): Promise<AccessType | null> {
    return this.checkUserPermission(documentId, userId);
  }

  async getUserPermissions(userId: string): Promise<DocumentAccess[]> {
    try {
      const { data: permissions, error } = await this.supabase
        .from('document_access')
        .select(
          `
          *,
          document:documents(id, document_name, document_type),
          user:users!document_access_user_id_fkey(id, email),
          granted_by_user:users!document_access_granted_by_fkey(id, email)
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user permissions: ${error.message}`);
      }

      return permissions || [];
    } catch (error) {
      console.error('Get user permissions error:', error);
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
