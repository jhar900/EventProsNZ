'use client';

import React, { useState } from 'react';
import RoleGuard from '@/components/features/auth/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSystemSettings from '@/components/features/admin/AdminSystemSettings';
import AdminSecuritySettings from '@/components/features/admin/AdminSecuritySettings';
import AdminNotificationSettings from '@/components/features/admin/AdminNotificationSettings';
import AdminAppearanceSettings from '@/components/features/admin/AdminAppearanceSettings';
import AdminBackupSettings from '@/components/features/admin/AdminBackupSettings';
import AdminEmailSettings from '@/components/features/admin/AdminEmailSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Shield, Bell, Palette, Database, Mail } from 'lucide-react';

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState('system');

  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Platform Settings
              </h1>
              <p className="mt-2 text-gray-600">
                Configure platform-wide settings, security, notifications, and
                system preferences.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger
                      value="system"
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      System
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger
                      value="notifications"
                      className="flex items-center gap-2"
                    >
                      <Bell className="h-4 w-4" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger
                      value="email"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger
                      value="appearance"
                      className="flex items-center gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      Appearance
                    </TabsTrigger>
                    <TabsTrigger
                      value="backup"
                      className="flex items-center gap-2"
                    >
                      <Database className="h-4 w-4" />
                      Backup & Data
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="system" className="mt-6">
                    <AdminSystemSettings
                      onSuccess={() => {}}
                      onError={() => {}}
                    />
                  </TabsContent>

                  <TabsContent value="security" className="mt-6">
                    <AdminSecuritySettings
                      onSuccess={() => {}}
                      onError={() => {}}
                    />
                  </TabsContent>

                  <TabsContent value="notifications" className="mt-6">
                    <AdminNotificationSettings
                      onSuccess={() => {}}
                      onError={() => {}}
                    />
                  </TabsContent>

                  <TabsContent value="email" className="mt-6">
                    <AdminEmailSettings
                      onSuccess={() => {}}
                      onError={() => {}}
                    />
                  </TabsContent>

                  <TabsContent value="appearance" className="mt-6">
                    <AdminAppearanceSettings
                      onSuccess={() => {}}
                      onError={() => {}}
                    />
                  </TabsContent>

                  <TabsContent value="backup" className="mt-6">
                    <AdminBackupSettings
                      onSuccess={() => {}}
                      onError={() => {}}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
