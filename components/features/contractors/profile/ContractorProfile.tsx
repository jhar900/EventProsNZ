'use client';

import { useState, useEffect } from 'react';
import { Contractor } from '@/types/contractors';
import { ContractorDirectoryService } from '@/lib/contractors/directory-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { PremiumBadge } from '../PremiumBadge';
import { PortfolioGallery } from './PortfolioGallery';
import { ServicesSection } from './ServicesSection';
import { TestimonialsSection } from './TestimonialsSection';
import { ContactSection } from './ContactSection';
import { VerificationBadges } from './VerificationBadges';
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary';
import {
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ShareIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';

interface ContractorProfileProps {
  contractor: Contractor;
  className?: string;
}

export function ContractorProfile({
  contractor,
  className = '',
}: ContractorProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    // Set share URL
    setShareUrl(window.location.href);

    // Check if contractor is in favorites (mock implementation)
    // In real app, this would check user's favorites from API
    setIsFavorite(false);
  }, [contractor.id]);

  const displayName = ContractorDirectoryService.getDisplayName(contractor);
  const location = ContractorDirectoryService.getLocationDisplay(contractor);
  const isPremium = ContractorDirectoryService.isPremium(contractor);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} - Contractor Profile`,
          text: `Check out ${displayName}'s profile on EventPros NZ`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      // You could show a toast notification here
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In real app, this would make an API call to add/remove from favorites
  };

  return (
    <div className={`contractor-profile ${className}`}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6">
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
          </div>

          {/* Avatar and Actions */}
          <div className="flex flex-col items-center lg:items-end space-y-4">
            {/* Avatar */}
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" variant="outline" onClick={handleShare}>
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFavorite}
                className={isFavorite ? 'text-red-600 border-red-300' : ''}
              >
                {isFavorite ? (
                  <HeartSolidIcon className="h-4 w-4 mr-2" />
                ) : (
                  <HeartIcon className="h-4 w-4 mr-2" />
                )}
                {isFavorite ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="flex-1 sm:flex-none">
            Get in Touch
          </Button>
          <Button variant="outline" size="lg" className="flex-1 sm:flex-none">
            Request Quote
          </Button>
          <Button variant="outline" size="lg" className="flex-1 sm:flex-none">
            View Portfolio
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'services', label: 'Services' },
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'reviews', label: `Reviews (${contractor.reviewCount})` },
            { id: 'contact', label: 'Contact' },
            { id: 'verification', label: 'Verification' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
            <SectionErrorBoundary sectionName="Services">
              <ServicesSection contractorId={contractor.id} />
            </SectionErrorBoundary>
          )}

          {activeTab === 'portfolio' && (
            <SectionErrorBoundary sectionName="Portfolio">
              <PortfolioGallery contractorId={contractor.id} />
            </SectionErrorBoundary>
          )}

          {activeTab === 'reviews' && (
            <SectionErrorBoundary sectionName="Reviews">
              <TestimonialsSection
                contractorId={contractor.id}
                initialAverageRating={contractor.averageRating}
                initialReviewCount={contractor.reviewCount}
              />
            </SectionErrorBoundary>
          )}

          {activeTab === 'contact' && (
            <SectionErrorBoundary sectionName="Contact">
              <ContactSection
                contractorId={contractor.id}
                contractorEmail={contractor.email}
                contractorPhone={contractor.phone}
                contractorWebsite={contractor.website}
                contractorAddress={contractor.businessAddress}
              />
            </SectionErrorBoundary>
          )}

          {activeTab === 'verification' && (
            <SectionErrorBoundary sectionName="Verification">
              <VerificationBadges contractorId={contractor.id} />
            </SectionErrorBoundary>
          )}
        </div>
      </Tabs>
    </div>
  );
}
