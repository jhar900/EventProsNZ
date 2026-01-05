'use client';

import React, { useRef } from 'react';
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
  EnvelopeIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ClockIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  Globe,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import LoginModal from '@/components/features/auth/LoginModal';
import { MessageContractorModal } from './MessageContractorModal';

interface ContractorProfileDisplayProps {
  contractor: Contractor;
  isPreview?: boolean;
  onContactSubmit?: (subject: string, message: string) => Promise<void>;
}

export function ContractorProfileDisplay({
  contractor,
  isPreview = false,
  onContactSubmit,
}: ContractorProfileDisplayProps) {
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);
  const [contactSubject, setContactSubject] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [isSubmittingContact, setIsSubmittingContact] = React.useState(false);
  const [contactSubmitStatus, setContactSubmitStatus] = React.useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [contactErrorMessage, setContactErrorMessage] = React.useState('');
  const getInTouchFormRef = useRef<HTMLDivElement>(null);

  // Portfolio lightbox state
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxMediaIndex, setLightboxMediaIndex] = React.useState(0);

  // Flatten all media items (images and videos) from all portfolio items
  const allMediaItems = React.useMemo(() => {
    if (!contractor.portfolio) return [];
    const media: Array<{
      type: 'image' | 'video';
      url: string;
      portfolioItem: PortfolioItem;
    }> = [];
    contractor.portfolio.forEach(item => {
      if (item.imageUrl) {
        media.push({ type: 'image', url: item.imageUrl, portfolioItem: item });
      }
      if (item.videoUrl) {
        media.push({ type: 'video', url: item.videoUrl, portfolioItem: item });
      }
    });
    return media;
  }, [contractor.portfolio]);

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

  const formatPrice = (service: Service) => {
    if (service.isFree) return 'Free';
    if (service.contactForPricing) return 'Contact for pricing';
    if (service.hidePrice) return 'Price not shown';
    if (service.hourlyRate !== undefined && service.hourlyRate !== null) {
      return `$${service.hourlyRate.toLocaleString()}/hour`;
    }
    if (service.dailyRate !== undefined && service.dailyRate !== null) {
      return `$${service.dailyRate.toLocaleString()}/day`;
    }
    if (service.exactPrice !== undefined && service.exactPrice !== null) {
      return `$${service.exactPrice.toLocaleString()}`;
    }
    const min = service.priceRangeMin;
    const max = service.priceRangeMax;
    if (!min && !max) return 'Contact for pricing';
    if (min && !max) return `From $${min.toLocaleString()}`;
    if (!min && max) return `Up to $${max.toLocaleString()}`;
    if (min === max) return `$${min.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
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

    if (!user) {
      setIsLoginModalOpen(true);
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

    setIsSubmittingContact(true);
    setContactSubmitStatus('idle');
    setContactErrorMessage('');

    try {
      if (onContactSubmit) {
        await onContactSubmit(contactSubject, contactMessage);
        setContactSubmitStatus('success');
        setContactMessage('');
        setContactSubject('');
        setTimeout(() => {
          setContactSubmitStatus('idle');
        }, 3000);
      } else {
        // Default behavior - send inquiry
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (user?.id) {
          headers['x-user-id'] = user.id;
        }

        const response = await fetch(`/api/inquiries/send`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            contractor_id: contractor.id,
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
          setTimeout(() => {
            setContactSubmitStatus('idle');
          }, 3000);
        } else {
          const errorMsg =
            data.message || data.error || 'Failed to send message';
          setContactSubmitStatus('error');
          setContactErrorMessage(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
      setContactSubmitStatus('error');
      setContactErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

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
                {contractor.logoUrl ? (
                  <Image
                    src={contractor.logoUrl}
                    alt={contractor.companyName || displayName}
                    fill
                    className="rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border border-gray-200">
                    <span className="text-gray-500 font-semibold text-3xl">
                      {(contractor.companyName || displayName)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Social Media Links */}
              {((contractor.website && contractor.website.trim() !== '') ||
                contractor.facebookUrl ||
                contractor.instagramUrl ||
                contractor.linkedinUrl ||
                contractor.twitterUrl ||
                contractor.youtubeUrl ||
                contractor.tiktokUrl) && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {contractor.website && contractor.website.trim() !== '' && (
                    <a
                      href={contractor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                      aria-label="Website"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
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
                  <div className="mb-4">
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

              {/* Service Areas */}
              {contractor.serviceAreas &&
                contractor.serviceAreas.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">
                      Service Areas
                    </h3>
                    <div className="flex flex-col gap-2 items-center">
                      {contractor.serviceAreas.map(area => (
                        <div
                          key={area}
                          className="flex items-center text-gray-600 text-sm"
                        >
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          <span>{area}</span>
                        </div>
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

                  {/* Rating */}
                  {contractor.reviewCount > 0 && (
                    <div className="flex items-center mb-3">
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

                  {/* Location */}
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{location}</span>
                  </div>
                </div>

                {/* Right Column: Contact Actions */}
                {!isPreview && (
                  <div className="sm:ml-6 sm:flex-shrink-0">
                    <div className="flex flex-col space-y-3">
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        onClick={() => {
                          if (user) {
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
                )}
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

              {/* Services Offered */}
              {contractor.services && contractor.services.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Services Offered
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contractor.services.map((service: Service) => (
                      <Card
                        key={service.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">
                            {service.serviceType}
                          </h3>
                          <span className="text-orange-600 font-medium text-sm">
                            {formatPrice(service)}
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
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {contractor.portfolio && contractor.portfolio.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Portfolio
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contractor.portfolio.map(
                      (item: PortfolioItem, index: number) => (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => {
                            // Find the first media item for this portfolio item
                            let mediaIndex = 0;
                            for (let i = 0; i < index; i++) {
                              const item = contractor.portfolio![i];
                              if (item.imageUrl) mediaIndex++;
                              if (item.videoUrl) mediaIndex++;
                            }
                            // If this item has an image, start with that; otherwise start with video
                            if (item.imageUrl) {
                              setLightboxMediaIndex(mediaIndex);
                            } else if (item.videoUrl) {
                              setLightboxMediaIndex(mediaIndex);
                            }
                            setLightboxOpen(true);
                          }}
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
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Personal Bio */}
              {contractor.bio && (
                <div className="mb-6">
                  <div className="flex items-start gap-4">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      <div className="relative w-16 h-16">
                        {contractor.avatarUrl ? (
                          <Image
                            src={contractor.avatarUrl}
                            alt={contractor.name}
                            fill
                            className="rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border border-gray-200">
                            <span className="text-gray-500 font-semibold text-xl">
                              {contractor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Bio Content */}
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Main Contact - {contractor.name}
                      </h2>
                      <p
                        className="text-gray-600 leading-relaxed whitespace-pre-line"
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        {contractor.bio}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Get In Touch Form */}
              {(!isPreview && user) || isPreview ? (
                <div ref={getInTouchFormRef}>
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Get In Touch
                    </h3>
                    {isPreview && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> This form is for display
                          purposes only. Visitors will see the functional form
                          on your public profile page.
                        </p>
                      </div>
                    )}
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
                        disabled={
                          isSubmittingContact ||
                          !contactMessage.trim() ||
                          isPreview
                        }
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Testimonials */}
          {contractor.testimonials && contractor.testimonials.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Testimonials
              </h2>
              <div className="space-y-4">
                {contractor.testimonials.map((testimonial: Testimonial) => (
                  <div
                    key={testimonial.id}
                    className="border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center mb-1">
                          {testimonial.rating &&
                            renderStars(testimonial.rating)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {testimonial.clientName}
                          </span>
                          {testimonial.isVerified && (
                            <CheckCircle className="h-4 w-4 text-blue-500 ml-2" />
                          )}
                        </div>
                        {testimonial.comment && (
                          <p className="text-gray-700 text-sm">
                            {testimonial.comment}
                          </p>
                        )}
                      </div>
                    </div>
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
          {/* Sidebar content can be added here in the future */}
        </div>
      </div>

      {/* Portfolio Lightbox */}
      {lightboxOpen &&
        allMediaItems.length > 0 &&
        lightboxMediaIndex >= 0 &&
        lightboxMediaIndex < allMediaItems.length && (
          <PortfolioLightbox
            mediaItem={allMediaItems[lightboxMediaIndex]}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            onPrevious={() => {
              if (lightboxMediaIndex > 0) {
                setLightboxMediaIndex(lightboxMediaIndex - 1);
              }
            }}
            onNext={() => {
              if (lightboxMediaIndex < allMediaItems.length - 1) {
                setLightboxMediaIndex(lightboxMediaIndex + 1);
              }
            }}
            hasPrevious={lightboxMediaIndex > 0}
            hasNext={lightboxMediaIndex < allMediaItems.length - 1}
          />
        )}

      {/* Login Modal */}
      {!isPreview && (
        <>
          <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            redirectOnSuccess={false}
          />

          {/* Message Modal */}
          <MessageContractorModal
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            contractorId={contractor.id}
            contractorName={
              contractor.companyName || contractor.name || 'this contractor'
            }
          />
        </>
      )}
    </div>
  );
}

// Portfolio Lightbox Component
interface MediaItem {
  type: 'image' | 'video';
  url: string;
  portfolioItem: PortfolioItem;
}

interface PortfolioLightboxProps {
  mediaItem: MediaItem;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

function PortfolioLightbox({
  mediaItem,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: PortfolioLightboxProps) {
  const { type, url, portfolioItem } = mediaItem;

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Debug: Log portfolio item data
      console.log('Portfolio lightbox opened:', {
        type,
        url,
        title: portfolioItem.title,
        hasPrevious,
        hasNext,
      });
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, type, url, portfolioItem, hasPrevious, hasNext]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrevious) onPrevious();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext]);

  if (!isOpen) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95"
      onClick={e => {
        // Close if clicking on the backdrop (not the content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative max-w-6xl w-full max-h-[90vh] mx-4 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all shadow-lg"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6 text-gray-900" />
        </button>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* Media */}
          <div
            className="flex-1 bg-gray-100 flex items-center justify-center p-4 lg:p-8 min-h-[300px] lg:min-h-0 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Navigation buttons - Positioned over the media area */}
            {hasPrevious && (
              <button
                onClick={e => {
                  console.log('Previous button clicked!');
                  e.stopPropagation();
                  e.preventDefault();
                  onPrevious();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 p-4 bg-white rounded-full transition-all shadow-lg hover:bg-gray-50 cursor-pointer opacity-100"
                aria-label="Previous"
                style={{ pointerEvents: 'auto' }}
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-900" />
              </button>
            )}

            {hasNext && (
              <button
                onClick={e => {
                  console.log('Next button clicked!');
                  e.stopPropagation();
                  e.preventDefault();
                  onNext();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 p-4 bg-white rounded-full transition-all shadow-lg hover:bg-gray-50 cursor-pointer opacity-100"
                aria-label="Next"
                style={{ pointerEvents: 'auto' }}
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-900" />
              </button>
            )}

            {/* Show image or video based on media type */}
            {type === 'image' ? (
              <div
                className="relative w-full max-w-4xl max-h-[70vh] flex items-center justify-center"
                style={{ pointerEvents: 'none' }}
              >
                <img
                  src={url}
                  alt={portfolioItem.title}
                  className="max-h-[70vh] max-w-full w-auto h-auto rounded-lg shadow-lg object-contain"
                  style={{ maxWidth: '100%', display: 'block' }}
                  onError={e => {
                    console.error('Image failed to load:', url, e);
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.error-message')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className =
                        'error-message w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center';
                      errorDiv.innerHTML =
                        '<p class="text-gray-500">Image failed to load</p>';
                      parent.appendChild(errorDiv);
                    }
                  }}
                  onLoad={() => {
                    // Image loaded successfully
                    console.log('Portfolio image loaded successfully:', url);
                  }}
                />
              </div>
            ) : type === 'video' ? (
              <div className="w-full max-w-4xl">
                <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    src={url}
                    className="w-full h-full"
                    allowFullScreen
                    title={portfolioItem.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    frameBorder="0"
                    style={{ pointerEvents: 'auto' }}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No media available</p>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="w-full lg:w-96 bg-white p-6 lg:p-8 overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-200">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {portfolioItem.title}
                </h3>
                {portfolioItem.description && (
                  <p className="text-gray-700 leading-relaxed text-base">
                    {portfolioItem.description}
                  </p>
                )}
              </div>

              {/* Event Date */}
              {portfolioItem.eventDate && (
                <div className="flex items-center text-gray-600 pt-4 border-t border-gray-200">
                  <CalendarIcon className="h-5 w-5 mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Event Date
                    </p>
                    <p className="text-base">
                      {formatDate(portfolioItem.eventDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
