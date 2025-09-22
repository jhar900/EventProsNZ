'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface VerificationItem {
  id: string;
  user_id: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'resubmitted';
  priority: number;
  verification_type: 'event_manager' | 'contractor';
  submitted_at: string;
  reviewed_at?: string;
  users: {
    id: string;
    email: string;
    role: string;
    created_at: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  business_profiles?: {
    company_name: string;
    nzbn: string;
  };
}

interface ApprovalWorkflowProps {
  verification: VerificationItem;
  onClose: () => void;
  onStatusChange: (verificationId: string, newStatus: string) => void;
}

export function ApprovalWorkflow({
  verification,
  onClose,
  onStatusChange,
}: ApprovalWorkflowProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rejectionReasons = [
    'Incomplete profile information',
    'Invalid business registration',
    'Insufficient portfolio items',
    'Missing required documents',
    'Incorrect contact information',
    'Does not meet verification criteria',
    'Other',
  ];

  const handleSubmit = async () => {
    if (!action) {
      setError('Please select an action');
      return;
    }

    if (action === 'reject' && !reason) {
      setError('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint =
        action === 'approve'
          ? `/api/admin/verification/${verification.user_id}/approve`
          : `/api/admin/verification/${verification.user_id}/reject`;

      const body =
        action === 'approve'
          ? { reason: reason || 'Approved by admin' }
          : { reason, feedback: feedback || undefined };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onStatusChange(
          verification.id,
          action === 'approve' ? 'approved' : 'rejected'
        );
        onClose();
      } else {
        setError(data.error || 'Failed to process verification');
      }
    } catch (error) {
      console.error('Error processing verification:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAction(null);
    setReason('');
    setFeedback('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Review Verification</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Name:</span>{' '}
                {verification.profiles.first_name}{' '}
                {verification.profiles.last_name}
              </div>
              <div>
                <span className="font-medium">Email:</span>{' '}
                {verification.users.email}
              </div>
              <div>
                <span className="font-medium">Type:</span>{' '}
                {verification.verification_type.replace('_', ' ')}
              </div>
              <div>
                <span className="font-medium">Priority:</span>{' '}
                {verification.priority}
              </div>
              {verification.business_profiles?.company_name && (
                <div>
                  <span className="font-medium">Company:</span>{' '}
                  {verification.business_profiles.company_name}
                </div>
              )}
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Action</Label>
            <RadioGroup
              value={action || ''}
              onValueChange={value => setAction(value as 'approve' | 'reject')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approve" id="approve" />
                <Label
                  htmlFor="approve"
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Approve Verification</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reject" id="reject" />
                <Label
                  htmlFor="reject"
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Reject Verification</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Reason Selection (for rejection) */}
          {action === 'reject' && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Rejection Reason</Label>
              <RadioGroup value={reason} onValueChange={setReason}>
                {rejectionReasons.map(reasonOption => (
                  <div
                    key={reasonOption}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={reasonOption} id={reasonOption} />
                    <Label htmlFor={reasonOption} className="cursor-pointer">
                      {reasonOption}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Additional Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-base font-medium">
              {action === 'approve'
                ? 'Approval Notes (Optional)'
                : 'Additional Feedback (Optional)'}
            </Label>
            <Textarea
              id="feedback"
              placeholder={
                action === 'approve'
                  ? 'Add any notes about the approval...'
                  : 'Provide additional feedback to help the user improve their submission...'
              }
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !action || (action === 'reject' && !reason)}
              className={
                action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {loading ? (
                'Processing...'
              ) : action === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
