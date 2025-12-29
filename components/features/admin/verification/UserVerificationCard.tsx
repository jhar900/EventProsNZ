'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Building,
  Phone,
  MapPin,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  DollarSign,
  RotateCcw,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'event_manager' | 'contractor' | 'admin';
  is_verified: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected' | 'onboarding'; // Explicit status from API
  created_at: string;
  updated_at: string;
  last_login?: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    bio?: string;
    profile_photo_url?: string;
  };
  business_profiles?: {
    company_name: string;
    business_address?: string;
    nzbn?: string;
    description?: string;
    service_areas?: string[];
    social_links?: Record<string, string>;
    is_verified: boolean;
    verification_date?: string;
    logo_url?: string;
  };
  contractor_onboarding_status?: {
    step1_completed: boolean;
    step2_completed: boolean;
    step3_completed: boolean;
    step4_completed: boolean;
    is_submitted: boolean;
  };
}

interface VerificationLog {
  id: string;
  action: string;
  status: string;
  reason?: string;
  created_at: string;
  admin_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface UserVerificationCardProps {
  user: User;
  verificationLog: VerificationLog[];
  onApprove: (userId: string, reason?: string) => void;
  onReject: (userId: string, reason: string, feedback?: string) => void;
  onResubmit: (userId: string) => void;
  onUnapprove?: (userId: string, reason?: string) => void;
  isLoading: boolean;
}

export function UserVerificationCard({
  user,
  verificationLog,
  onApprove,
  onReject,
  onResubmit,
  onUnapprove,
  isLoading,
}: UserVerificationCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [approveReason, setApproveReason] = useState('');
  const [unapproveReason, setUnapproveReason] = useState('');

  const handleApprove = () => {
    onApprove(user.id, approveReason);
    setApproveReason('');
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(user.id, rejectReason, rejectFeedback);
      setRejectReason('');
      setRejectFeedback('');
      setShowRejectForm(false);
    }
  };

  const handleUnapprove = () => {
    if (onUnapprove) {
      onUnapprove(user.id, unapproveReason);
      setUnapproveReason('');
    }
  };

  const getStatusBadge = () => {
    // Use explicit verification_status if available, otherwise fall back to is_verified
    const status =
      user.verification_status || (user.is_verified ? 'approved' : 'pending');

    if (status === 'approved') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (status === 'rejected') {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    } else if (status === 'onboarding') {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Onboarding
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getBusinessStatusBadge = () => {
    // Use explicit verification_status if available, otherwise use business_profiles.is_verified
    const status =
      user.verification_status ||
      (user.business_profiles?.is_verified ? 'approved' : 'pending');

    if (status === 'approved') {
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (status === 'rejected') {
      return (
        <Badge className="bg-red-100 text-red-800 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    } else if (status === 'onboarding') {
      // Calculate which step they're on
      const onboardingStatus = user.contractor_onboarding_status;
      let stepText = 'Onboarding';

      if (onboardingStatus) {
        const completedSteps = [
          onboardingStatus.step1_completed,
          onboardingStatus.step2_completed,
          onboardingStatus.step3_completed,
          onboardingStatus.step4_completed,
        ].filter(Boolean).length;

        if (completedSteps > 0 && completedSteps < 4) {
          stepText = `Onboarding - Step ${completedSteps + 1}/4`;
        } else if (completedSteps === 0) {
          stepText = 'Onboarding - Step 1/4';
        }
      }

      return (
        <Badge className="bg-blue-100 text-blue-800 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {stepText}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      event_manager: 'bg-blue-100 text-blue-800',
      contractor: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    };

    return (
      <Badge
        className={
          roleColors[role as keyof typeof roleColors] ||
          'bg-gray-100 text-gray-800'
        }
      >
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* User Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                {user.profiles?.profile_photo_url ? (
                  <img
                    src={user.profiles.profile_photo_url}
                    alt={`${user.profiles.first_name || ''} ${user.profiles.last_name || ''}`}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">
                    {user.profiles
                      ? `${user.profiles.first_name || ''} ${user.profiles.last_name || ''}`.trim()
                      : user.email}
                  </h2>
                  {getRoleBadge(user.role)}
                </div>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Joined: {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Personal Information */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            {user.profiles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {user.profiles.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{user.profiles.phone}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>Not provided</span>
                  </div>
                )}
                {user.profiles.address ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{user.profiles.address}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>Not provided</span>
                  </div>
                )}
                {user.profiles.bio && (
                  <div className="md:col-span-2">
                    <p className="text-gray-600">{user.profiles.bio}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No profile information available
              </p>
            )}
          </div>

          {/* Business Information */}
          {user.business_profiles && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Business Information
                {getBusinessStatusBadge()}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  {user.business_profiles.logo_url && (
                    <img
                      src={user.business_profiles.logo_url}
                      alt={`${user.business_profiles.company_name} logo`}
                      className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                      onError={e => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <span className="font-medium">
                      {user.business_profiles.company_name}
                    </span>
                  </div>
                </div>
                {user.business_profiles.description && (
                  <p className="text-gray-600">
                    {user.business_profiles.description}
                  </p>
                )}
                {user.business_profiles.business_address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{user.business_profiles.business_address}</span>
                  </div>
                )}
                {user.business_profiles.nzbn && (
                  <div>
                    <span className="font-medium">NZBN: </span>
                    <span>{user.business_profiles.nzbn}</span>
                  </div>
                )}
                {user.business_profiles.service_areas &&
                  user.business_profiles.service_areas.length > 0 && (
                    <div>
                      <span className="font-medium">Service Areas: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.business_profiles.service_areas.map(area => (
                          <Badge
                            key={area}
                            variant="secondary"
                            className="text-xs"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {user.business_profiles.social_links &&
                  (() => {
                    const validLinks = Object.entries(
                      user.business_profiles.social_links
                    ).filter(
                      ([, url]) =>
                        url && typeof url === 'string' && url.trim() !== ''
                    );
                    return validLinks.length > 0 ? (
                      <div>
                        <span className="font-medium">Social Links: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {validLinks.map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-700 text-xs flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              {platform}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Business Verification Update</h3>
            {!user.business_profiles?.is_verified ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Approval reason (optional)"
                  value={approveReason}
                  onChange={e => setApproveReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    disabled={isLoading}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => onResubmit(user.id)}
                    disabled={isLoading}
                    variant="outline"
                  >
                    Request Resubmission
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Unapproval reason (optional)"
                  value={unapproveReason}
                  onChange={e => setUnapproveReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  {onUnapprove && (
                    <Button
                      onClick={handleUnapprove}
                      disabled={isLoading}
                      variant="outline"
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Unapprove
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    disabled={isLoading}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => onResubmit(user.id)}
                    disabled={isLoading}
                    variant="outline"
                  >
                    Request Resubmission
                  </Button>
                </div>
              </div>
            )}

            {/* Reject Form */}
            {showRejectForm && (
              <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-semibold text-red-800 mb-2">
                  Rejection Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Reason for rejection *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Incomplete business information"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Feedback for user (optional)
                    </label>
                    <textarea
                      placeholder="Provide specific feedback to help the user improve their profile..."
                      value={rejectFeedback}
                      onChange={e => setRejectFeedback(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || isLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification History */}
      {verificationLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationLog.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {log.action === 'approve' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : log.action === 'reject' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{log.action}</p>
                      {log.reason && (
                        <p className="text-sm text-gray-600">{log.reason}</p>
                      )}
                      {log.profiles && (
                        <p className="text-xs text-gray-500">
                          by {log.profiles.first_name} {log.profiles.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
