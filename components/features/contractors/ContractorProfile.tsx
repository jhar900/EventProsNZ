'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Contractor,
  Service,
  PortfolioItem,
  Testimonial,
} from '@/types/contractors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PremiumBadge } from './PremiumBadge';
import {
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';

interface ContractorProfileProps {
  contractorId: string;
}

export function ContractorProfile({ contractorId }: ContractorProfileProps) {
  const { user } = useAuth();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractor = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/contractors/${contractorId}`);

        if (!response.ok) {
          throw new Error('Contractor not found');
        }

        const data = await response.json();
        setContractor(data.contractor);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load contractor'
        );
      } finally {
        setLoading(false);
      }
    };

    if (contractorId) {
      fetchContractor();
    }
  }, [contractorId]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <StarIcon className="h-5 w-5 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <StarSolidIcon className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
      );
    }

    return stars;
  };

  const formatPriceRange = (min: number | null, max: number | null) => {
    if (min === null && max === null) return 'Contact for pricing';
    if (min === null) return `Up to $${max}`;
    if (max === null) return `From $${min}`;
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">
          Loading contractor profile...
        </span>
      </div>
    );
  }

  if (error || !contractor) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Contractor Not Found
        </h3>
        <p className="text-gray-600 mb-4">
          {error || 'This contractor profile does not exist.'}
        </p>
        <Link href="/contractors">
          <Button>Back to Contractors</Button>
        </Link>
      </div>
    );
  }

  const displayName = contractor.companyName || contractor.name;
  const location = contractor.location || 'Location not specified';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            {/* Profile Info */}
            <div className="flex flex-col sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="mb-4 sm:mb-0 sm:mr-6">
                <div className="relative w-24 h-24">
                  {contractor.avatarUrl ? (
                    <Image
                      src={contractor.avatarUrl}
                      alt={displayName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 font-semibold text-2xl">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 mr-3">
                    {displayName}
                  </h1>
                  {contractor.isVerified && (
                    <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
                  )}
                  {contractor.isPremium && (
                    <div className="ml-2">
                      <PremiumBadge tier={contractor.subscriptionTier} />
                    </div>
                  )}
                </div>

                {contractor.name !== displayName && (
                  <p className="text-lg text-gray-600 mb-2">
                    {contractor.name}
                  </p>
                )}

                {/* Location */}
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  <span>{location}</span>
                </div>

                {/* Rating */}
                {contractor.reviewCount > 0 && (
                  <div className="flex items-center mb-4">
                    <div className="flex items-center mr-2">
                      {renderStars(contractor.averageRating)}
                    </div>
                    <span className="text-gray-600">
                      {contractor.averageRating.toFixed(1)} (
                      {contractor.reviewCount} review
                      {contractor.reviewCount !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}

                {/* Description */}
                {contractor.description && (
                  <p className="text-gray-700 mb-4">{contractor.description}</p>
                )}

                {/* Bio */}
                {contractor.bio && (
                  <p className="text-gray-600 mb-4">{contractor.bio}</p>
                )}
              </div>
            </div>

            {/* Contact Actions */}
            <div className="mt-6 lg:mt-0 lg:ml-6">
              <div className="flex flex-col space-y-3">
                {user ? (
                  <>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      <EnvelopeIcon className="h-5 w-5 mr-2" />
                      Send Message
                    </Button>
                    {contractor.phone && (
                      <Button variant="outline" className="w-full">
                        <PhoneIcon className="h-5 w-5 mr-2" />
                        Call Now
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Sign in to contact this contractor
                    </p>
                    <Link href="/login">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        Sign In to Contact
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          {contractor.services && contractor.services.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Services Offered
              </h2>
              <div className="space-y-4">
                {contractor.services.map((service: Service) => (
                  <div
                    key={service.id}
                    className="border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">
                        {service.serviceType}
                      </h3>
                      <span className="text-orange-600 font-medium">
                        {formatPriceRange(
                          service.priceRangeMin,
                          service.priceRangeMax
                        )}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-gray-600 text-sm mb-2">
                        {service.description}
                      </p>
                    )}
                    {service.availability && (
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{service.availability}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Portfolio */}
          {contractor.portfolio && contractor.portfolio.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Portfolio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contractor.portfolio.map((item: PortfolioItem) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {item.imageUrl && (
                      <div className="aspect-w-16 aspect-h-9">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-2">
                          {item.description}
                        </p>
                      )}
                      {item.eventDate && (
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>{formatDate(item.eventDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Testimonials */}
          {contractor.testimonials && contractor.testimonials.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Client Reviews
              </h2>
              <div className="space-y-4">
                {contractor.testimonials.map((testimonial: Testimonial) => (
                  <div
                    key={testimonial.id}
                    className="border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900 mr-2">
                          {testimonial.clientName}
                        </h4>
                        {testimonial.isVerified && (
                          <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      {testimonial.rating && (
                        <div className="flex items-center">
                          {renderStars(testimonial.rating)}
                        </div>
                      )}
                    </div>
                    {testimonial.comment && (
                      <p className="text-gray-600 mb-2">
                        &ldquo;{testimonial.comment}&rdquo;
                      </p>
                    )}
                    {testimonial.eventTitle && (
                      <p className="text-sm text-gray-500">
                        Event: {testimonial.eventTitle}
                        {testimonial.eventDate &&
                          ` (${formatDate(testimonial.eventDate)})`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="space-y-3">
              {contractor.phone && (
                <div className="flex items-center text-gray-600">
                  <PhoneIcon className="h-5 w-5 mr-3" />
                  <span>{contractor.phone}</span>
                </div>
              )}
              {contractor.website && (
                <div className="flex items-center text-gray-600">
                  <GlobeAltIcon className="h-5 w-5 mr-3" />
                  <a
                    href={contractor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-orange-600 transition-colors"
                  >
                    Visit Website
                  </a>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <EnvelopeIcon className="h-5 w-5 mr-3" />
                <span>{contractor.email}</span>
              </div>
            </div>
          </Card>

          {/* Service Categories */}
          {contractor.serviceCategories &&
            contractor.serviceCategories.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Service Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contractor.serviceCategories.map(category => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-sm"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

          {/* Service Areas */}
          {contractor.serviceAreas && contractor.serviceAreas.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Service Areas
              </h3>
              <div className="space-y-2">
                {contractor.serviceAreas.map(area => (
                  <div key={area} className="flex items-center text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Business Details */}
          {(contractor.nzbn || contractor.businessAddress) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Business Details
              </h3>
              <div className="space-y-3">
                {contractor.nzbn && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      NZBN:
                    </span>
                    <p className="text-gray-900">{contractor.nzbn}</p>
                  </div>
                )}
                {contractor.businessAddress && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Business Address:
                    </span>
                    <p className="text-gray-900">
                      {contractor.businessAddress}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
