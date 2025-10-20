'use client';

import React, { useState, useEffect } from 'react';
import { DocumentAccess, AccessType } from '@/types/documents';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface AccessPermissionsProps {
  documentId: string;
  permissions: DocumentAccess[];
  onPermissionCreate: (
    userId: string,
    accessType: AccessType,
    expiresAt?: string
  ) => Promise<void>;
  onPermissionUpdate: (
    permissionId: string,
    accessType: AccessType,
    expiresAt?: string,
    isActive?: boolean
  ) => Promise<void>;
  onPermissionDelete: (permissionId: string) => Promise<void>;
}

export function AccessPermissions({
  documentId,
  permissions,
  onPermissionCreate,
  onPermissionUpdate,
  onPermissionDelete,
}: AccessPermissionsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<DocumentAccess | null>(null);
  const [permissionData, setPermissionData] = useState({
    userId: '',
    accessType: 'view' as AccessType,
    expiresAt: '',
  });

  const accessTypeLabels = {
    view: 'View Only',
    comment: 'Comment',
    edit: 'Edit',
    admin: 'Admin',
  };

  const accessTypeColors = {
    view: 'bg-blue-100 text-blue-800',
    comment: 'bg-green-100 text-green-800',
    edit: 'bg-orange-100 text-orange-800',
    admin: 'bg-red-100 text-red-800',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreatePermission = async () => {
    if (!permissionData.userId || !permissionData.accessType) return;

    try {
      await onPermissionCreate(
        permissionData.userId,
        permissionData.accessType,
        permissionData.expiresAt || undefined
      );
      setIsCreateDialogOpen(false);
      setPermissionData({ userId: '', accessType: 'view', expiresAt: '' });
    } catch (error) {
      console.error('Failed to create permission:', error);
    }
  };

  const handleEditPermission = (permission: DocumentAccess) => {
    setSelectedPermission(permission);
    setPermissionData({
      userId: permission.user_id,
      accessType: permission.access_type,
      expiresAt: permission.expires_at || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePermission = async () => {
    if (!selectedPermission) return;

    try {
      await onPermissionUpdate(
        selectedPermission.id,
        permissionData.accessType,
        permissionData.expiresAt || undefined,
        true
      );
      setIsEditDialogOpen(false);
      setSelectedPermission(null);
      setPermissionData({ userId: '', accessType: 'view', expiresAt: '' });
    } catch (error) {
      console.error('Failed to update permission:', error);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      await onPermissionDelete(permissionId);
    } catch (error) {
      console.error('Failed to delete permission:', error);
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiration =
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Access Permissions
          </h2>
          <p className="text-gray-600">
            Manage who can access this document and how
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Permission
        </Button>
      </div>

      {!permissions || permissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No permissions set
            </h3>
            <p className="text-gray-500 text-center">
              Add specific permissions to control document access
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {permissions.map(permission => (
            <Card
              key={permission.id}
              className={!permission.is_active ? 'opacity-50' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">
                        User {permission.user_id}
                      </CardTitle>
                      <CardDescription>
                        Granted by user {permission.granted_by}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={accessTypeColors[permission.access_type]}>
                      {accessTypeLabels[permission.access_type]}
                    </Badge>
                    {!permission.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {isExpired(permission.expires_at) && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {isExpiringSoon(permission.expires_at) &&
                      !isExpired(permission.expires_at) && (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-200"
                        >
                          Expiring Soon
                        </Badge>
                      )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Granted: {formatDate(permission.granted_at)}</span>
                  </div>
                  {permission.expires_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Expires: {formatDate(permission.expires_at)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {permission.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{permission.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPermission(permission)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePermission(permission.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Permission Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Permission
            </DialogTitle>
            <DialogDescription>
              Grant access to this document for a specific user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                value={permissionData.userId}
                onChange={e =>
                  setPermissionData({
                    ...permissionData,
                    userId: e.target.value,
                  })
                }
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <Label htmlFor="access-type">Access Type</Label>
              <Select
                value={permissionData.accessType}
                onValueChange={value =>
                  setPermissionData({
                    ...permissionData,
                    accessType: value as AccessType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expires-at">Expires At (Optional)</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={permissionData.expiresAt}
                onChange={e =>
                  setPermissionData({
                    ...permissionData,
                    expiresAt: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePermission}
              disabled={!permissionData.userId || !permissionData.accessType}
            >
              Add Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Permission
            </DialogTitle>
            <DialogDescription>
              Update the access permissions for this user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-access-type">Access Type</Label>
              <Select
                value={permissionData.accessType}
                onValueChange={value =>
                  setPermissionData({
                    ...permissionData,
                    accessType: value as AccessType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-expires-at">Expires At (Optional)</Label>
              <Input
                id="edit-expires-at"
                type="datetime-local"
                value={permissionData.expiresAt}
                onChange={e =>
                  setPermissionData({
                    ...permissionData,
                    expiresAt: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePermission}>Update Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
