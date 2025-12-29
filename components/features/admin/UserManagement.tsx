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
  CheckCircle,
} from 'lucide-react';
import DataTable, { StatusBadge, DateCell, EmailCell } from './DataTable';
import { UserProfileModal } from './UserProfileModal';

interface User {
  id: string;
  email: string;
  role: 'event_manager' | 'contractor' | 'admin';
  is_verified: boolean;
  status?: 'active' | 'suspended' | 'deleted'; // Optional since it doesn't exist in DB
  verification_status?: 'onboarding' | 'pending' | 'approved' | 'rejected';
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
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(
    null
  );
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);

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
      setIsLoading(true);
      // Verify, unverify, suspend, and unsuspend endpoints use POST, others use PUT
      const method =
        action === 'verify' ||
        action === 'unverify' ||
        action === 'suspend' ||
        action === 'unsuspend'
          ? 'POST'
          : 'PUT';

      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros', // Same token as users list
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (response.ok) {
        await loadUsers();
        onUserUpdate?.(userId, data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Failed to ${action} user:`, errorData);
        alert(
          `Failed to ${action} user: ${errorData.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(
        `Error ${action}ing user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-secure-token-2024-eventpros',
        },
        body: JSON.stringify(updateForm),
      });

      if (response.ok) {
        await loadUsers();
        onUserUpdate?.(selectedUser.id, updateForm);
        setIsUpdateDialogOpen(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update user:', errorData);
        alert(`Failed to update user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(
        `Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openUpdateDialog = (user: User) => {
    setSelectedUser(user);
    setUpdateForm({
      status: user.status || 'active',
      role: user.role,
    });
    setIsUpdateDialogOpen(true);
  };

  const handleEmailClick = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setProfileModalOpen(true);
  };

  const columns = [
    {
      key: 'email',
      label: 'User',
      render: (value: string, row: User) => {
        const firstName = row.profiles?.first_name || '';
        const lastName = row.profiles?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const avatarUrl = row.profiles?.avatar_url;
        const initials = fullName
          ? `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase()
          : value.charAt(0).toUpperCase();

        return (
          <div className="flex items-center gap-3">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || value}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  onError={e => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 border border-gray-300">${initials}</div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 border border-gray-300">
                  {initials}
                </div>
              )}
            </div>

            {/* Name and Email */}
            <div className="flex flex-col min-w-0">
              {fullName && (
                <span className="font-medium text-gray-900 mb-1 truncate">
                  {fullName}
                </span>
              )}
              <EmailCell
                email={value}
                userId={row.id}
                onClick={handleEmailClick}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      label: 'Role',
      render: (value: string) => (
        <Badge variant="outline">{value.replace('_', ' ').toUpperCase()}</Badge>
      ),
    },
    {
      key: 'verification_status',
      label: 'Status',
      render: (value: string, row: User) => {
        // Show account status (suspended) if applicable, otherwise show verification status
        if (row.status === 'suspended') {
          return <StatusBadge status="suspended" />;
        }
        return (
          <StatusBadge
            status={
              row.verification_status ||
              (row.is_verified ? 'approved' : 'pending')
            }
          />
        );
      },
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
      render: (value: any, row: User) => {
        const companyName = row.business_profiles?.company_name;
        const logoUrl = row.business_profiles?.logo_url;
        const companyInitials = companyName
          ? companyName
              .split(' ')
              .map((word: string) => word.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : '';

        if (!companyName) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <div className="flex items-center gap-2">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  onError={e => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-300">${companyInitials}</div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-300">
                  {companyInitials}
                </div>
              )}
            </div>
            {/* Company Name */}
            <span className="font-medium">{companyName}</span>
          </div>
        );
      },
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
        onClick={() => {
          setSelectedUserId(user.id);
          setSelectedUserEmail(user.email);
          setProfileModalOpen(true);
        }}
      >
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </DropdownMenuItem>
      {(user.status || 'active') === 'active' ? (
        <DropdownMenuItem
          onClick={() => {
            setUserToSuspend(user);
            setSuspendReason('');
            setSuspendDialogOpen(true);
          }}
          className="text-yellow-600"
        >
          <UserX className="h-4 w-4 mr-2" />
          Suspend
        </DropdownMenuItem>
      ) : user.status === 'suspended' ? (
        <DropdownMenuItem
          onClick={() => handleUserAction(user.id, 'unsuspend')}
          className="text-green-600"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Unsuspend
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
      {user.is_verified && (
        <DropdownMenuItem
          onClick={() => handleUserAction(user.id, 'unverify')}
          className="text-orange-600"
        >
          <Shield className="h-4 w-4 mr-2" />
          Unverify
        </DropdownMenuItem>
      )}
    </>
  );

  const handleSuspendConfirm = async () => {
    if (!userToSuspend || !suspendReason.trim()) {
      alert('Please provide a suspension reason');
      return;
    }

    await handleUserAction(userToSuspend.id, 'suspend', {
      reason: suspendReason.trim(),
    });
    setSuspendDialogOpen(false);
    setSuspendReason('');
    setUserToSuspend(null);
  };

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

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this user. This reason will
              be shown to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="suspend-reason">Suspension Reason</Label>
              <textarea
                id="suspend-reason"
                className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md"
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Enter the reason for suspension..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialogOpen(false);
                setSuspendReason('');
                setUserToSuspend(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspendConfirm}
              disabled={!suspendReason.trim()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedUserId}
        userEmail={selectedUserEmail}
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setSelectedUserId(null);
          setSelectedUserEmail(null);
        }}
      />
    </div>
  );
}
