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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Shield,
  Eye,
  Edit,
} from 'lucide-react';
import DataTable, { StatusBadge, DateCell, EmailCell } from './DataTable';

interface User {
  id: string;
  email: string;
  role: 'event_manager' | 'contractor' | 'admin';
  is_verified: boolean;
  status?: 'active' | 'suspended' | 'deleted'; // Optional since it doesn't exist in DB
  last_login: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  business_profiles?: {
    company_name: string;
    subscription_tier: string;
  };
}

interface UserManagementProps {
  onUserUpdate?: (userId: string, updates: Partial<User>) => void;
}

export default function UserManagement({ onUserUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: 'active' as 'active' | 'suspended' | 'deleted',
    role: 'event_manager' as 'event_manager' | 'contractor' | 'admin',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: '',
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.role !== 'all' && { role: filters.role }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(prev => ({
          ...prev,
          total: data.total,
        }));
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [pagination.page, pagination.limit, filters]);

  const handleUserAction = async (
    userId: string,
    action: string,
    data?: any
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadUsers();
        onUserUpdate?.(userId, data);
      }
    } catch (error) {}
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    await handleUserAction(selectedUser.id, 'update', updateForm);
    setIsUpdateDialogOpen(false);
    setSelectedUser(null);
  };

  const openUpdateDialog = (user: User) => {
    setSelectedUser(user);
    setUpdateForm({
      status: user.status || 'active',
      role: user.role,
    });
    setIsUpdateDialogOpen(true);
  };

  const columns = [
    {
      key: 'email',
      label: 'Email',
      render: (value: string) => <EmailCell email={value} />,
    },
    {
      key: 'profiles.first_name',
      label: 'Name',
      render: (value: any, row: User) => (
        <div>
          {row.profiles?.first_name} {row.profiles?.last_name}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (value: string) => (
        <Badge variant="outline">{value.replace('_', ' ').toUpperCase()}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value || 'active'} />,
    },
    {
      key: 'is_verified',
      label: 'Verified',
      render: (value: boolean) => (
        <StatusBadge status={value ? 'verified' : 'unverified'} />
      ),
    },
    {
      key: 'business_profiles.company_name',
      label: 'Company',
      render: (value: any, row: User) => (
        <span>{row.business_profiles?.company_name || '-'}</span>
      ),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (value: string | null) =>
        value ? (
          <DateCell date={value} />
        ) : (
          <span className="text-muted-foreground">Never</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: string) => <DateCell date={value} />,
    },
  ];

  const getRowActions = (user: User) => (
    <>
      <DropdownMenuItem onClick={() => openUpdateDialog(user)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
      >
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </DropdownMenuItem>
      {(user.status || 'active') === 'active' ? (
        <DropdownMenuItem
          onClick={() => handleUserAction(user.id, 'suspend')}
          className="text-yellow-600"
        >
          <UserX className="h-4 w-4 mr-2" />
          Suspend
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          onClick={() => handleUserAction(user.id, 'activate')}
          className="text-green-600"
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Activate
        </DropdownMenuItem>
      )}
      {!user.is_verified && user.role === 'contractor' && (
        <DropdownMenuItem
          onClick={() => handleUserAction(user.id, 'verify')}
          className="text-blue-600"
        >
          <Shield className="h-4 w-4 mr-2" />
          Verify
        </DropdownMenuItem>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select
                value={filters.role}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="event_manager">Event Managers</SelectItem>
                  <SelectItem value="contractor">Contractors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search users..."
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
              />
            </div>

            <div className="flex items-end">
              <Button onClick={loadUsers} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
            pagination={{
              ...pagination,
              onPageChange: page => setPagination(prev => ({ ...prev, page })),
              onLimitChange: limit =>
                setPagination(prev => ({ ...prev, limit, page: 1 })),
            }}
            actions={getRowActions}
            searchable={false}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      {/* Update User Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>
              Update user status and role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateForm.status}
                onValueChange={value =>
                  setUpdateForm(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={updateForm.role}
                onValueChange={value =>
                  setUpdateForm(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event_manager">Event Manager</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
