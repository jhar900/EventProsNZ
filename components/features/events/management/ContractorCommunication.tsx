'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Phone, Mail } from 'lucide-react';

interface ContractorCommunicationProps {
  eventId: string;
}

export function ContractorCommunication({
  eventId,
}: ContractorCommunicationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Contractor Communication
        </CardTitle>
        <CardDescription>
          Communicate with contractors involved in this event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4" />
          <p>Communication features coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
