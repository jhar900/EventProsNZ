'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  MapPin,
  Calendar,
  Award,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Crown,
} from 'lucide-react';

interface FeaturedContractor {
  id: string;
  name: string;
  business_name: string;
  service_category: string;
  location: {
    city: string;
    region: string;
  };
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_spotlight: boolean;
  profile_image?: string;
  portfolio_images?: string[];
  specialties: string[];
  years_experience: number;
  price_range: string;
  availability: string;
}

interface FeaturedContractorsSectionProps {
  contractors?: FeaturedContractor[];
  className?: string;
}

const defaultContractors: FeaturedContractor[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    business_name: 'Elite Photography Co.',
    service_category: 'Photography',
    location: {
      city: 'Auckland',
      region: 'Auckland',
    },
    rating: 4.9,
    review_count: 127,
    is_verified: true,
    is_spotlight: true,
    specialties: [
      'Wedding Photography',
      'Corporate Events',
      'Portrait Sessions',
    ],
    years_experience: 8,
    price_range: '$800 - $2000',
    availability: 'Available',
  },
  {
    id: '2',
    name: 'James Wilson',
    business_name: 'Wellington Catering Excellence',
    service_category: 'Catering',
    location: {
      city: 'Wellington',
      region: 'Wellington',
    },
    rating: 4.8,
    review_count: 89,
    is_verified: true,
    is_spotlight: true,
    specialties: ['Fine Dining', 'Corporate Catering', 'Wedding Catering'],
    years_experience: 12,
    price_range: '$50 - $150 per person',
    availability: 'Available',
  },
  {
    id: '3',
    name: 'Emma Davis',
    business_name: 'Christchurch Event Planning',
    service_category: 'Event Planning',
    location: {
      city: 'Christchurch',
      region: 'Canterbury',
    },
    rating: 4.9,
    review_count: 156,
    is_verified: true,
    is_spotlight: true,
    specialties: ['Wedding Planning', 'Corporate Events', 'Private Parties'],
    years_experience: 10,
    price_range: '$2000 - $8000',
    availability: 'Available',
  },
  {
    id: '4',
    name: 'Michael Chen',
    business_name: 'Hamilton DJ Services',
    service_category: 'Entertainment',
    location: {
      city: 'Hamilton',
      region: 'Waikato',
    },
    rating: 4.7,
    review_count: 73,
    is_verified: true,
    is_spotlight: true,
    specialties: ['Wedding DJ', 'Corporate Events', 'Private Parties'],
    years_experience: 6,
    price_range: '$400 - $1200',
    availability: 'Available',
  },
];

export function FeaturedContractorsSection({
  contractors = defaultContractors,
  className = '',
}: FeaturedContractorsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % contractors.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [contractors.length, isAutoPlaying]);

  const nextContractor = () => {
    setCurrentIndex(prev => (prev + 1) % contractors.length);
    setIsAutoPlaying(false);
  };

  const prevContractor = () => {
    setCurrentIndex(
      prev => (prev - 1 + contractors.length) % contractors.length
    );
    setIsAutoPlaying(false);
  };

  const goToContractor = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className={`py-20 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Featured Contractors
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Meet our spotlight contractors - the best of the best in New Zealand
          </p>
        </div>

        {/* Featured contractor carousel */}
        <div className="relative">
          {/* Main featured contractor */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Image/Portfolio section */}
              <div className="relative h-64 lg:h-96 bg-gradient-to-br from-blue-100 to-green-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700">
                      Portfolio Gallery
                    </h3>
                    <p className="text-gray-600">Professional work samples</p>
                  </div>
                </div>

                {/* Spotlight badge */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Spotlight
                </div>
              </div>

              {/* Contractor details */}
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {contractors[currentIndex].business_name}
                    </h3>
                    <p className="text-gray-600">
                      {contractors[currentIndex].service_category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Verified
                    </span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Premium
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(contractors[currentIndex].rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {contractors[currentIndex].rating}
                  </span>
                  <span className="text-gray-600">
                    ({contractors[currentIndex].review_count} reviews)
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 mb-4 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {contractors[currentIndex].location.city},{' '}
                    {contractors[currentIndex].location.region}
                  </span>
                </div>

                {/* Specialties */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Specialties:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {contractors[currentIndex].specialties.map(
                      (specialty, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {specialty}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-600">Experience</div>
                    <div className="font-semibold text-gray-900">
                      {contractors[currentIndex].years_experience} years
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Price Range</div>
                    <div className="font-semibold text-gray-900">
                      {contractors[currentIndex].price_range}
                    </div>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    View Profile
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                    Contact
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={prevContractor}
              className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            {/* Dots indicator */}
            <div className="flex gap-2">
              {contractors.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToContractor(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-blue-600 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextContractor}
              className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* All featured contractors grid */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            All Spotlight Contractors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contractors.map((contractor, index) => (
              <div
                key={contractor.id}
                onClick={() => goToContractor(index)}
                className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  index === currentIndex ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {contractor.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {contractor.business_name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {contractor.service_category}
                    </p>
                  </div>
                  {contractor.is_spotlight && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>

                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-semibold">
                    {contractor.rating}
                  </span>
                  <span className="text-xs text-gray-600">
                    ({contractor.review_count})
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{contractor.location.city}</span>
                </div>

                <div className="text-xs text-gray-500">
                  {contractor.years_experience} years experience
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
            View All Contractors
          </button>
        </div>
      </div>
    </section>
  );
}
