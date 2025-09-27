'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bell, Settings } from 'lucide-react';

interface NotificationCenterProps {
  eventId: string;
}

export function NotificationCenter({ eventId }: NotificationCenterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Center
        </CardTitle>
        <CardDescription>
          Manage notification preferences and settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4" />
          <p>Notification center features coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
