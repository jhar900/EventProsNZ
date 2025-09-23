/**
 * Map Tooltip Component
 * Pin hover tooltips for contractor information
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Mail, Globe, Star } from 'lucide-react';
import { useMapStore } from '@/stores/map';
import { mapService } from '@/lib/maps/map-service';

interface MapTooltipProps {
  contractorId: string;
  onClose: () => void;
  className?: string;
}

export const MapTooltip: React.FC<MapTooltipProps> = ({
  contractorId,
  onClose,
  className = '',
}) => {
  const { contractors } = useMapStore();
  const [contractorDetails, setContractorDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const contractor = contractors.find(c => c.id === contractorId);

  useEffect(() => {
    if (contractorId) {
      setLoading(true);
      // In a real implementation, you might fetch additional contractor details
      // For now, we'll use the contractor data from the store
      setContractorDetails(contractor);
      setLoading(false);
    }
  }, [contractorId, contractor]);

  if (!contractor) {
    return null;
  }

  const SERVICE_COLORS: Record<string, string> = {
    catering: '#ef4444',
    photography: '#3b82f6',
    music: '#8b5cf6',
    venue: '#10b981',
    decorations: '#f59e0b',
    transportation: '#6b7280',
    security: '#dc2626',
    other: '#6b7280',
  };

  const serviceColor =
    SERVICE_COLORS[contractor.service_type] || SERVICE_COLORS.other;

  return (
    <div
      className={`absolute top-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-30 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {contractor.company_name}
          </h3>
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: serviceColor }}
            />
            <span className="text-sm text-gray-600 capitalize">
              {contractor.service_type.replace('_', ' ')}
            </span>
            {contractor.is_verified && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-green-500 fill-current" />
                <span className="text-xs text-green-600 font-medium">
                  Verified
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Address */}
        <div className="flex items-start space-x-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm text-gray-900">
              {contractor.business_address}
            </div>
          </div>
        </div>

        {/* Service Type */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <span className="font-medium">Service:</span>{' '}
            {contractor.service_type.replace('_', ' ')}
          </div>
        </div>

        {/* Subscription Tier */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <span className="font-medium">Tier:</span>{' '}
            {contractor.subscription_tier}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
            View Profile
          </button>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors">
            Contact
          </button>
        </div>
      </div>
    </div>
  );
};
