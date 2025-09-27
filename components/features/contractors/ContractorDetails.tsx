'use client';

import { useState, useEffect } from 'react';
import { Contractor, Service, Testimonial } from '@/types/contractors';
import { ContractorDirectoryService } from '@/lib/contractors/directory-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { PremiumBadge } from './PremiumBadge';
import {
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';

interface ContractorDetailsProps {
  contractor: Contractor;
  className?: string;
}

export function ContractorDetails({
  contractor,
  className = '',
}: ContractorDetailsProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const displayName = ContractorDirectoryService.getDisplayName(contractor);
  const location = ContractorDirectoryService.getLocationDisplay(contractor);
  const isPremium = ContractorDirectoryService.isPremium(contractor);

  useEffect(() => {
    // Load services and reviews
    const loadData = async () => {
      setIsLoadingServices(true);
      setIsLoadingReviews(true);

      try {
        const [servicesResponse, reviewsResponse] = await Promise.all([
          ContractorDirectoryService.getContractorServices(contractor.id),
          ContractorDirectoryService.getContractorReviews(contractor.id),
        ]);

        setServices(servicesResponse.services);
        setReviews(reviewsResponse.reviews);
      } catch (error) {
        } finally {
        setIsLoadingServices(false);
        setIsLoadingReviews(false);
      }
    };

    loadData();
  }, [contractor.id]);

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

  const getServiceBadges = () => {
    return contractor.serviceCategories.map(category => (
      <Badge key={category} variant="secondary" className="text-sm">
        {ContractorDirectoryService.getServiceCategoryDisplayName(category)}
      </Badge>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={`contractor-details ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {displayName}
              </h1>
              {isPremium && (
                <PremiumBadge tier={contractor.subscriptionTier} size="lg" />
              )}
              {contractor.isVerified && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            {contractor.name !== displayName && (
              <p className="text-lg text-gray-600 mb-2">{contractor.name}</p>
            )}
            <div className="flex items-center text-gray-600 mb-4">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span>{location}</span>
            </div>
          </div>

          {/* Avatar */}
          <div className="ml-6">
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
        </div>

        {/* Rating and Reviews */}
        {contractor.reviewCount > 0 && (
          <div className="flex items-center mb-4">
            <div className="flex items-center mr-3">
              {renderStars(contractor.averageRating)}
            </div>
            <span className="text-lg font-medium text-gray-900">
              {ContractorDirectoryService.formatRating(
                contractor.averageRating
              )}
            </span>
            <span className="text-gray-600 ml-2">
              ({contractor.reviewCount} review
              {contractor.reviewCount !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="flex-1 sm:flex-none">
            Get in Touch
          </Button>
          <Button variant="outline" size="lg" className="flex-1 sm:flex-none">
            Request Quote
          </Button>
          <Button variant="outline" size="lg" className="flex-1 sm:flex-none">
            Save to Favorites
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'services'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'portfolio'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reviews ({contractor.reviewCount})
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              {contractor.description && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    About
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {contractor.description}
                  </p>
                </Card>
              )}

              {/* Service Categories */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Service Categories
                </h3>
                <div className="flex flex-wrap gap-2">{getServiceBadges()}</div>
              </Card>

              {/* Contact Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {contractor.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-700">{contractor.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">{contractor.email}</span>
                  </div>
                  {contractor.website && (
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={contractor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {contractor.website}
                      </a>
                    </div>
                  )}
                  {contractor.businessAddress && (
                    <div className="flex items-start">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <span className="text-gray-700">
                        {contractor.businessAddress}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'services' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Services Offered
              </h3>
              {isLoadingServices ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading services...</p>
                </div>
              ) : services.length > 0 ? (
                <div className="space-y-4">
                  {services.map(service => (
                    <div
                      key={service.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {service.serviceType}
                        </h4>
                        <span className="text-sm font-medium text-gray-600">
                          {ContractorDirectoryService.formatPriceRange(
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
              ) : (
                <p className="text-gray-600">No services listed yet.</p>
              )}
            </Card>
          )}

          {activeTab === 'portfolio' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Portfolio
              </h3>
              {contractor.portfolio && contractor.portfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contractor.portfolio.map(item => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {item.imageUrl && (
                        <div className="aspect-video relative">
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.title}
                        </h4>
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
              ) : (
                <p className="text-gray-600">
                  No portfolio items available yet.
                </p>
              )}
            </Card>
          )}

          {activeTab === 'reviews' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Reviews
              </h3>
              {isLoadingReviews ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading reviews...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div
                      key={review.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {review.clientName}
                          </h4>
                          {review.eventTitle && (
                            <p className="text-sm text-gray-600">
                              {review.eventTitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          {review.rating && (
                            <div className="flex items-center mr-2">
                              {renderStars(review.rating)}
                            </div>
                          )}
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                      {review.isVerified && (
                        <div className="flex items-center mt-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600">
                            Verified Review
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet.</p>
              )}
            </Card>
          )}
        </div>
      </Tabs>
    </div>
  );
}
