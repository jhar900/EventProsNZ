'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeatureRequestManagementDashboard from '@/components/features/feature-requests/admin/FeatureRequestManagementDashboard';
import RequestPrioritization from '@/components/features/feature-requests/admin/RequestPrioritization';
import CommunityCommunication from '@/components/features/feature-requests/admin/CommunityCommunication';
import RoadmapIntegration from '@/components/features/feature-requests/admin/RoadmapIntegration';
import StatusUpdateSystem from '@/components/features/feature-requests/admin/StatusUpdateSystem';
import FeatureRequestAnalytics from '@/components/features/feature-requests/admin/FeatureRequestAnalytics';
import ProjectManagementIntegration from '@/components/features/feature-requests/admin/ProjectManagementIntegration';
import PublicRoadmap from '@/components/features/feature-requests/admin/PublicRoadmap';
import {
  Settings,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  FileText,
  MessageCircle,
  GitBranch,
  Globe,
} from 'lucide-react';

export default function AdminFeatureRequestsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('management');

  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Feature Request Management
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Comprehensive feature request management, prioritization, and
                  community communication tools
                </p>
              </div>

              {/* Navigation Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-8">
                  <TabsTrigger
                    value="management"
                    className="flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Management</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="prioritization"
                    className="flex items-center space-x-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Prioritization</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="communication"
                    className="flex items-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Communication</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="roadmap"
                    className="flex items-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Roadmap</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="status"
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Status Updates</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="integration"
                    className="flex items-center space-x-2"
                  >
                    <GitBranch className="h-4 w-4" />
                    <span>Integration</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="public"
                    className="flex items-center space-x-2"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Public View</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="management" className="space-y-6">
                  <FeatureRequestManagementDashboard />
                </TabsContent>

                <TabsContent value="prioritization" className="space-y-6">
                  <RequestPrioritization />
                </TabsContent>

                <TabsContent value="communication" className="space-y-6">
                  <CommunityCommunication />
                </TabsContent>

                <TabsContent value="roadmap" className="space-y-6">
                  <RoadmapIntegration />
                </TabsContent>

                <TabsContent value="status" className="space-y-6">
                  <StatusUpdateSystem />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <FeatureRequestAnalytics />
                </TabsContent>

                <TabsContent value="integration" className="space-y-6">
                  <ProjectManagementIntegration />
                </TabsContent>

                <TabsContent value="public" className="space-y-6">
                  <PublicRoadmap />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
