'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail } from 'lucide-react';
import Link from 'next/link';

interface SuspensionStatus {
  isSuspended: boolean;
  reason?: string;
  suspendedAt?: string;
}

export function SuspensionNotice() {
  const { user } = useAuth();
  const [suspensionStatus, setSuspensionStatus] = useState<SuspensionStatus>({
    isSuspended: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check suspension status if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    const checkSuspension = async () => {
      try {
        const response = await fetch('/api/user/suspension-status', {
          credentials: 'include', // Include cookies for authentication
        });

        if (response.ok) {
          const data = await response.json();
          setSuspensionStatus(data);
        } else if (response.status === 401) {
          // User is not authenticated, silently ignore
          setSuspensionStatus({ isSuspended: false });
        }
      } catch (error) {
        // Silently handle errors - don't log 401 errors as they're expected when not logged in
        // Only log unexpected errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error, silently ignore
        } else if (!(error instanceof Error && error.message.includes('401'))) {
          console.error('Error checking suspension status:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSuspension();
  }, [user]);

  if (loading || !suspensionStatus.isSuspended) {
    return null;
  }

  const suspendedDate = suspensionStatus.suspendedAt
    ? new Date(suspensionStatus.suspendedAt).toLocaleDateString('en-NZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Account Suspended</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          Your account has been suspended and you are unable to use most
          platform features.
        </p>
        {suspensionStatus.reason && (
          <p>
            <strong>Reason:</strong> {suspensionStatus.reason}
          </p>
        )}
        {suspendedDate && (
          <p>
            <strong>Suspended on:</strong> {suspendedDate}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <Link href="/contact">
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
