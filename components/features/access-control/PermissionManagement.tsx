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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, Key, Search, Filter } from 'lucide-react';
import {
  AccessControlService,
  Permission,
  UserPermission,
} from '@/lib/security/access-control-service';

interface PermissionManagementProps {
  userId?: string;
  isAdmin?: boolean;
}

export function PermissionManagement({
  userId,
  isAdmin = false,
}: PermissionManagementProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showCreatePermission, setShowCreatePermission] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    resource: '',
    action: '',
    description: '',
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const accessControlService = new AccessControlService();

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const permissionsData = await accessControlService.getPermissions();
      setPermissions(permissionsData);

      if (userId) {
        const userPermissionsData =
          await accessControlService.getUserPermissions(userId);
        setUserPermissions(userPermissionsData.direct);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (
        !permissionForm.name.trim() ||
        !permissionForm.resource.trim() ||
        !permissionForm.action.trim()
      ) {
        setError('All fields are required');
        return;
      }

      // Check if permission already exists
      const existingPermission = permissions.find(
        p =>
          p.name === permissionForm.name ||
          (p.resource === permissionForm.resource &&
            p.action === permissionForm.action)
      );

      if (existingPermission) {
        setError(
          'Permission with this name or resource/action combination already exists'
        );
        return;
      }

      // Create permission via API
      const response = await fetch('/api/access/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissionForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create permission');
      }

      setSuccess('Permission created successfully');
      setShowCreatePermission(false);
      setPermissionForm({
        name: '',
        resource: '',
        action: '',
        description: '',
      });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create permission'
      );
    }
  };

  const handleUpdatePermission = async () => {
    if (!editingPermission) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/access/permissions/${editingPermission.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(permissionForm),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update permission');
      }

      setSuccess('Permission updated successfully');
      setEditingPermission(null);
      setPermissionForm({
        name: '',
        resource: '',
        action: '',
        description: '',
      });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update permission'
      );
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/access/permissions/${permissionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete permission');
      }

      setSuccess('Permission deleted successfully');
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete permission'
      );
    }
  };

  const handleGrantPermission = async (permissionId: string) => {
    if (!userId) return;

    try {
      setError(null);
      setSuccess(null);

      await accessControlService.grantPermissionToUser(
        userId,
        permissionId,
        userId
      );

      setSuccess('Permission granted successfully');
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to grant permission'
      );
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!userId) return;

    try {
      setError(null);
      setSuccess(null);

      await accessControlService.revokePermissionFromUser(
        userId,
        permissionId,
        userId
      );

      setSuccess('Permission revoked successfully');
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to revoke permission'
      );
    }
  };

  const startEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setPermissionForm({
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    });
  };

  const cancelEdit = () => {
    setEditingPermission(null);
    setShowCreatePermission(false);
    setPermissionForm({ name: '', resource: '', action: '', description: '' });
  };

  // Filter permissions
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource =
      resourceFilter === 'all' || permission.resource === resourceFilter;
    const matchesAction =
      actionFilter === 'all' || permission.action === actionFilter;

    return matchesSearch && matchesResource && matchesAction;
  });

  const uniqueResources = [...new Set(permissions.map(p => p.resource))];
  const uniqueActions = [...new Set(permissions.map(p => p.action))];

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

      {/* User Permissions Section */}
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              User Permissions
            </CardTitle>
            <CardDescription>
              Direct permissions assigned to this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userPermissions.length === 0 ? (
              <p className="text-muted-foreground">
                No direct permissions assigned
              </p>
            ) : (
              <div className="space-y-2">
                {userPermissions.map(userPermission => {
                  const permission = permissions.find(
                    p => p.id === userPermission.permissionId
                  );
                  return (
                    <div
                      key={userPermission.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <Badge variant="secondary">
                          {permission?.name || 'Unknown Permission'}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {permission?.resource}:{permission?.action}
                        </p>
                        {userPermission.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Expires:{' '}
                            {new Date(
                              userPermission.expiresAt
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRevokePermission(userPermission.permissionId)
                        }
                      >
                        Revoke
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Permissions Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Permission Management
          </CardTitle>
          <CardDescription>
            Manage system permissions and access controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResources.map(resource => (
                  <SelectItem key={resource} value={resource}>
                    {resource}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Total Permissions: {permissions.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Showing {filteredPermissions.length} permissions
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreatePermission(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Permission
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {filteredPermissions.map(permission => (
              <div key={permission.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{permission.name}</h3>
                      <Badge variant="outline">{permission.resource}</Badge>
                      <Badge variant="secondary">{permission.action}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {userId &&
                      !userPermissions.some(
                        up => up.permissionId === permission.id
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGrantPermission(permission.id)}
                        >
                          Grant
                        </Button>
                      )}
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditPermission(permission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePermission(permission.id)}
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

      {/* Create/Edit Permission Form */}
      {(showCreatePermission || editingPermission) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPermission ? 'Edit Permission' : 'Create New Permission'}
            </CardTitle>
            <CardDescription>
              Define permission details and access levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permission-name">Permission Name</Label>
                <Input
                  id="permission-name"
                  value={permissionForm.name}
                  onChange={e =>
                    setPermissionForm(prev => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g., users:read"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permission-resource">Resource</Label>
                <Input
                  id="permission-resource"
                  value={permissionForm.resource}
                  onChange={e =>
                    setPermissionForm(prev => ({
                      ...prev,
                      resource: e.target.value,
                    }))
                  }
                  placeholder="e.g., users"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permission-action">Action</Label>
                <Input
                  id="permission-action"
                  value={permissionForm.action}
                  onChange={e =>
                    setPermissionForm(prev => ({
                      ...prev,
                      action: e.target.value,
                    }))
                  }
                  placeholder="e.g., read"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="permission-description">Description</Label>
                <Input
                  id="permission-description"
                  value={permissionForm.description}
                  onChange={e =>
                    setPermissionForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of this permission"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                onClick={
                  editingPermission
                    ? handleUpdatePermission
                    : handleCreatePermission
                }
                disabled={
                  !permissionForm.name.trim() ||
                  !permissionForm.resource.trim() ||
                  !permissionForm.action.trim()
                }
              >
                {editingPermission ? 'Update Permission' : 'Create Permission'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
