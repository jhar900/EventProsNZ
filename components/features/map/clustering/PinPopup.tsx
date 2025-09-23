/**
 * Pin Popup Component
 * Click popups with contractor details and actions
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContractor } from '@/lib/maps/map-service';

interface PinPopupProps {
  contractor: MapContractor;
  position: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (contractorId: string) => void;
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

export const PinPopup: React.FC<PinPopupProps> = ({
  contractor,
  position,
  isVisible,
  onClose,
  onNavigate,
  className = '',
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [isVisible]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopup, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (showPopup) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showPopup, onClose]);

  if (!showPopup) {
    return null;
  }

  const serviceColor =
    SERVICE_COLORS[contractor.service_type] || SERVICE_COLORS.other;
  const serviceIcon =
    SERVICE_ICONS[contractor.service_type] || SERVICE_ICONS.other;

  const handleViewProfile = () => {
    onNavigate(contractor.id);
  };

  const handleContact = () => {
    // Open contact modal or redirect to contact page
    onContact?.(contractor.id);
  };

  const handleAddToFavorites = () => {
    // Add to favorites
    onAddToFavorites?.(contractor.id);
  };

  return (
    <div
      className={`absolute z-50 transition-all duration-200 ${
        showPopup ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y - 10}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Popup Container */}
      <div
        ref={popupRef}
        className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-w-sm"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Contractor Header */}
        <div className="flex items-center space-x-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg"
            style={{ backgroundColor: serviceColor }}
          >
            {serviceIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {contractor.company_name}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {contractor.service_type.replace('_', ' ')}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              {contractor.is_verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  Verified
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {contractor.subscription_tier}
              </span>
            </div>
          </div>
        </div>

        {/* Contractor Details */}
        <div className="space-y-2 mb-4">
          {contractor.business_address && (
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 text-gray-400 mt-0.5">📍</div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {contractor.business_address}
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-gray-400">⭐</div>
            <p className="text-sm text-gray-600">
              Premium {contractor.service_type.replace('_', ' ')} services
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleViewProfile}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Profile
          </button>
          <button
            onClick={handleContact}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Contact
          </button>
          <button
            onClick={handleAddToFavorites}
            className="px-3 py-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Add to favorites"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* Popup Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
      </div>
    </div>
  );
};
