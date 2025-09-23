/**
 * Pin Tooltip Component
 * Hover tooltips with contractor previews
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContractor } from '@/lib/maps/map-service';

interface PinTooltipProps {
  contractor: MapContractor;
  position: { x: number; y: number };
  isVisible: boolean;
  delay?: number;
  className?: string;
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

const SERVICE_ICONS: Record<string, string> = {
  catering: '🍽️',
  photography: '📸',
  music: '🎵',
  venue: '🏛️',
  decorations: '🎨',
  transportation: '🚗',
  security: '🛡️',
  other: '⚙️',
};

export const PinTooltip: React.FC<PinTooltipProps> = ({
  contractor,
  position,
  isVisible,
  delay = 300,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isVisible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to show tooltip
      timeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, delay);
    } else {
      // Hide tooltip immediately
      setShowTooltip(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, delay]);

  if (!showTooltip) {
    return null;
  }

  const serviceColor =
    SERVICE_COLORS[contractor.service_type] || SERVICE_COLORS.other;
  const serviceIcon =
    SERVICE_ICONS[contractor.service_type] || SERVICE_ICONS.other;

  return (
    <div
      className={`absolute z-50 pointer-events-none transition-all duration-200 ${
        showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y - 10}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Tooltip Container */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />

        {/* Contractor Header */}
        <div className="flex items-center space-x-2 mb-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
            style={{ backgroundColor: serviceColor }}
          >
            {serviceIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {contractor.company_name}
            </h3>
            <p className="text-xs text-gray-600 capitalize">
              {contractor.service_type.replace('_', ' ')}
            </p>
          </div>
          {contractor.is_verified && (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>

        {/* Contractor Details */}
        <div className="space-y-1">
          {contractor.business_address && (
            <div className="flex items-start space-x-1">
              <div className="w-3 h-3 text-gray-400 mt-0.5">📍</div>
              <p className="text-xs text-gray-600 line-clamp-2">
                {contractor.business_address}
              </p>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 text-gray-400">⭐</div>
            <p className="text-xs text-gray-600 capitalize">
              {contractor.subscription_tier} Plan
            </p>
          </div>
        </div>

        {/* Action Hint */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Click to view details
          </p>
        </div>
      </div>
    </div>
  );
};
