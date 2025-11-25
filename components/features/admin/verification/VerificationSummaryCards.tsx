'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, UserPlus, Loader2 } from 'lucide-react';

interface StatusCounts {
  onboarding: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface VerificationSummaryCardsProps {
  refreshKey?: number;
}

export function VerificationSummaryCards({
  refreshKey = 0,
}: VerificationSummaryCardsProps) {
  const [counts, setCounts] = useState<StatusCounts>({
    onboarding: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, [refreshKey]);

  const fetchCounts = async () => {
    try {
      setIsLoading(true);

      // Fetch counts for each status in parallel
      const [onboardingRes, pendingRes, approvedRes, rejectedRes] =
        await Promise.all([
          fetch('/api/admin/verification/queue?status=onboarding&limit=1'),
          fetch('/api/admin/verification/queue?status=pending&limit=1'),
          fetch('/api/admin/verification/queue?status=approved&limit=1'),
          fetch('/api/admin/verification/queue?status=rejected&limit=1'),
        ]);

      const [onboardingData, pendingData, approvedData, rejectedData] =
        await Promise.all([
          onboardingRes.json(),
          pendingRes.json(),
          approvedRes.json(),
          rejectedRes.json(),
        ]);

      setCounts({
        onboarding: onboardingData.total || 0,
        pending: pendingData.total || 0,
        approved: approvedData.total || 0,
        rejected: rejectedData.total || 0,
      });
    } catch (error) {
      console.error('Error fetching verification counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cards = [
    {
      label: 'Onboarding',
      count: counts.onboarding,
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Pending',
      count: counts.pending,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Approved',
      count: counts.approved,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      label: 'Rejected',
      count: counts.rejected,
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
      iconColor: 'text-red-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={`border-2 ${card.color} transition-shadow hover:shadow-md`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80 mb-1">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold">{card.count}</p>
                </div>
                <div
                  className={`${card.iconColor} bg-white/50 rounded-full p-3`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
