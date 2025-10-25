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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Search,
  Settings,
  Mail,
  Shield,
  CreditCard,
  Activity,
  Flag,
  MessageSquare,
  BarChart3,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

import AdvancedUserSearch from './AdvancedUserSearch';
import BulkUserActions from './BulkUserActions';
import UserVerificationWorkflow from './UserVerificationWorkflow';
import SubscriptionManagement from './SubscriptionManagement';
import UserCommunicationTools from './UserCommunicationTools';
import UserActivityMonitor from './UserActivityMonitor';
import ContentModeration from './ContentModeration';
import UserFeedbackManagement from './UserFeedbackManagement';
import CustomerSupportIntegration from './CustomerSupportIntegration';
import UserSegmentation from './UserSegmentation';
import AdvancedReporting from './AdvancedReporting';
import AdminCRM from './AdminCRM';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  is_verified: boolean;
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

interface SearchFilters {
  search: string;
  role: string;
  status: string;
  verification: string;
  subscription: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  location: string;
  company: string;
  lastLogin: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
}

export default function AdvancedUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setIsLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [activeTab, setActiveTab] = useState('search');

  // Load saved searches
  useEffect(() => {
    const loadSavedSearches = async () => {
      try {
        const response = await fetch('/api/admin/users/saved-searches');
        if (response.ok) {
          const data = await response.json();
          setSavedSearches(data.searches || []);
        }
      } catch (error) {
        // Error handled
      }
    };

    loadSavedSearches();
  }, []);

  const handleSearch = async (filters: SearchFilters) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      // Convert filters to URL parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'dateRange') {
            if (value.from) params.set('dateFrom', value.from.toISOString());
            if (value.to) params.set('dateTo', value.to.toISOString());
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSearch = async (search: SavedSearch) => {
    try {
      const response = await fetch('/api/admin/users/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(search),
      });

      if (response.ok) {
        setSavedSearches(prev => [...prev, search]);
      }
    } catch (error) {
      // Error handled
    }
  };

  const handleLoadSearch = async (searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId);
    if (search) {
      await handleSearch(search.filters);
    }
  };

  const handleBulkAction = async (
    action: string,
    userIds: string[],
    data?: any
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          user_ids: userIds,
          data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Bulk action result:', result);

        // Refresh users list
        await handleSearch({} as SearchFilters);

        // Clear selection
        setSelectedUsers([]);
      }
    } catch (error) {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelection = (user: User, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, user]);
    } else {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers([...users]);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const handleUserUpdate = (userId: string, updates: Partial<User>) => {
    setUsers(prev =>
      prev.map(user => (user.id === userId ? { ...user, ...updates } : user))
    );
  };

  const getTabIcon = (tab: string) => {
    const icons = {
      search: Search,
      bulk: Users,
      verification: Shield,
      subscription: CreditCard,
      communication: Mail,
      activity: Activity,
      moderation: Flag,
      feedback: MessageSquare,
      support: AlertTriangle,
      segmentation: UserCheck,
      reporting: BarChart3,
      crm: Settings,
    };

    const Icon = icons[tab as keyof typeof icons] || Users;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Advanced User Management
              </CardTitle>
              <CardDescription>
                Comprehensive user management with advanced search, bulk
                actions, and analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{users.length} Users</Badge>
              {selectedUsers.length > 0 && (
                <Badge variant="default">{selectedUsers.length} Selected</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12">
          <TabsTrigger value="search" className="flex items-center gap-2">
            {getTabIcon('search')}
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            {getTabIcon('bulk')}
            <span className="hidden sm:inline">Bulk Actions</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            {getTabIcon('verification')}
            <span className="hidden sm:inline">Verification</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            {getTabIcon('subscription')}
            <span className="hidden sm:inline">Subscriptions</span>
          </TabsTrigger>
          <TabsTrigger
            value="communication"
            className="flex items-center gap-2"
          >
            {getTabIcon('communication')}
            <span className="hidden sm:inline">Communication</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            {getTabIcon('activity')}
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            {getTabIcon('moderation')}
            <span className="hidden sm:inline">Moderation</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            {getTabIcon('feedback')}
            <span className="hidden sm:inline">Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            {getTabIcon('support')}
            <span className="hidden sm:inline">Support</span>
          </TabsTrigger>
          <TabsTrigger value="segmentation" className="flex items-center gap-2">
            {getTabIcon('segmentation')}
            <span className="hidden sm:inline">Segmentation</span>
          </TabsTrigger>
          <TabsTrigger value="reporting" className="flex items-center gap-2">
            {getTabIcon('reporting')}
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="crm" className="flex items-center gap-2">
            {getTabIcon('crm')}
            <span className="hidden sm:inline">CRM</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <AdvancedUserSearch
            onSearch={handleSearch}
            onSaveSearch={handleSaveSearch}
            onLoadSearch={handleLoadSearch}
            savedSearches={savedSearches}
            loading={loading}
          />

          {/* Users List */}
          {users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>{users.length} users found</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Users table would go here */}
                <div className="text-center py-8 text-muted-foreground">
                  Users list component would be implemented here
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          {selectedUsers.length > 0 ? (
            <BulkUserActions
              selectedUsers={selectedUsers}
              onAction={handleBulkAction}
              onClearSelection={handleClearSelection}
              loading={loading}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Users Selected</h3>
                <p className="text-muted-foreground">
                  Select users from the search results to perform bulk actions
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <UserVerificationWorkflow
            onApprove={async (requestId, notes) => {
              console.log('Approve verification:', requestId, notes);
            }}
            onReject={async (requestId, reason, notes) => {
              console.log('Reject verification:', requestId, reason, notes);
            }}
            onResubmit={async requestId => {
              console.log('Resubmit verification:', requestId);
            }}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionManagement
            onModifySubscription={async (userId, modification) => {
              console.log('Modify subscription:', userId, modification);
            }}
            onCancelSubscription={async (userId, reason) => {
              console.log('Cancel subscription:', userId, reason);
            }}
            onReactivateSubscription={async userId => {
              console.log('Reactivate subscription:', userId);
            }}
            onExtendSubscription={async (userId, days) => {
              console.log('Extend subscription:', userId, days);
            }}
            onRefundSubscription={async (userId, amount, reason) => {
              console.log('Refund subscription:', userId, amount, reason);
            }}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <UserCommunicationTools
            onSendCommunication={async communication => {
              console.log('Send communication:', communication);
            }}
            onScheduleCommunication={async (communication, scheduledAt) => {
              console.log(
                'Schedule communication:',
                communication,
                scheduledAt
              );
            }}
            onUpdateTemplate={async (templateId, template) => {
              console.log('Update template:', templateId, template);
            }}
            onDeleteTemplate={async templateId => {
              console.log('Delete template:', templateId);
            }}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <UserActivityMonitor />
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <ContentModeration />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <UserFeedbackManagement />
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <CustomerSupportIntegration />
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-6">
          <UserSegmentation />
        </TabsContent>

        <TabsContent value="reporting" className="space-y-6">
          <AdvancedReporting />
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <AdminCRM />
        </TabsContent>
      </Tabs>
    </div>
  );
}
