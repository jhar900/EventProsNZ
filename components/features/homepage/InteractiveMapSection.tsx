'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Users, Star, ExternalLink } from 'lucide-react';

interface Contractor {
  id: string;
  name: string;
  business_name: string;
  service_category: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    region: string;
  };
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_premium: boolean;
  profile_image?: string;
}

interface InteractiveMapSectionProps {
  contractors?: Contractor[];
  className?: string;
}

const defaultContractors: Contractor[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    business_name: 'Auckland Photography Co.',
    service_category: 'Photography',
    location: {
      latitude: -36.8485,
      longitude: 174.7633,
      city: 'Auckland',
      region: 'Auckland',
    },
    rating: 4.9,
    review_count: 127,
    is_verified: true,
    is_premium: true,
  },
  {
    id: '2',
    name: 'Mike Wilson',
    business_name: 'Wellington Catering',
    service_category: 'Catering',
    location: {
      latitude: -41.2924,
      longitude: 174.7787,
      city: 'Wellington',
      region: 'Wellington',
    },
    rating: 4.8,
    review_count: 89,
    is_verified: true,
    is_premium: false,
  },
  {
    id: '3',
    name: 'Emma Davis',
    business_name: 'Christchurch Events',
    service_category: 'Event Planning',
    location: {
      latitude: -43.5321,
      longitude: 172.6362,
      city: 'Christchurch',
      region: 'Canterbury',
    },
    rating: 4.9,
    review_count: 156,
    is_verified: true,
    is_premium: true,
  },
  {
    id: '4',
    name: 'James Brown',
    business_name: 'Hamilton DJ Services',
    service_category: 'Entertainment',
    location: {
      latitude: -37.787,
      longitude: 175.2793,
      city: 'Hamilton',
      region: 'Waikato',
    },
    rating: 4.7,
    review_count: 73,
    is_verified: true,
    is_premium: false,
  },
  {
    id: '5',
    name: 'Lisa Chen',
    business_name: 'Dunedin Floral Design',
    service_category: 'Floral Design',
    location: {
      latitude: -45.8788,
      longitude: 170.5028,
      city: 'Dunedin',
      region: 'Otago',
    },
    rating: 4.8,
    review_count: 94,
    is_verified: true,
    is_premium: true,
  },
];

export function InteractiveMapSection({
  contractors = defaultContractors,
  className = '',
}: InteractiveMapSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleContractorClick = (contractor: Contractor) => {
    setSelectedContractor(contractor);
  };

  const closePopup = () => {
    setSelectedContractor(null);
  };

  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Find Contractors Across New Zealand
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover qualified contractors in your area with our interactive map
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map container */}
          <div className="lg:col-span-2">
            <div className="relative h-96 lg:h-[500px] bg-gradient-to-br from-blue-50 to-green-50 rounded-xl overflow-hidden">
              {/* Map placeholder with NZ outline */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Interactive Map
                  </h3>
                  <p className="text-gray-600">
                    Mapbox integration coming soon
                  </p>
                </div>
              </div>

              {/* Contractor markers */}
              {isMapLoaded && (
                <div className="absolute inset-0">
                  {contractors.map((contractor, index) => (
                    <button
                      key={contractor.id}
                      onClick={() => handleContractorClick(contractor)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                      style={{
                        left: `${20 + index * 15}%`,
                        top: `${30 + index * 10}%`,
                      }}
                    >
                      <MapPin className="w-5 h-5 text-white mx-auto" />
                    </button>
                  ))}
                </div>
              )}

              {/* Loading overlay */}
              {!isMapLoaded && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contractor list */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Featured Contractors
            </h3>
            {contractors.map(contractor => (
              <div
                key={contractor.id}
                onClick={() => handleContractorClick(contractor)}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {contractor.business_name}
                      </h4>
                      {contractor.is_verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                      {contractor.is_premium && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {contractor.service_category}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{contractor.rating}</span>
                        <span>({contractor.review_count})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{contractor.location.city}</span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contractor popup */}
        {selectedContractor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedContractor.business_name}
                  </h3>
                  <p className="text-gray-600">
                    {selectedContractor.service_category}
                  </p>
                </div>
                <button
                  onClick={closePopup}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">
                    {selectedContractor.rating}
                  </span>
                  <span className="text-gray-600">
                    ({selectedContractor.review_count} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>
                    {selectedContractor.location.city},{' '}
                    {selectedContractor.location.region}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>Contact: {selectedContractor.name}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  View Profile
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                  Contact
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
            Explore All Contractors
          </button>
        </div>
      </div>
    </section>
  );
}
