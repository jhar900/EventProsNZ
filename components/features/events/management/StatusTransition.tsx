'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface StatusTransitionProps {
  eventId: string;
}

export function StatusTransition({ eventId }: StatusTransitionProps) {
  const statusFlow = [
    {
      status: 'draft',
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-gray-500',
    },
    {
      status: 'planning',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-blue-500',
    },
    {
      status: 'confirmed',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-500',
    },
    {
      status: 'in_progress',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-500',
    },
    {
      status: 'completed',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ArrowRight className="h-5 w-5 mr-2" />
          Status Transition Flow
        </CardTitle>
        <CardDescription>
          Visual representation of event status progression
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center space-x-4">
          {statusFlow.map((step, index) => (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step.color}`}
                >
                  {step.icon}
                </div>
                <span className="text-sm font-medium capitalize">
                  {step.status.replace('_', ' ')}
                </span>
              </div>
              {index < statusFlow.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
