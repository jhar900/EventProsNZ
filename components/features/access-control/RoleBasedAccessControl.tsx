'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, Shield, Users, Key } from 'lucide-react';
import {
  AccessControlService,
  Role,
  Permission,
  UserRole,
} from '@/lib/security/access-control-service';

interface RoleBasedAccessControlProps {
  userId?: string;
  isAdmin?: boolean;
}

export function RoleBasedAccessControl({
  userId,
  isAdmin = false,
}: RoleBasedAccessControlProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const accessControlService = new AccessControlService();

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesData, permissionsData] = await Promise.all([
        accessControlService.getRoles(),
        accessControlService.getPermissions(),
      ]);

      setRoles(rolesData);
      setPermissions(permissionsData);

      if (userId) {
        const userRolesData = await accessControlService.getUserRoles(userId);
        setUserRoles(userRolesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!roleForm.name.trim()) {
        setError('Role name is required');
        return;
      }

      await accessControlService.createRole(roleForm, userId || 'system');

      setSuccess('Role created successfully');
      setShowCreateRole(false);
      setRoleForm({ name: '', description: '', permissions: [] });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      setError(null);
      setSuccess(null);

      await accessControlService.updateRole(
        editingRole.id,
        roleForm,
        userId || 'system'
      );

      setSuccess('Role updated successfully');
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      setError(null);
      setSuccess(null);

      await accessControlService.deleteRole(roleId, userId || 'system');

      setSuccess('Role deleted successfully');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const handleAssignRole = async (roleId: string) => {
    if (!userId) return;

    try {
      setError(null);
      setSuccess(null);

      await accessControlService.assignRoleToUser(userId, roleId, userId);

      setSuccess('Role assigned successfully');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!userId) return;

    try {
      setError(null);
      setSuccess(null);

      await accessControlService.removeRoleFromUser(userId, roleId, userId);

      setSuccess('Role removed successfully');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    }
  };

  const startEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setShowCreateRole(false);
    setRoleForm({ name: '', description: '', permissions: [] });
  };

  const togglePermission = (permissionId: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* User Roles Section */}
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Roles
            </CardTitle>
            <CardDescription>
              Current roles assigned to this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userRoles.length === 0 ? (
              <p className="text-muted-foreground">No roles assigned</p>
            ) : (
              <div className="space-y-2">
                {userRoles.map(userRole => {
                  const role = roles.find(r => r.id === userRole.roleId);
                  return (
                    <div
                      key={userRole.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <Badge variant="secondary">
                          {role?.name || 'Unknown Role'}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {role?.description}
                        </p>
                        {userRole.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Expires:{' '}
                            {new Date(userRole.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRole(userRole.roleId)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Roles Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Available Roles
          </CardTitle>
          <CardDescription>Manage system roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Roles: {roles.length}</p>
              <p className="text-sm text-muted-foreground">
                {roles.filter(r => r.isActive).length} active
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreateRole(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{role.name}</h3>
                      <Badge variant={role.isActive ? 'default' : 'secondary'}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {role.permissions.slice(0, 5).map(permission => (
                        <Badge
                          key={permission}
                          variant="outline"
                          className="text-xs"
                        >
                          {permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {userId && !userRoles.some(ur => ur.roleId === role.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignRole(role.id)}
                      >
                        Assign
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Role Form */}
      {(showCreateRole || editingRole) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </CardTitle>
            <CardDescription>
              Define role permissions and access levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={roleForm.name}
                  onChange={e =>
                    setRoleForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter role name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  value={roleForm.description}
                  onChange={e =>
                    setRoleForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter role description"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(
                  ([resource, resourcePermissions]) => (
                    <div key={resource} className="space-y-2">
                      <h4 className="font-medium capitalize">{resource}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {resourcePermissions.map(permission => (
                          <div
                            key={permission.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={roleForm.permissions.includes(
                                permission.id
                              )}
                              onCheckedChange={() =>
                                togglePermission(permission.id)
                              }
                            />
                            <Label
                              htmlFor={`permission-${permission.id}`}
                              className="text-sm font-normal"
                            >
                              {permission.action}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                onClick={editingRole ? handleUpdateRole : handleCreateRole}
                disabled={!roleForm.name.trim()}
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
