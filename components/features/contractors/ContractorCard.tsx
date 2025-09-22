'use client';

import { Contractor } from '@/types/contractors';
import { ContractorDirectoryService } from '@/lib/contractors/directory-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PremiumBadge } from './PremiumBadge';
import {
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';

interface ContractorCardProps {
  contractor: Contractor;
  viewMode?: 'grid' | 'list';
  isFeatured?: boolean;
  className?: string;
}

export function ContractorCard({
  contractor,
  viewMode = 'grid',
  isFeatured = false,
  className = '',
}: ContractorCardProps) {
  const displayName = ContractorDirectoryService.getDisplayName(contractor);
  const location = ContractorDirectoryService.getLocationDisplay(contractor);
  const isPremium = ContractorDirectoryService.isPremium(contractor);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative">
          <StarIcon className="h-4 w-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }

    return stars;
  };

  const getServiceBadges = () => {
    return contractor.serviceCategories.slice(0, 3).map(category => (
      <Badge key={category} variant="secondary" className="text-xs">
        {ContractorDirectoryService.getServiceCategoryDisplayName(category)}
      </Badge>
    ));
  };

  const getPriceRange = () => {
    if (contractor.services.length === 0) {
      return 'Contact for pricing';
    }

    const prices = contractor.services
      .filter(
        service =>
          service.priceRangeMin !== null || service.priceRangeMax !== null
      )
      .map(service => ({
        min: service.priceRangeMin,
        max: service.priceRangeMax,
      }));

    if (prices.length === 0) {
      return 'Contact for pricing';
    }

    const minPrice = Math.min(...prices.map(p => p.min || 0));
    const maxPrice = Math.max(...prices.map(p => p.max || 0));

    return ContractorDirectoryService.formatPriceRange(minPrice, maxPrice);
  };

  const cardClasses = `
    group relative overflow-hidden transition-all duration-200
    ${
      viewMode === 'grid'
        ? `rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg ${
            isFeatured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
          }`
        : 'rounded-lg border border-gray-200 hover:border-gray-300'
    }
    ${isPremium ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-white'}
    ${className}
  `;

  return (
    <Card className={cardClasses}>
      <div
        className={
          viewMode === 'grid' ? 'p-6' : 'p-6 flex flex-col sm:flex-row'
        }
      >
        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-4 right-4 z-10">
            <PremiumBadge tier={contractor.subscriptionTier} />
          </div>
        )}

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-yellow-500 text-white">Featured</Badge>
          </div>
        )}

        {/* Avatar */}
        <div className={viewMode === 'grid' ? 'mb-4' : 'mb-4 sm:mb-0 sm:mr-6'}>
          <div className="relative w-16 h-16 mx-auto sm:mx-0">
            {contractor.avatarUrl ? (
              <Image
                src={contractor.avatarUrl}
                alt={displayName}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 font-semibold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {displayName}
            </h3>
            {contractor.name !== displayName && (
              <p className="text-sm text-gray-600">{contractor.name}</p>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{location}</span>
          </div>

          {/* Rating */}
          {contractor.reviewCount > 0 && (
            <div className="flex items-center mb-3">
              <div className="flex items-center mr-2">
                {renderStars(contractor.averageRating)}
              </div>
              <span className="text-sm text-gray-600">
                {ContractorDirectoryService.formatRating(
                  contractor.averageRating
                )}{' '}
                ({contractor.reviewCount} review
                {contractor.reviewCount !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          {/* Description */}
          {contractor.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {contractor.description}
            </p>
          )}

          {/* Service Categories */}
          <div className="flex flex-wrap gap-1 mb-3">
            {getServiceBadges()}
            {contractor.serviceCategories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{contractor.serviceCategories.length - 3} more
              </Badge>
            )}
          </div>

          {/* Price Range */}
          <div className="text-sm font-medium text-gray-900 mb-4">
            {getPriceRange()}
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {contractor.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <span>{contractor.phone}</span>
              </div>
            )}
            {contractor.website && (
              <div className="flex items-center text-sm text-gray-600">
                <GlobeAltIcon className="h-4 w-4 mr-2" />
                <a
                  href={contractor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={viewMode === 'grid' ? 'mt-4' : 'mt-4 sm:mt-0 sm:ml-6'}>
          <div className="flex flex-col space-y-2">
            <Link href={`/contractors/${contractor.id}`}>
              <Button className="w-full">Get in Touch</Button>
            </Link>
            <Link href={`/contractors/${contractor.id}`}>
              <Button variant="outline" className="w-full">
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
