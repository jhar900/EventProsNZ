'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, X, ExternalLink, CheckCircle2 } from 'lucide-react';

interface ContractorDetailsPanelProps {
  contractor: any;
  onClose: () => void;
}

export function ContractorDetailsPanel({
  contractor,
  onClose,
}: ContractorDetailsPanelProps) {
  if (!contractor) return null;

  const serviceType = contractor.service_type?.toLowerCase() || 'other';
  const formattedServiceType = contractor.service_type
    ? contractor.service_type
        .split('_')
        .map(
          (word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ')
    : 'Service Provider';

  return (
    <div className="absolute left-4 top-4 bottom-4 w-96 bg-white rounded-lg shadow-xl z-20 overflow-hidden flex flex-col border border-gray-200">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Image - Logo at the top */}
        <div className="relative w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden">
          {contractor.logo_url ? (
            <div className="relative w-full h-full">
              <Image
                src={contractor.logo_url}
                alt={contractor.company_name || 'Company logo'}
                fill
                className="object-cover"
                sizes="384px"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <span className="text-white font-semibold text-6xl">
                {(contractor.company_name || 'C').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Close button overlapping hero image */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white rounded-full transition-colors shadow-md z-10"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Company Name and Info */}
        <div className="p-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-gray-900 text-lg truncate">
              {contractor.company_name || 'Unnamed Business'}
            </h4>
            {contractor.is_verified && (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-600 capitalize">
            {formattedServiceType}
          </p>
        </div>

        {/* Badges */}
        <div className="px-4 pt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {contractor.is_verified && (
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                Verified
              </span>
            )}
            {contractor.subscription_tier === 'professional' ||
            contractor.subscription_tier === 'enterprise' ? (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                Premium
              </span>
            ) : null}
          </div>

          {/* Description */}
          {contractor.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {contractor.description}
              </p>
            </div>
          )}

          {/* Address */}
          {contractor.business_address && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contractor.business_address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional info could go here */}
      </div>

      {/* Footer with action button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Link
          href={`/contractors/${contractor.id}`}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
        >
          View Full Profile
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
