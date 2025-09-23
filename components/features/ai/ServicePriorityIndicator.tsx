'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

interface ServicePriorityIndicatorProps {
  priority: number;
  confidence?: number;
  isRequired?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function ServicePriorityIndicator({
  priority,
  confidence,
  isRequired = false,
  showDetails = false,
  className = '',
}: ServicePriorityIndicatorProps) {
  const getPriorityConfig = (priority: number) => {
    switch (priority) {
      case 5:
        return {
          label: 'Critical',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          description: 'Essential service that cannot be omitted',
          urgency: 'high',
        };
      case 4:
        return {
          label: 'High',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Star,
          description:
            'Important service that significantly impacts event success',
          urgency: 'high',
        };
      case 3:
        return {
          label: 'Medium',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: TrendingUp,
          description: 'Recommended service that enhances the event experience',
          urgency: 'medium',
        };
      case 2:
        return {
          label: 'Low',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
          description: 'Optional service that adds value but is not essential',
          urgency: 'low',
        };
      case 1:
        return {
          label: 'Optional',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Info,
          description:
            'Nice-to-have service that can be added if budget allows',
          urgency: 'low',
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Info,
          description: 'Priority level not determined',
          urgency: 'low',
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    if (confidence >= 0.6) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Priority Badge */}
      <div className="flex items-center gap-2">
        <Badge className={`${config.color} flex items-center gap-1`}>
          <Icon className="h-3 w-3" />
          Priority {priority} - {config.label}
        </Badge>
        {isRequired && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Required
          </Badge>
        )}
      </div>

      {/* Confidence Score */}
      {confidence !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className={`font-medium ${getConfidenceColor(confidence)}`}>
              {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
            </span>
          </div>
          <Progress value={confidence * 100} className="h-2" />
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <span className="text-muted-foreground">{config.description}</span>
          </div>

          {confidence !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Confidence Level:</span>
                <span
                  className={`font-medium ${getConfidenceColor(confidence)}`}
                >
                  {getConfidenceLabel(confidence)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Based on industry data, user preferences, and event type
                analysis
              </div>
            </div>
          )}

          {isRequired && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                This service is considered essential for{' '}
                {priority === 5 ? 'event success' : 'optimal event experience'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Priority Level Summary Component
interface PriorityLevelSummaryProps {
  services: Array<{
    priority: number;
    isRequired?: boolean;
    confidence?: number;
  }>;
  className?: string;
}

export function PriorityLevelSummary({
  services,
  className = '',
}: PriorityLevelSummaryProps) {
  const priorityCounts = services.reduce(
    (acc, service) => {
      acc[service.priority] = (acc[service.priority] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const requiredCount = services.filter(s => s.isRequired).length;
  const averageConfidence =
    services.length > 0
      ? services.reduce((sum, s) => sum + (s.confidence || 0), 0) /
        services.length
      : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[5, 4, 3, 2, 1].map(priority => {
          const count = priorityCounts[priority] || 0;
          const config = getPriorityConfig(priority);
          const Icon = config.icon;

          return (
            <div key={priority} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-primary">{count}</div>
              <div className="text-xs text-muted-foreground">
                {config.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{requiredCount}</div>
          <div className="text-sm text-muted-foreground">Required Services</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(averageConfidence * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">Avg Confidence</div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get priority configuration
function getPriorityConfig(priority: number) {
  switch (priority) {
    case 5:
      return {
        label: 'Critical',
        icon: AlertTriangle,
      };
    case 4:
      return {
        label: 'High',
        icon: Star,
      };
    case 3:
      return {
        label: 'Medium',
        icon: TrendingUp,
      };
    case 2:
      return {
        label: 'Low',
        icon: Clock,
      };
    case 1:
      return {
        label: 'Optional',
        icon: Info,
      };
    default:
      return {
        label: 'Unknown',
        icon: Info,
      };
  }
}
