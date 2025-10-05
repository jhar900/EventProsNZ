'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
} from 'lucide-react';

interface TrialDowngradeProps {
  userId: string;
  onDowngrade?: () => void;
}

export default function TrialDowngrade({
  userId,
  onDowngrade,
}: TrialDowngradeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reason, setReason] = useState('');

  const handleDowngrade = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/trial/downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          reason: reason || 'Trial expired without conversion',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess(true);
      if (onDowngrade) {
        onDowngrade();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to downgrade trial'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <div className="text-lg font-medium text-green-600 mb-2">
            Trial Successfully Downgraded
          </div>
          <div className="text-sm text-gray-600">
            Your trial has been downgraded to the free tier. You can still use
            basic features.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Downgrade Warning */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <div className="font-medium text-orange-800 mb-2">
            Trial Downgrade
          </div>
          <div className="text-orange-700">
            This action will downgrade the user&apos;s trial to the free tier.
            This cannot be undone.
          </div>
        </AlertDescription>
      </Alert>

      {/* Downgrade Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Trial Downgrade
          </CardTitle>
          <CardDescription>
            Downgrade user&apos;s trial to free tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>What happens when you downgrade:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    User&apos;s subscription status changes to
                    &apos;inactive&apos;
                  </li>
                  <li>Tier changes to &apos;essential&apos; (free tier)</li>
                  <li>Price set to $0.00</li>
                  <li>End date set to current date</li>
                  <li>Trial conversion status marked as &apos;expired&apos;</li>
                  <li>User retains access to basic features</li>
                </ul>
              </div>
            </div>

            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reason for downgrade (optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter reason for downgrade..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleDowngrade}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {loading ? 'Downgrading...' : 'Downgrade Trial'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Free Tier Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Free Tier Features
          </CardTitle>
          <CardDescription>Features available after downgrade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Basic Profile</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Up to 5 Portfolio Items</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Basic Search Visibility</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Contact Form</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Basic Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Email Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Community Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Basic Matching</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
