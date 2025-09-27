'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Star, MessageSquare, User } from 'lucide-react';

interface FeedbackCollectionProps {
  eventId: string;
}

export function FeedbackCollection({ eventId }: FeedbackCollectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2" />
          Feedback Collection
        </CardTitle>
        <CardDescription>
          Collect and manage feedback from contractors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-4" />
          <p>Feedback collection features coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
