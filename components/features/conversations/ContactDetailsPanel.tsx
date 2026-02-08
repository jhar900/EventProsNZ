'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  UserCircle,
  CalendarPlus,
} from 'lucide-react';
import Link from 'next/link';
import { AddToEventsModal } from './AddToEventsModal';

interface ContactDetailsPanelProps {
  contractor: {
    id: string;
    email: string;
    profiles?: {
      first_name: string;
      last_name: string;
      avatar_url?: string;
      phone?: string;
    };
    business_profiles?: {
      company_name: string;
      description?: string;
      location?: string;
      phone?: string;
    };
  } | null;
  event?: {
    id: string;
    title: string;
    event_type?: string;
    event_date?: string;
    location?: string;
  } | null;
  inquiryStatus?: string;
  inquiryDate?: string;
}

export function ContactDetailsPanel({
  contractor,
  event,
  inquiryStatus,
  inquiryDate,
}: ContactDetailsPanelProps) {
  const [showAddToEventsModal, setShowAddToEventsModal] = useState(false);

  if (!contractor) {
    return (
      <div className="p-6 text-center text-gray-500">
        <UserCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No contact selected</p>
      </div>
    );
  }

  const profile = contractor.profiles;
  const businessProfile = contractor.business_profiles;

  const contractorName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : businessProfile?.company_name || contractor.email || 'Unknown';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'responded':
        return 'bg-green-100 text-green-800';
      case 'quoted':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Contact Header */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-xl">
              {contractorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {contractorName}
            </h2>
            {businessProfile?.company_name &&
              contractorName !== businessProfile.company_name && (
                <p className="text-sm text-gray-600 truncate">
                  {businessProfile.company_name}
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Company Info */}
        {businessProfile && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Company
            </h3>
            <div className="space-y-2">
              {businessProfile.company_name && (
                <div className="flex items-start space-x-3">
                  <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    {businessProfile.company_name}
                  </span>
                </div>
              )}
              {businessProfile.location && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    {businessProfile.location}
                  </span>
                </div>
              )}
              {businessProfile.phone && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    {businessProfile.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Contact
          </h3>
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-700 break-all">
                {contractor.email}
              </span>
            </div>
            {profile?.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-sm text-gray-700">{profile.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Event Info */}
        {event && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Related Event
            </h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-sm text-gray-700 block">
                    {event.title}
                  </span>
                  {event.event_date && (
                    <span className="text-xs text-gray-500">
                      {formatDate(event.event_date)}
                    </span>
                  )}
                </div>
              </div>
              {event.location && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    {event.location}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inquiry Info */}
        {inquiryDate && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Inquiry
            </h3>
            <div className="flex items-start space-x-3">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-700">
                Started {formatDate(inquiryDate)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t bg-gray-50 space-y-2">
        <Link href={`/contractors/${contractor.id}`} target="_blank">
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Profile
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAddToEventsModal(true)}
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          Add To Events
        </Button>
      </div>

      <AddToEventsModal
        isOpen={showAddToEventsModal}
        onClose={() => setShowAddToEventsModal(false)}
        contractorId={contractor.id}
        contractorName={contractorName}
      />
    </div>
  );
}
