'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Clock, Calendar, Activity } from 'lucide-react';

interface EventTimelineProps {
  eventId: string;
}

export function EventTimeline({ eventId }: EventTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Event Timeline
        </CardTitle>
        <CardDescription>
          Visual timeline of event activities and milestones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4" />
          <p>Timeline features coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
