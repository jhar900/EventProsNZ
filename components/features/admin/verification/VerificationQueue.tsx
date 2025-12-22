'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  User,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'event_manager' | 'contractor' | 'admin';
  is_verified: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected' | 'onboarding'; // Explicit status from API
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
  };
  business_profiles?: {
    company_name: string;
    business_address?: string;
    nzbn?: string;
    description?: string;
    service_areas?: string[];
    is_verified: boolean;
  };
}

interface VerificationQueueProps {
  onUserSelect: (user: User) => void;
}

export function VerificationQueue({ onUserSelect }: VerificationQueueProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected' | 'onboarding'
  >('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, currentPage]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      console.log(
        '[VerificationQueue] Fetching users with params:',
        params.toString()
      );
      console.log('[VerificationQueue] Cookies available:', {
        cookieCount: document.cookie.split(';').length,
        cookieNames: document.cookie
          .split(';')
          .map(c => c.split('=')[0].trim()),
      });

      const response = await fetch(`/api/admin/verification/queue?${params}`, {
        credentials: 'include', // Include cookies for authentication
      });

      console.log('[VerificationQueue] Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[VerificationQueue] Successfully fetched users:', {
          count: data.verifications?.length || 0,
          total: data.total,
        });
        // Debug: log first user's profile structure
        if (data.verifications && data.verifications.length > 0) {
          console.log('[VerificationQueue] First user from API:', {
            id: data.verifications[0].id,
            profiles: data.verifications[0].profiles,
            avatar_url: data.verifications[0].profiles?.avatar_url,
          });
        }
        setUsers(data.verifications);
        setTotalCount(data.total);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        console.error('[VerificationQueue] API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        setError(errorData.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('[VerificationQueue] Fetch error:', error);
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const fullName =
      `${user.profiles.first_name} ${user.profiles.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const companyName =
      user.business_profiles?.company_name?.toLowerCase() || '';

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      companyName.includes(searchLower)
    );
  });

  const getStatusBadge = (user: User) => {
    // Use explicit verification_status if available, otherwise fall back to is_verified
    const status =
      user.verification_status || (user.is_verified ? 'approved' : 'pending');

    if (status === 'approved') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (status === 'rejected') {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    } else if (status === 'onboarding') {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Onboarding
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      event_manager: 'bg-blue-100 text-blue-800',
      contractor: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    };

    return (
      <Badge
        className={
          roleColors[role as keyof typeof roleColors] ||
          'bg-gray-100 text-gray-800'
        }
      >
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchUsers} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="onboarding">Onboarding</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Users List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onUserSelect(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {(() => {
                          // Handle both array and object formats
                          const profile = Array.isArray(user.profiles)
                            ? user.profiles[0]
                            : user.profiles;
                          const avatarUrl = profile?.avatar_url;

                          return avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${profile?.first_name || ''} ${profile?.last_name || ''}`}
                              className="h-12 w-12 rounded-full object-cover"
                              onError={e => {
                                // Fallback to icon if image fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-600" />
                          );
                        })()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {user.profiles.first_name} {user.profiles.last_name}
                          </h3>
                          {getStatusBadge(user)}
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.business_profiles && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {user.business_profiles.company_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.created_at)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
