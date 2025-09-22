'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Clock,
  FileText,
  Image,
  Star,
  ExternalLink,
} from 'lucide-react';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { useRouter } from 'next/navigation';

interface UserDetails {
  id: string;
  email: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    bio: string;
    profile_photo_url: string;
  };
  business_profiles?: {
    company_name: string;
    business_address: string;
    nzbn: string;
    description: string;
    service_areas: string[];
    social_links: any;
    is_verified: boolean;
    verification_date: string;
  };
  services?: Array<{
    id: string;
    service_type: string;
    description: string;
    price_range_min: number;
    price_range_max: number;
    availability: string;
  }>;
  portfolio?: Array<{
    id: string;
    title: string;
    description: string;
    image_url: string;
    video_url: string;
    event_date: string;
  }>;
  contractor_testimonials?: Array<{
    id: string;
    client_name: string;
    client_email: string;
    rating: number;
    comment: string;
    event_title: string;
    event_date: string;
    is_verified: boolean;
  }>;
  contractor_onboarding_status?: {
    step1_completed: boolean;
    step2_completed: boolean;
    step3_completed: boolean;
    step4_completed: boolean;
    is_submitted: boolean;
    submission_date: string;
    approval_status: string;
    admin_notes: string;
  };
}

interface VerificationLogEntry {
  id: string;
  action: string;
  status: string;
  reason: string;
  feedback: string;
  admin_user: {
    id: string;
    email: string;
  };
  created_at: string;
}

interface QueueStatus {
  id: string;
  status: string;
  priority: number;
  verification_type: string;
  submitted_at: string;
  reviewed_at: string;
}

interface UserVerificationDetailsProps {
  data: {
    user: UserDetails;
    verification_log: VerificationLogEntry[];
    queue_status: QueueStatus | null;
  };
}

export function UserVerificationDetails({
  data,
}: UserVerificationDetailsProps) {
  const router = useRouter();
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, verification_log, queue_status } = data;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      in_review: { color: 'bg-blue-100 text-blue-800', label: 'In Review' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      resubmitted: {
        color: 'bg-purple-100 text-purple-800',
        label: 'Resubmitted',
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3)
      return <Badge className="bg-red-100 text-red-800">High</Badge>;
    if (priority >= 2)
      return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low</Badge>;
  };

  const canTakeAction =
    queue_status &&
    (queue_status.status === 'pending' || queue_status.status === 'in_review');

  const handleStatusChange = (newStatus: string) => {
    // Refresh the page to get updated data
    router.refresh();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">User Verification Review</h1>
              <p className="text-gray-600">
                Review and manage user verification
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {queue_status && (
              <>
                {getStatusBadge(queue_status.status)}
                {getPriorityBadge(queue_status.priority)}
              </>
            )}
            {canTakeAction && (
              <Button
                onClick={() => setShowApprovalWorkflow(true)}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Review Verification
              </Button>
            )}
          </div>
        </div>

        {/* User Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">User Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profiles.profile_photo_url} />
                <AvatarFallback>
                  {getInitials(
                    user.profiles.first_name,
                    user.profiles.last_name
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {user.profiles.first_name} {user.profiles.last_name}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    {user.profiles.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {user.profiles.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Member since:</span>{' '}
                    {formatDate(user.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">Verification status:</span>
                    <Badge
                      className={`ml-2 ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {user.is_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                  {queue_status && (
                    <>
                      <div>
                        <span className="font-medium">Queue status:</span>{' '}
                        {queue_status.status}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span>{' '}
                        {formatDate(queue_status.submitted_at)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="history">Verification History</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      First Name
                    </label>
                    <p className="text-sm">{user.profiles.first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Last Name
                    </label>
                    <p className="text-sm">{user.profiles.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Phone
                    </label>
                    <p className="text-sm">
                      {user.profiles.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Address
                    </label>
                    <p className="text-sm">
                      {user.profiles.address || 'Not provided'}
                    </p>
                  </div>
                </div>
                {user.profiles.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Bio
                    </label>
                    <p className="text-sm mt-1">{user.profiles.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                {user.business_profiles ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Company Name
                        </label>
                        <p className="text-sm">
                          {user.business_profiles.company_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          NZBN
                        </label>
                        <p className="text-sm">
                          {user.business_profiles.nzbn || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Business Address
                        </label>
                        <p className="text-sm">
                          {user.business_profiles.business_address ||
                            'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Verification Status
                        </label>
                        <Badge
                          className={`ml-2 ${user.business_profiles.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                        >
                          {user.business_profiles.is_verified
                            ? 'Verified'
                            : 'Not Verified'}
                        </Badge>
                      </div>
                    </div>
                    {user.business_profiles.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Description
                        </label>
                        <p className="text-sm mt-1">
                          {user.business_profiles.description}
                        </p>
                      </div>
                    )}
                    {user.business_profiles.service_areas &&
                      user.business_profiles.service_areas.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Service Areas
                          </label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {user.business_profiles.service_areas.map(
                              (area, index) => (
                                <Badge key={index} variant="outline">
                                  {area}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No business profile information available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                {user.services && user.services.length > 0 ? (
                  <div className="space-y-4">
                    {user.services.map(service => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <h3 className="font-medium">{service.service_type}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>
                            Price: ${service.price_range_min} - $
                            {service.price_range_max}
                          </span>
                          <span>Availability: {service.availability}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No services listed</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                {user.portfolio && user.portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.portfolio.map(item => (
                      <div key={item.id} className="border rounded-lg p-4">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                        )}
                        <h3 className="font-medium">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                        {item.event_date && (
                          <p className="text-xs text-gray-500 mt-2">
                            Event Date: {formatDate(item.event_date)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No portfolio items</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Client Testimonials</CardTitle>
              </CardHeader>
              <CardContent>
                {user.contractor_testimonials &&
                user.contractor_testimonials.length > 0 ? (
                  <div className="space-y-4">
                    {user.contractor_testimonials.map(testimonial => (
                      <div
                        key={testimonial.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">
                            {testimonial.client_name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < testimonial.rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                  fill={
                                    i < testimonial.rating
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                />
                              ))}
                            </div>
                            <Badge
                              variant={
                                testimonial.is_verified ? 'default' : 'outline'
                              }
                            >
                              {testimonial.is_verified
                                ? 'Verified'
                                : 'Unverified'}
                            </Badge>
                          </div>
                        </div>
                        {testimonial.comment && (
                          <p className="text-sm text-gray-600 mb-2">
                            {testimonial.comment}
                          </p>
                        )}
                        <div className="text-xs text-gray-500">
                          {testimonial.event_title && (
                            <span>Event: {testimonial.event_title} • </span>
                          )}
                          {testimonial.event_date && (
                            <span>
                              Date: {formatDate(testimonial.event_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No testimonials available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Verification History</CardTitle>
              </CardHeader>
              <CardContent>
                {verification_log.length > 0 ? (
                  <div className="space-y-4">
                    {verification_log.map(entry => (
                      <div
                        key={entry.id}
                        className="border-l-4 border-blue-200 pl-4 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={
                                entry.action === 'approve'
                                  ? 'bg-green-100 text-green-800'
                                  : entry.action === 'reject'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-purple-100 text-purple-800'
                              }
                            >
                              {entry.action.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              by {entry.admin_user.email}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        {entry.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Reason:</strong> {entry.reason}
                          </p>
                        )}
                        {entry.feedback && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Feedback:</strong> {entry.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No verification history available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showApprovalWorkflow && queue_status && (
        <ApprovalWorkflow
          verification={{
            id: queue_status.id,
            user_id: user.id,
            status: queue_status.status as any,
            priority: queue_status.priority,
            verification_type: queue_status.verification_type as any,
            submitted_at: queue_status.submitted_at,
            reviewed_at: queue_status.reviewed_at,
            users: {
              id: user.id,
              email: user.email,
              role: user.role,
              created_at: user.created_at,
            },
            profiles: user.profiles,
            business_profiles: user.business_profiles,
          }}
          onClose={() => setShowApprovalWorkflow(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}
