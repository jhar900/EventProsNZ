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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarIcon,
  FileIcon,
  ShareIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FileAccessPermission {
  id: string;
  file_id: string;
  user_id: string;
  access_level: 'read' | 'write' | 'admin';
  expires_at?: string;
  created_at: string;
  is_active: boolean;
  user_email?: string;
  file_name?: string;
}

interface FileAccessControlProps {
  fileId?: string;
  userId?: string;
}

export default function FileAccessControl({
  fileId,
  userId,
}: FileAccessControlProps) {
  const [permissions, setPermissions] = useState<FileAccessPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<'read' | 'write' | 'admin'>(
    'read'
  );
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('permissions');

  // Load permissions on component mount
  useEffect(() => {
    loadPermissions();
  }, [fileId, userId]);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (fileId) params.append('file_id', fileId);
      if (userId) params.append('user_id', userId);

      const response = await fetch(`/api/access/file-permissions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load file permissions');
      }

      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load permissions'
      );
    } finally {
      setLoading(false);
    }
  };

  const createPermission = async () => {
    if (!selectedFile || !selectedUser) {
      setError('Please select both file and user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/access/file-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: selectedFile,
          user_id: selectedUser,
          access_level: accessLevel,
          expires_at: expirationDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create permission');
      }

      setSuccess('File access permission created successfully');
      setIsDialogOpen(false);
      loadPermissions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create permission'
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (
    permissionId: string,
    updates: Partial<FileAccessPermission>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/access/file-permissions/${permissionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update permission');
      }

      setSuccess('File access permission updated successfully');
      loadPermissions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update permission'
      );
    } finally {
      setLoading(false);
    }
  };

  const deletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/access/file-permissions/${permissionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete permission');
      }

      setSuccess('File access permission deleted successfully');
      loadPermissions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete permission'
      );
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelBadge = (level: string) => {
    const variants = {
      read: 'secondary',
      write: 'default',
      admin: 'destructive',
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'secondary'}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (permission: FileAccessPermission) => {
    if (!permission.is_active) {
      return <AlertTriangleIcon className="h-4 w-4 text-red-500" />;
    }

    if (permission.expires_at && new Date(permission.expires_at) < new Date()) {
      return <ClockIcon className="h-4 w-4 text-yellow-500" />;
    }

    return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            File Access Control
          </CardTitle>
          <CardDescription>
            Manage file access permissions and sharing controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="sharing">Sharing</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">File Access Permissions</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Grant Access
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Grant File Access</DialogTitle>
                      <DialogDescription>
                        Grant access permissions to a user for a specific file
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="file-select">File</Label>
                        <Input
                          id="file-select"
                          value={selectedFile}
                          onChange={e => setSelectedFile(e.target.value)}
                          placeholder="Enter file ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-select">User</Label>
                        <Input
                          id="user-select"
                          value={selectedUser}
                          onChange={e => setSelectedUser(e.target.value)}
                          placeholder="Enter user ID or email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="access-level">Access Level</Label>
                        <Select
                          value={accessLevel}
                          onValueChange={(value: 'read' | 'write' | 'admin') =>
                            setAccessLevel(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="write">Write</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Expiration Date (Optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !expirationDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {expirationDate
                                ? format(expirationDate, 'PPP')
                                : 'Pick a date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={expirationDate}
                              onSelect={setExpirationDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={createPermission} disabled={loading}>
                          {loading ? 'Creating...' : 'Grant Access'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map(permission => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">
                        {permission.file_name || permission.file_id}
                      </TableCell>
                      <TableCell>
                        {permission.user_email || permission.user_id}
                      </TableCell>
                      <TableCell>
                        {getAccessLevelBadge(permission.access_level)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(permission)}
                          <span className="text-sm">
                            {permission.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {permission.expires_at
                          ? format(
                              new Date(permission.expires_at),
                              'MMM dd, yyyy'
                            )
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(permission.created_at),
                          'MMM dd, yyyy'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updatePermission(permission.id, {
                                is_active: !permission.is_active,
                              })
                            }
                          >
                            {permission.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePermission(permission.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {permissions.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No file access permissions found
                </div>
              )}
            </TabsContent>

            <TabsContent value="sharing" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <ShieldIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>File sharing controls and bulk operations coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>File access analytics and reporting coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
