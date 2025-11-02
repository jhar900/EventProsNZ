'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Send,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import LoginModal from '@/components/features/auth/LoginModal';
import { MessageContractorModal } from './MessageContractorModal';

interface ContractorProfileProps {
  contractorId: string;
}

export function ContractorProfile({ contractorId }: ContractorProfileProps) {
  const { user } = useAuth();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitStatus, setContactSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [contactErrorMessage, setContactErrorMessage] = useState('');
  const getInTouchFormRef = useRef<HTMLDivElement>(null);

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submitted - User:', user);
    console.log('User ID:', user?.id);

    if (!user) {
      console.log('No user - opening login modal');
      setIsLoginModalOpen(true);
      return;
    }

    if (!user.id) {
      console.log('User exists but no ID:', user);
      setContactSubmitStatus('error');
      setContactErrorMessage('User ID not found. Please try logging in again.');
      return;
    }

    if (!contactMessage.trim()) {
      setContactSubmitStatus('error');
      setContactErrorMessage('Please enter a message');
      return;
    }

    if (contactMessage.length > 2000) {
      setContactSubmitStatus('error');
      setContactErrorMessage('Message must be 2000 characters or less');
      return;
    }

    if (!contractor) return;

    setIsSubmittingContact(true);
    setContactSubmitStatus('idle');
    setContactErrorMessage('');

    try {
      // Include user ID in headers if available (fallback if cookies don't work)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (user?.id) {
        headers['x-user-id'] = user.id;
        console.log('Sending user ID in header:', user.id);
      } else {
        console.log('No user ID available:', user);
      }

      const response = await fetch(`/api/inquiries/send`, {
        method: 'POST',
        headers,
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
          contractor_id: contractorId,
          inquiry_type: 'general',
          subject:
            contactSubject.trim() ||
            `Inquiry for ${contractor.companyName || contractor.name}`,
          message: contactMessage.trim(),
          priority: 'medium',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setContactSubmitStatus('success');
        setContactMessage('');
        setContactSubject('');
        // Reset success message after 3 seconds
        setTimeout(() => {
          setContactSubmitStatus('idle');
        }, 3000);
      } else {
        const errorMsg = data.message || data.error || 'Failed to send message';
        const errorDetails =
          data.error_hint || data.error_code
            ? `${errorMsg}${data.error_code ? ` (Code: ${data.error_code})` : ''}${data.error_hint ? ` - ${data.error_hint}` : ''}`
            : errorMsg;
        console.error('Inquiry submission error:', data);
        setContactSubmitStatus('error');
        setContactErrorMessage(errorDetails);
      }
    } catch (error) {
      console.error('Network error submitting inquiry:', error);
      setContactSubmitStatus('error');
      setContactErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
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
          {/* Avatar and Social Media */}
          <div className="flex flex-col sm:flex-row sm:items-start mb-6">
            <div className="mb-4 sm:mb-0 sm:mr-6 flex flex-col items-center">
              <div className="relative w-32 h-32 mb-3">
                {contractor.logoUrl || contractor.avatarUrl ? (
                  <Image
                    src={contractor.logoUrl || contractor.avatarUrl || ''}
                    alt={displayName}
                    fill
                    className="rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border border-gray-200">
                    <span className="text-gray-500 font-semibold text-3xl">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Social Media Links */}
              {(contractor.facebookUrl ||
                contractor.instagramUrl ||
                contractor.linkedinUrl ||
                contractor.twitterUrl ||
                contractor.youtubeUrl ||
                contractor.tiktokUrl) && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {contractor.facebookUrl && (
                    <a
                      href={contractor.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {contractor.instagramUrl && (
                    <a
                      href={contractor.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-pink-600 transition-colors duration-200"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {contractor.linkedinUrl && (
                    <a
                      href={contractor.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-700 transition-colors duration-200"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {contractor.twitterUrl && (
                    <a
                      href={contractor.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-400 transition-colors duration-200"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {contractor.youtubeUrl && (
                    <a
                      href={contractor.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-red-600 transition-colors duration-200"
                      aria-label="YouTube"
                    >
                      <Youtube className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}

              {/* Service Categories */}
              {contractor.serviceCategories &&
                contractor.serviceCategories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">
                      Service Categories
                    </h3>
                    <div className="flex flex-col gap-2 items-center">
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
                  </div>
                )}
            </div>

            <div className="flex-1">
              {/* Top Row: Title + Location (left) and Send Message Button (right) */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                {/* Left Column: Title and Location */}
                <div className="flex-1 mb-4 sm:mb-0 sm:mr-6">
                  {/* Title */}
                  <div className="flex items-center mb-3">
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

                  {/* Location */}
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{location}</span>
                  </div>
                </div>

                {/* Right Column: Contact Actions */}
                <div className="sm:ml-6 sm:flex-shrink-0">
                  <div className="flex flex-col space-y-3">
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => {
                        if (user) {
                          // Scroll to the Get In Touch form
                          getInTouchFormRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        } else {
                          setIsLoginModalOpen(true);
                        }
                      }}
                    >
                      <EnvelopeIcon className="h-5 w-5 mr-2" />
                      Send Message
                    </Button>
                    {contractor.phone && (
                      <Button variant="outline" className="w-full">
                        <PhoneIcon className="h-5 w-5 mr-2" />
                        Call Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Bio Container */}
              {contractor.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    About {contractor.companyName || 'the Company'}
                  </h2>
                  <p
                    className="text-gray-700 leading-relaxed whitespace-pre-line"
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {contractor.description}
                  </p>
                </div>
              )}

              {/* Get In Touch Form - Only shown to logged-in users */}
              {user && (
                <div ref={getInTouchFormRef}>
                  <Card className="p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Get In Touch
                    </h3>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="contact-subject">
                          Subject (Optional)
                        </Label>
                        <input
                          type="text"
                          id="contact-subject"
                          value={contactSubject}
                          onChange={e => setContactSubject(e.target.value)}
                          maxLength={200}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="e.g., Event planning inquiry"
                        />
                      </div>

                      <div>
                        <Label htmlFor="contact-message">
                          Message <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="contact-message"
                          value={contactMessage}
                          onChange={e => setContactMessage(e.target.value)}
                          rows={4}
                          maxLength={2000}
                          required
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="Type your message here..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {contactMessage.length}/2000 characters
                        </p>
                      </div>

                      {/* Status Messages */}
                      {contactSubmitStatus === 'success' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-sm text-green-800">
                              Message sent successfully!
                            </p>
                          </div>
                        </div>
                      )}

                      {contactSubmitStatus === 'error' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <p className="text-sm text-red-800">
                              {contactErrorMessage}
                            </p>
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmittingContact || !contactMessage.trim()}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {isSubmittingContact ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </div>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Card>
                </div>
              )}

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

              {/* Personal Bio */}
              {contractor.bio && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    About {contractor.name}
                  </h2>
                  <p
                    className="text-gray-600 leading-relaxed whitespace-pre-line"
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {contractor.bio}
                  </p>
                </div>
              )}
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

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectOnSuccess={false}
      />

      {/* Message Modal */}
      {contractor && (
        <MessageContractorModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          contractorId={contractorId}
          contractorName={
            contractor.companyName || contractor.name || 'this contractor'
          }
        />
      )}
    </div>
  );
}
