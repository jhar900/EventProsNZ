'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Target, Calendar, CheckCircle } from 'lucide-react';

interface MilestoneTrackerProps {
  eventId: string;
}

export function MilestoneTracker({ eventId }: MilestoneTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Milestone Tracker
        </CardTitle>
        <CardDescription>Track and manage event milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4" />
          <p>Milestone tracking features coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
