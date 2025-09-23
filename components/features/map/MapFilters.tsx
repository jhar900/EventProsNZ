/**
 * Map Filters Component
 * Filtering options for the map
 */

'use client';

import React from 'react';
import { useMapStore } from '@/stores/map';

const SERVICE_TYPES = [
  { id: 'catering', name: 'Catering' },
  { id: 'photography', name: 'Photography' },
  { id: 'music', name: 'Music & Entertainment' },
  { id: 'venue', name: 'Venues' },
  { id: 'decorations', name: 'Decorations' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'security', name: 'Security' },
  { id: 'other', name: 'Other Services' },
];

const SUBSCRIPTION_TIERS = [
  { id: 'essential', name: 'Essential' },
  { id: 'professional', name: 'Professional' },
  { id: 'premium', name: 'Premium' },
];

export const MapFilters: React.FC = () => {
  const { filters, setFilters } = useMapStore();

  const handleServiceTypeChange = (serviceType: string) => {
    setFilters({
      ...filters,
      service_type:
        serviceType === filters.service_type ? undefined : serviceType,
    });
  };

  const handleVerifiedOnlyChange = (verifiedOnly: boolean) => {
    setFilters({
      ...filters,
      verified_only: verifiedOnly,
    });
  };

  const handleSubscriptionTierChange = (tier: string) => {
    setFilters({
      ...filters,
      subscription_tier: tier === filters.subscription_tier ? undefined : tier,
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined
  );

  return (
    <div className="space-y-4">
      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Type
        </label>
        <div className="space-y-1">
          {SERVICE_TYPES.map(service => (
            <label key={service.id} className="flex items-center">
              <input
                type="radio"
                name="service_type"
                checked={filters.service_type === service.id}
                onChange={() => handleServiceTypeChange(service.id)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{service.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Verification Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.verified_only || false}
            onChange={e => handleVerifiedOnlyChange(e.target.checked)}
            className="text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Verified only</span>
        </label>
      </div>

      {/* Subscription Tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subscription Tier
        </label>
        <div className="space-y-1">
          {SUBSCRIPTION_TIERS.map(tier => (
            <label key={tier.id} className="flex items-center">
              <input
                type="radio"
                name="subscription_tier"
                checked={filters.subscription_tier === tier.id}
                onChange={() => handleSubscriptionTierChange(tier.id)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{tier.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={clearFilters}
            className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
