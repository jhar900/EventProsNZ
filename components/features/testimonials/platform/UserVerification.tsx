'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building,
  User,
} from 'lucide-react';

interface VerificationStatus {
  email: 'pending' | 'verified' | 'rejected';
  phone: 'pending' | 'verified' | 'rejected';
  identity: 'pending' | 'verified' | 'rejected';
  business: 'pending' | 'verified' | 'rejected';
}

interface UserVerificationProps {
  userId?: string;
  className?: string;
}

export function UserVerification({ userId, className }: UserVerificationProps) {
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        const response = await fetch('/api/testimonials/platform/verification');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch verification status');
        }

        setVerificationStatus(data.verification);
      } catch (err) {
        console.error('Error fetching verification status:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch verification status'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'phone':
        return <Phone className="h-5 w-5" />;
      case 'identity':
        return <User className="h-5 w-5" />;
      case 'business':
        return <Building className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getVerificationTypeLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email Verification';
      case 'phone':
        return 'Phone Verification';
      case 'identity':
        return 'Identity Verification';
      case 'business':
        return 'Business Verification';
      default:
        return 'Verification';
    }
  };

  const isFullyVerified =
    verificationStatus &&
    Object.values(verificationStatus).every(status => status === 'verified');

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!verificationStatus) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Verification Status</span>
          {isFullyVerified && (
            <Badge className="bg-green-100 text-green-800">
              Fully Verified
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Your verification status affects testimonial authenticity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(verificationStatus).map(([type, status]) => (
            <div
              key={type}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getVerificationTypeIcon(type)}
                <div>
                  <p className="font-medium">
                    {getVerificationTypeLabel(type)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {status === 'verified' && 'Verified and trusted'}
                    {status === 'pending' && 'Verification in progress'}
                    {status === 'rejected' && 'Verification failed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status)}
                <Badge className={getStatusColor(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {!isFullyVerified && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Some verification steps are incomplete.
              Verified users have more credibility when submitting testimonials.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
