'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

interface EventAnalyticsProps {
  eventId: string;
}

export function EventAnalytics({ eventId }: EventAnalyticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Event Analytics
        </CardTitle>
        <CardDescription>Analytics and insights for this event</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4" />
          <p>Analytics features coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
