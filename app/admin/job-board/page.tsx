'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JobModerationDashboard from '@/components/features/admin/JobModerationDashboard';
import AdminAnalyticsDashboard from '@/components/features/admin/AdminAnalyticsDashboard';
import UserActivityMonitor from '@/components/features/admin/UserActivityMonitor';
import ApplicationConversionTracker from '@/components/features/admin/ApplicationConversionTracker';
import ReportGenerator from '@/components/features/admin/ReportGenerator';
import GeographicAnalytics from '@/components/features/admin/GeographicAnalytics';
import UserSatisfactionTracker from '@/components/features/admin/UserSatisfactionTracker';
import {
  Briefcase,
  BarChart3,
  Users,
  TrendingUp,
  FileText,
  MapPin,
  Star,
} from 'lucide-react';

export default function AdminJobBoardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('moderation');

  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Job Board Management
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Comprehensive job board analytics, moderation, and management
                  tools
                </p>
              </div>

              {/* Navigation Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger
                    value="moderation"
                    className="flex items-center space-x-2"
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>Moderation</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="activity"
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Activity</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="conversion"
                    className="flex items-center space-x-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Conversion</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Reports</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="geographic"
                    className="flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Geographic</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="satisfaction"
                    className="flex items-center space-x-2"
                  >
                    <Star className="h-4 w-4" />
                    <span>Satisfaction</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="moderation">
                  <JobModerationDashboard />
                </TabsContent>

                <TabsContent value="analytics">
                  <AdminAnalyticsDashboard />
                </TabsContent>

                <TabsContent value="activity">
                  <UserActivityMonitor />
                </TabsContent>

                <TabsContent value="conversion">
                  <ApplicationConversionTracker />
                </TabsContent>

                <TabsContent value="reports">
                  <ReportGenerator />
                </TabsContent>

                <TabsContent value="geographic">
                  <GeographicAnalytics />
                </TabsContent>

                <TabsContent value="satisfaction">
                  <UserSatisfactionTracker />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
