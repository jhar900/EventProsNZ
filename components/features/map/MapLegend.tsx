/**
 * Map Legend Component
 * Enhanced service type legend with filtering and interaction capabilities
 */

'use client';

import React, { useState, useCallback } from 'react';
import { MapContractor } from '@/lib/maps/map-service';

interface ServiceType {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
  isVisible: boolean;
}

interface MapLegendProps {
  contractors?: MapContractor[];
  onServiceTypeToggle?: (serviceType: string, isVisible: boolean) => void;
  onFilterChange?: (filters: {
    service_type?: string;
    verified_only?: boolean;
  }) => void;
  className?: string;
}

const SERVICE_TYPES: Omit<ServiceType, 'count' | 'isVisible'>[] = [
  { id: 'catering', name: 'Catering', color: '#ef4444', icon: '🍽️' },
  { id: 'photography', name: 'Photography', color: '#3b82f6', icon: '📸' },
  { id: 'music', name: 'Music & Entertainment', color: '#8b5cf6', icon: '🎵' },
  { id: 'venue', name: 'Venues', color: '#10b981', icon: '🏛️' },
  { id: 'decorations', name: 'Decorations', color: '#f59e0b', icon: '🎨' },
  {
    id: 'transportation',
    name: 'Transportation',
    color: '#6b7280',
    icon: '🚗',
  },
  { id: 'security', name: 'Security', color: '#dc2626', icon: '🛡️' },
  { id: 'other', name: 'Other Services', color: '#6b7280', icon: '⚙️' },
];

export const MapLegend: React.FC<MapLegendProps> = ({
  contractors = [],
  onServiceTypeToggle,
  onFilterChange,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(() => {
    return SERVICE_TYPES.map(service => ({
      ...service,
      count: contractors.filter(c => c.service_type === service.id).length,
      isVisible: true,
    }));
  });

  // Update service type counts when contractors change
  React.useEffect(() => {
    setServiceTypes(prev =>
      prev.map(service => ({
        ...service,
        count: contractors.filter(c => c.service_type === service.id).length,
      }))
    );
  }, [contractors]);

  // Handle service type visibility toggle
  const handleServiceTypeToggle = useCallback(
    (serviceId: string) => {
      setServiceTypes(prev =>
        prev.map(service =>
          service.id === serviceId
            ? { ...service, isVisible: !service.isVisible }
            : service
        )
      );

      const service = serviceTypes.find(s => s.id === serviceId);
      if (service) {
        onServiceTypeToggle?.(serviceId, !service.isVisible);
      }
    },
    [serviceTypes, onServiceTypeToggle]
  );

  // Handle verified only toggle
  const handleVerifiedOnlyToggle = useCallback(() => {
    const newValue = !showOnlyVerified;
    setShowOnlyVerified(newValue);
    onFilterChange?.({ verified_only: newValue });
  }, [showOnlyVerified, onFilterChange]);

  // Handle service type filter
  const handleServiceTypeFilter = useCallback(
    (serviceId: string) => {
      onFilterChange?.({ service_type: serviceId });
    },
    [onFilterChange]
  );

  // Get active services (those with contractors)
  const activeServices = serviceTypes.filter(service => service.count > 0);
  const totalContractors = contractors.length;
  const verifiedContractors = contractors.filter(c => c.is_verified).length;

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-4'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {isCollapsed ? 'Legend' : 'Service Types'}
        </h3>
        <div className="flex items-center space-x-2">
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isCollapsed ? (
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
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
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Summary Stats */}
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Total: {totalContractors}</span>
              <span>Verified: {verifiedContractors}</span>
            </div>
          </div>

          {/* Service Types */}
          {activeServices.length > 0 ? (
            <div className="space-y-2">
              {activeServices.map(service => (
                <div
                  key={service.id}
                  className="flex items-center space-x-2 group"
                >
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleServiceTypeToggle(service.id)}
                      className={`w-3 h-3 rounded-full border transition-all ${
                        service.isVisible
                          ? 'border-gray-300'
                          : 'border-gray-400 bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: service.isVisible
                          ? service.color
                          : undefined,
                      }}
                      title={`Toggle ${service.name} visibility`}
                    />
                    <span className="text-xs">{service.icon}</span>
                  </div>
                  <button
                    onClick={() => handleServiceTypeFilter(service.id)}
                    className="text-xs text-gray-600 flex-1 text-left hover:text-gray-900 transition-colors"
                  >
                    {service.name}
                  </button>
                  <span className="text-xs text-gray-500 font-medium">
                    {service.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">No contractors visible</div>
          )}

          {/* Filter Controls */}
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            {/* Verified Only Toggle */}
            <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyVerified}
                onChange={handleVerifiedOnlyToggle}
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span>Show verified only</span>
            </label>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setShowOnlyVerified(false);
                setServiceTypes(prev =>
                  prev.map(service => ({ ...service, isVisible: true }))
                );
                onFilterChange?.({});
              }}
              className="w-full text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear all filters
            </button>
          </div>

          {/* Legend Footer */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Verified</span>
              <div className="w-2 h-2 bg-gray-400 rounded-full ml-2" />
              <span>Unverified</span>
            </div>
          </div>
        </>
      )}

      {/* Collapsed View */}
      {isCollapsed && (
        <div className="flex items-center space-x-1">
          {activeServices.slice(0, 4).map(service => (
            <div
              key={service.id}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: service.color }}
              title={`${service.name}: ${service.count}`}
            />
          ))}
          {activeServices.length > 4 && (
            <span className="text-xs text-gray-500">
              +{activeServices.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
