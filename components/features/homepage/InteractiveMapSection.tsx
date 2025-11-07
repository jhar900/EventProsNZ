'use client';

import React from 'react';
import { MapPin, Star, ExternalLink } from 'lucide-react';
import { MapboxProvider, useMapbox } from '@/lib/maps/mapbox-context';
import { SimpleMap } from './SimpleMap';
import Link from 'next/link';
import Image from 'next/image';

interface InteractiveMapSectionProps {
  className?: string;
}

// Error handler component to show helpful messages when Mapbox fails
function MapErrorHandler({ children }: { children: React.ReactNode }) {
  const { error, isLoaded } = useMapbox();

  React.useEffect(() => {
    if (error) {
      console.error('Mapbox Error:', error);
    }
  }, [error]);

  if (error && isLoaded) {
    const isTokenError = error.toLowerCase().includes('token');

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Map Not Available
          </div>
          <div className="text-gray-600 mb-4 text-sm">
            {isTokenError
              ? 'Mapbox access token is missing or invalid. Please configure NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.'
              : error}
          </div>
          {isTokenError && (
            <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded mt-4 text-left">
              <p className="font-semibold mb-2">Troubleshooting Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to your Vercel project settings</li>
                <li>Navigate to Environment Variables</li>
                <li>Ensure NEXT_PUBLIC_MAPBOX_TOKEN is set</li>
                <li>Verify the token starts with &quot;pk.&quot;</li>
                <li>Redeploy your application after adding/updating</li>
                <li>Check browser console (F12) for detailed errors</li>
              </ol>
              <p className="mt-2 text-xs">
                Note: Environment variables with NEXT_PUBLIC_ prefix need a
                redeploy to take effect.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ContractorList() {
  const [contractors, setContractors] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchContractors = async () => {
      try {
        const bounds = {
          north: -34.0,
          south: -47.0,
          east: 179.0,
          west: 166.0,
        };
        const response = await fetch(
          `/api/map/contractors?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`
        );
        if (response.ok) {
          const data = await response.json();
          setContractors(data.contractors || []);
        }
      } catch (error) {
        console.error('Error fetching contractors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractors();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Featured Contractors
        </h3>
        <p className="text-gray-500 text-sm">Loading contractors...</p>
      </div>
    );
  }

  if (!contractors || contractors.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Featured Contractors
        </h3>
        <p className="text-gray-500 text-sm">No contractors found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Featured Contractors ({contractors.length})
      </h3>
      {contractors.slice(0, 5).map(contractor => (
        <Link
          key={contractor.id}
          href={`/contractors/${contractor.id}`}
          className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            {/* Circular Logo on the left - larger size with even vertical spacing */}
            <div className="flex-shrink-0">
              {contractor.logo_url ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={contractor.logo_url}
                    alt={contractor.company_name || 'Company logo'}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-white font-semibold text-xl">
                    {(contractor.company_name || 'C').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {contractor.company_name || 'Unnamed Business'}
                    </h4>
                    {contractor.is_verified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                        Verified
                      </span>
                    )}
                    {contractor.subscription_tier === 'professional' ||
                    contractor.subscription_tier === 'enterprise' ? (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex-shrink-0">
                        Premium
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {contractor.service_type || 'General Services'}
                  </p>
                  {contractor.business_address && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {(() => {
                          const location = contractor.business_address || '';
                          if (!location) return 'Location not specified';
                          const parts = location.split(',').map(p => p.trim());
                          if (parts.length === 1) {
                            const singlePart = parts[0];
                            return singlePart
                              .replace(/\s*\d{4,6}\s*$/, '')
                              .trim();
                          } else if (parts.length === 2) {
                            const cityPart = parts[0];
                            return cityPart
                              .replace(/\s*\d{4,6}\s*$/, '')
                              .trim();
                          } else {
                            let cityPart = '';
                            if (
                              parts[parts.length - 1]
                                .toLowerCase()
                                .includes('zealand')
                            ) {
                              cityPart = parts[parts.length - 2];
                            } else {
                              cityPart =
                                parts[parts.length - 2] || parts[1] || parts[0];
                            }
                            return cityPart
                              .replace(/\s*\d{4,6}\s*$/, '')
                              .trim();
                          }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </div>
          </div>
        </Link>
      ))}
      {contractors.length > 5 && (
        <Link
          href="/contractors"
          className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-4"
        >
          View All Contractors →
        </Link>
      )}
    </div>
  );
}

export function InteractiveMapSection({
  className = '',
}: InteractiveMapSectionProps) {
  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Find Contractors Across New Zealand
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Discover qualified contractors in your area with our interactive map
          </p>
          <Link
            href="/maps-demo"
            className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Test Mapbox API →
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map container */}
          <div className="lg:col-span-2">
            <SimpleMap className="w-full" />
          </div>

          {/* Contractor list */}
          <MapboxProvider>
            <ContractorList />
          </MapboxProvider>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/contractors"
            className="inline-block bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
          >
            Explore All Contractors
          </Link>
        </div>
      </div>
    </section>
  );
}
