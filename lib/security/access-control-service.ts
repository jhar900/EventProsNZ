import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  createdAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  permissions: string[];
  roles: string[];
}

export class AccessControlService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  /**
   * Check if user has specific permission
   */
  async checkPermission(
    userId: string,
    permission: string,
    resource?: string,
    action?: string
  ): Promise<AccessCheckResult> {
    try {
      // Get user roles and permissions
      const { data: userRoles, error: rolesError } = await this.supabase
        .from('user_roles')
        .select(
          `
          id,
          role_id,
          is_active,
          expires_at,
          roles (
            id,
            name,
            permissions
          )
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
      }

      const { data: userPermissions, error: permissionsError } =
        await this.supabase
          .from('user_permissions')
          .select(
            `
          id,
          permission_id,
          is_active,
          expires_at,
          permissions (
            id,
            name,
            resource,
            action
          )
        `
          )
          .eq('user_id', userId)
          .eq('is_active', true);

      if (permissionsError) {
        throw new Error(
          `Failed to fetch user permissions: ${permissionsError.message}`
        );
      }

      const now = new Date();
      const activeRoles =
        userRoles?.filter(
          ur =>
            ur.is_active && (!ur.expires_at || new Date(ur.expires_at) > now)
        ) || [];

      const activePermissions =
        userPermissions?.filter(
          up =>
            up.is_active && (!up.expires_at || new Date(up.expires_at) > now)
        ) || [];

      // Check for wildcard permission
      const hasWildcard = activeRoles.some(ur =>
        ur.roles?.permissions?.includes('*')
      );

      if (hasWildcard) {
        return {
          hasAccess: true,
          permissions: activePermissions
            .map(p => p.permissions?.name || '')
            .filter(Boolean),
          roles: activeRoles.map(r => r.roles?.name || '').filter(Boolean),
        };
      }

      // Check direct permissions
      const hasDirectPermission = activePermissions.some(up => {
        const perm = up.permissions;
        if (!perm) return false;

        if (permission === perm.name) return true;
        if (
          resource &&
          action &&
          perm.resource === resource &&
          perm.action === action
        )
          return true;

        return false;
      });

      if (hasDirectPermission) {
        return {
          hasAccess: true,
          permissions: activePermissions
            .map(p => p.permissions?.name || '')
            .filter(Boolean),
          roles: activeRoles.map(r => r.roles?.name || '').filter(Boolean),
        };
      }

      // Check role-based permissions
      const hasRolePermission = activeRoles.some(ur => {
        const rolePermissions = ur.roles?.permissions || [];
        return (
          rolePermissions.includes(permission) ||
          (resource &&
            action &&
            rolePermissions.some(p => p.includes(`${resource}:${action}`)))
        );
      });

      return {
        hasAccess: hasRolePermission,
        reason: hasRolePermission ? undefined : 'Insufficient permissions',
        permissions: activePermissions
          .map(p => p.permissions?.name || '')
          .filter(Boolean),
        roles: activeRoles.map(r => r.roles?.name || '').filter(Boolean),
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        hasAccess: false,
        reason: 'Error checking permissions',
        permissions: [],
        roles: [],
      };
    }
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch roles: ${error.message}`);
      }

      return (
        data?.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions || [],
          isActive: role.is_active,
          createdAt: new Date(role.created_at),
          updatedAt: new Date(role.updated_at),
        })) || []
      );
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await this.supabase
        .from('permissions')
        .select('*')
        .order('resource', 'action');

      if (error) {
        throw new Error(`Failed to fetch permissions: ${error.message}`);
      }

      return (
        data?.map(permission => ({
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          createdAt: new Date(permission.created_at),
        })) || []
      );
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(
    roleData: {
      name: string;
      description: string;
      permissions: string[];
    },
    adminId: string
  ): Promise<Role> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .insert({
          id: crypto.randomUUID(),
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create role: ${error.message}`);
      }

      // Log admin action
      await this.auditLogger.logEvent({
        action: 'role_created',
        userId: adminId,
        resource: 'role',
        resourceId: data.id,
        details: roleData,
      });

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update a role
   */
  async updateRole(
    roleId: string,
    updates: {
      name?: string;
      description?: string;
      permissions?: string[];
    },
    adminId: string
  ): Promise<Role> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update role: ${error.message}`);
      }

      // Log admin action
      await this.auditLogger.logEvent({
        action: 'role_updated',
        userId: adminId,
        resource: 'role',
        resourceId: roleId,
        details: updates,
      });

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        permissions: data.permissions || [],
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string, adminId: string): Promise<void> {
    try {
      // Check if role is assigned to any users
      const { data: userRoles, error: checkError } = await this.supabase
        .from('user_roles')
        .select('id')
        .eq('role_id', roleId)
        .eq('is_active', true)
        .limit(1);

      if (checkError) {
        throw new Error(
          `Failed to check role assignments: ${checkError.message}`
        );
      }

      if (userRoles && userRoles.length > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }

      const { error } = await this.supabase
        .from('roles')
        .update({ is_active: false })
        .eq('id', roleId);

      if (error) {
        throw new Error(`Failed to delete role: ${error.message}`);
      }

      // Log admin action
      await this.auditLogger.logEvent({
        action: 'role_deleted',
        userId: adminId,
        resource: 'role',
        resourceId: roleId,
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: Date
  ): Promise<UserRole> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
          expires_at: expiresAt?.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to assign role: ${error.message}`);
      }

      // Log admin action
      await this.auditLogger.logEvent({
        action: 'role_assigned',
        userId: assignedBy,
        resource: 'user_role',
        resourceId: data.id,
        details: { userId, roleId, expiresAt },
      });

      return {
        id: data.id,
        userId: data.user_id,
        roleId: data.role_id,
        assignedBy: data.assigned_by,
        assignedAt: new Date(data.assigned_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        isActive: data.is_active,
      };
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(
    userId: string,
    roleId: string,
    removedBy: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) {
        throw new Error(`Failed to remove role: ${error.message}`);
      }

      // Log admin action
      await this.auditLogger.logEvent({
        action: 'role_removed',
        userId: removedBy,
        resource: 'user_role',
        details: { userId, roleId },
      });
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select(
          `
          id,
          user_id,
          role_id,
          assigned_by,
          assigned_at,
          expires_at,
          is_active,
          roles (
            id,
            name,
            description
          )
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch user roles: ${error.message}`);
      }

      return (
        data?.map(ur => ({
          id: ur.id,
          userId: ur.user_id,
          roleId: ur.role_id,
          assignedBy: ur.assigned_by,
          assignedAt: new Date(ur.assigned_at),
          expiresAt: ur.expires_at ? new Date(ur.expires_at) : undefined,
          isActive: ur.is_active,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  }

  /**
   * Get user permissions (both direct and role-based)
   */
  async getUserPermissions(userId: string): Promise<{
    direct: UserPermission[];
    roleBased: string[];
  }> {
    try {
      // Get direct permissions
      const { data: directPermissions, error: directError } =
        await this.supabase
          .from('user_permissions')
          .select(
            `
          id,
          user_id,
          permission_id,
          granted_by,
          granted_at,
          expires_at,
          is_active,
          permissions (
            id,
            name,
            resource,
            action
          )
        `
          )
          .eq('user_id', userId)
          .eq('is_active', true);

      if (directError) {
        throw new Error(
          `Failed to fetch direct permissions: ${directError.message}`
        );
      }

      // Get role-based permissions
      const { data: rolePermissions, error: roleError } = await this.supabase
        .from('user_roles')
        .select(
          `
          roles (
            permissions
          )
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true);

      if (roleError) {
        throw new Error(
          `Failed to fetch role permissions: ${roleError.message}`
        );
      }

      const roleBasedPermissions =
        rolePermissions?.flatMap(rp => rp.roles?.permissions || []) || [];

      return {
        direct:
          directPermissions?.map(up => ({
            id: up.id,
            userId: up.user_id,
            permissionId: up.permission_id,
            grantedBy: up.granted_by,
            grantedAt: new Date(up.granted_at),
            expiresAt: up.expires_at ? new Date(up.expires_at) : undefined,
            isActive: up.is_active,
          })) || [],
        roleBased: roleBasedPermissions,
      };
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }

  /**
   * Grant permission to user
   */
  async grantPermissionToUser(
    userId: string,
    permissionId: string,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<UserPermission> {
    try {
      const { data, error } = await this.supabase
        .from('user_permissions')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          permission_id: permissionId,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt?.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to grant permission: ${error.message}`);
      }

      // Log admin action
      await this.auditLogger.logEvent({
        action: 'permission_granted',
        userId: grantedBy,
        resource: 'user_permission',
        resourceId: data.id,
        details: { userId, permissionId, expiresAt },
      });

      return {
        id: data.id,
        userId: data.user_id,
        permissionId: data.permission_id,
        grantedBy: data.granted_by,
        grantedAt: new Date(data.granted_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        isActive: data.is_active,
      };
    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from user
   */
  async revokePermissionFromUser(
    userId: string,
    permissionId: string,
    revokedBy: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_permissions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('permission_id', permissionId);

      if (error) {
        throw new Error(`Failed to revoke permission: ${error.message}`);
      }

      // Log admin action
      await this.auditLogger.logEvent({
        action: 'permission_revoked',
        userId: revokedBy,
        resource: 'user_permission',
        details: { userId, permissionId },
      });
    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  }

  /**
   * Get access control analytics
   */
  async getAccessControlAnalytics(): Promise<{
    totalRoles: number;
    totalPermissions: number;
    activeUsers: number;
    roleDistribution: { role: string; count: number }[];
    permissionUsage: { permission: string; count: number }[];
  }> {
    try {
      // Get total counts
      const [rolesResult, permissionsResult, usersResult] = await Promise.all([
        this.supabase
          .from('roles')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        this.supabase.from('permissions').select('id', { count: 'exact' }),
        this.supabase
          .from('user_roles')
          .select('user_id', { count: 'exact' })
          .eq('is_active', true),
      ]);

      // Get role distribution
      const { data: roleDistribution } = await this.supabase
        .from('user_roles')
        .select(
          `
          roles (
            name
          )
        `
        )
        .eq('is_active', true);

      const roleCounts =
        roleDistribution?.reduce(
          (acc, ur) => {
            const roleName = ur.roles?.name || 'Unknown';
            acc[roleName] = (acc[roleName] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      // Get permission usage
      const { data: permissionUsage } = await this.supabase
        .from('user_permissions')
        .select(
          `
          permissions (
            name
          )
        `
        )
        .eq('is_active', true);

      const permissionCounts =
        permissionUsage?.reduce(
          (acc, up) => {
            const permissionName = up.permissions?.name || 'Unknown';
            acc[permissionName] = (acc[permissionName] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      return {
        totalRoles: rolesResult.count || 0,
        totalPermissions: permissionsResult.count || 0,
        activeUsers: usersResult.count || 0,
        roleDistribution: Object.entries(roleCounts).map(([role, count]) => ({
          role,
          count,
        })),
        permissionUsage: Object.entries(permissionCounts).map(
          ([permission, count]) => ({ permission, count })
        ),
      };
    } catch (error) {
      console.error('Error fetching access control analytics:', error);
      throw error;
    }
  }
}
