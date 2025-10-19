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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Users,
  MessageSquare,
  StickyNote,
  Bell,
  Search,
  Download,
  Clock,
  Plus,
  Filter,
  MoreHorizontal,
} from 'lucide-react';
import { ContactManagement } from './ContactManagement';
import { MessageTracking } from './MessageTracking';
import { NotesAndTags } from './NotesAndTags';
import { FollowUpReminders } from './FollowUpReminders';
import { ContactSearch } from './ContactSearch';
import { ContactExport } from './ContactExport';
import { ActivityTimeline } from './ActivityTimeline';

interface CRMStats {
  totalContacts: number;
  activeContacts: number;
  totalInteractions: number;
  pendingReminders: number;
  recentActivity: number;
}

interface BasicCRMProps {
  className?: string;
}

export function BasicCRM({ className = '' }: BasicCRMProps) {
  const [activeTab, setActiveTab] = useState('contacts');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CRMStats | null>(null);

  // Load CRM stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        // Try to fetch stats from API
        const response = await fetch('/api/crm/stats');
        if (!response.ok) {
          throw new Error('Failed to load CRM statistics');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError('Failed to load CRM statistics');
        // Set fallback stats even on error
        setStats({
          totalContacts: 0,
          activeContacts: 0,
          totalInteractions: 0,
          pendingReminders: 0,
          recentActivity: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your business relationships and interactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contacts
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContacts}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.recentActivity} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Contacts
              </CardTitle>
              <Badge variant="secondary">Active</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeContacts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalContacts > 0
                  ? Math.round(
                      (stats.activeContacts / stats.totalContacts) * 100
                    )
                  : 0}
                % of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Interactions
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalInteractions}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reminders
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReminders}</div>
              <p className="text-xs text-muted-foreground">Due soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="ml-2"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        <div className="grid w-full grid-cols-7">
          <button
            onClick={() => handleTabChange('contacts')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'contacts'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </button>
          <button
            onClick={() => handleTabChange('messages')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'messages'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </button>
          <button
            onClick={() => handleTabChange('notes')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'notes'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <StickyNote className="h-4 w-4 mr-2" />
            Notes
          </button>
          <button
            onClick={() => handleTabChange('reminders')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'reminders'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Bell className="h-4 w-4 mr-2" />
            Reminders
          </button>
          <button
            onClick={() => handleTabChange('search')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'search'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </button>
          <button
            onClick={() => handleTabChange('export')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'export'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => handleTabChange('timeline')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'timeline'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </button>
        </div>

        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <ContactManagement />
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            <MessageTracking />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <NotesAndTags />
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-4">
            <FollowUpReminders />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <ContactSearch />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-4">
            <ContactExport />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <ActivityTimeline />
          </div>
        )}
      </div>
    </div>
  );
}
