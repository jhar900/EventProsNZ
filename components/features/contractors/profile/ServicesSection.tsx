'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AsyncErrorBoundary } from '@/components/ui/async-error-boundary';
import {
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Service {
  id: string;
  serviceType: string;
  description?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  exactPrice?: number;
  hidePrice?: boolean;
  contactForPricing?: boolean;
  isFree?: boolean;
  availability?: string;
  isVisible: boolean;
  createdAt: string;
}

interface ServicesSectionProps {
  contractorId: string;
  initialServices?: Service[];
  className?: string;
  onError?: (error: Error) => void;
}

export function ServicesSection({
  contractorId,
  initialServices = [],
  className = '',
  onError,
}: ServicesSectionProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contractors/${contractorId}/services`);
      const data = await response.json();

      if (response.ok) {
        // Map API response (snake_case) to component Service interface (camelCase)
        const mappedServices = (data.services || []).map((s: any) => ({
          id: s.id,
          serviceType:
            s.service_name || s.name || s.service_type || s.category || '',
          description: s.description || null,
          priceRangeMin: s.price_range_min || null,
          priceRangeMax: s.price_range_max || null,
          exactPrice: s.exact_price || null,
          hourlyRate: s.hourly_rate || null,
          dailyRate: s.daily_rate || null,
          hidePrice: s.hide_price || false,
          contactForPricing: s.contact_for_pricing || false,
          isFree: s.is_free || false,
          availability: s.availability || null,
          isVisible: s.is_visible !== false,
          createdAt: s.created_at || new Date().toISOString(),
        }));
        setServices(mappedServices);
      } else {
        const errorMessage = data.error || 'Failed to load services';
        setError(errorMessage);
        if (onError) {
          onError(new Error(errorMessage));
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Network error loading services';
      setError(errorMessage);
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialServices.length === 0) {
      loadServices();
    }
  }, [contractorId]);

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

  const getAvailabilityStatus = (availability?: string) => {
    if (!availability)
      return {
        status: 'unknown',
        text: 'Contact for availability',
        color: 'gray',
      };

    const lowerAvailability = availability.toLowerCase();
    if (
      lowerAvailability.includes('available') ||
      lowerAvailability.includes('open')
    ) {
      return { status: 'available', text: 'Available', color: 'green' };
    }
    if (
      lowerAvailability.includes('busy') ||
      lowerAvailability.includes('limited')
    ) {
      return {
        status: 'limited',
        text: 'Limited availability',
        color: 'yellow',
      };
    }
    if (
      lowerAvailability.includes('unavailable') ||
      lowerAvailability.includes('closed')
    ) {
      return {
        status: 'unavailable',
        text: 'Currently unavailable',
        color: 'red',
      };
    }

    return { status: 'custom', text: availability, color: 'blue' };
  };

  const getServiceCategoryColor = (serviceType: string) => {
    const colors = {
      photography: 'blue',
      videography: 'purple',
      catering: 'green',
      music: 'pink',
      decorations: 'yellow',
      venue: 'indigo',
      planning: 'red',
      entertainment: 'orange',
    };

    const lowerType = serviceType.toLowerCase();
    for (const [category, color] of Object.entries(colors)) {
      if (lowerType.includes(category)) {
        return color;
      }
    }

    return 'gray';
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading services...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 border-red-200 bg-red-50 ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Services
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={loadServices}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Services Offered
        </h3>
        <div className="text-center py-8">
          <InformationCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Services Listed
          </h4>
          <p className="text-gray-600">
            This contractor hasn&apos;t added any services yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`services-section ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Services Offered
          </h3>
          <Badge variant="secondary" className="text-sm">
            {services.length} service{services.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="space-y-4">
          {services.map(service => {
            const availability = getAvailabilityStatus(service.availability);
            const categoryColor = getServiceCategoryColor(service.serviceType);

            return (
              <div
                key={service.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 text-lg">
                        {service.serviceType}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`text-xs bg-${categoryColor}-100 text-${categoryColor}-800`}
                      >
                        {service.serviceType}
                      </Badge>
                    </div>

                    {service.description && (
                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {/* Pricing */}
                  <div className="flex items-center text-gray-700">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="font-medium">{formatPrice(service)}</span>
                  </div>

                  {/* Availability */}
                  <div className="flex items-center">
                    {availability.status === 'available' && (
                      <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                    )}
                    {availability.status === 'unavailable' && (
                      <XCircleIcon className="h-4 w-4 mr-1 text-red-500" />
                    )}
                    {availability.status === 'limited' && (
                      <ClockIcon className="h-4 w-4 mr-1 text-yellow-500" />
                    )}
                    {availability.status === 'unknown' && (
                      <InformationCircleIcon className="h-4 w-4 mr-1 text-gray-400" />
                    )}
                    <span className={`text-${availability.color}-600`}>
                      {availability.text}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    Get Quote
                  </Button>
                  <Button size="sm" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service Packages Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Service Packages
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Basic Package */}
            <Card className="p-4 border-2 border-gray-200">
              <div className="text-center">
                <h5 className="font-medium text-gray-900 mb-2">
                  Basic Package
                </h5>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  $500+
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Essential services for small events
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• Up to 4 hours service</li>
                  <li>• Basic setup included</li>
                  <li>• Standard equipment</li>
                </ul>
                <Button size="sm" variant="outline" className="w-full">
                  Choose Basic
                </Button>
              </div>
            </Card>

            {/* Professional Package */}
            <Card className="p-4 border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Most Popular</Badge>
              </div>
              <div className="text-center">
                <h5 className="font-medium text-gray-900 mb-2">
                  Professional Package
                </h5>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  $1,200+
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive services for medium events
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• Up to 8 hours service</li>
                  <li>• Premium setup included</li>
                  <li>• Professional equipment</li>
                  <li>• Planning consultation</li>
                </ul>
                <Button size="sm" className="w-full">
                  Choose Professional
                </Button>
              </div>
            </Card>

            {/* Premium Package */}
            <Card className="p-4 border-2 border-gray-200">
              <div className="text-center">
                <h5 className="font-medium text-gray-900 mb-2">
                  Premium Package
                </h5>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  $2,500+
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Full-service solution for large events
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• Up to 12 hours service</li>
                  <li>• Full setup & breakdown</li>
                  <li>• Premium equipment</li>
                  <li>• Dedicated coordinator</li>
                  <li>• Post-event support</li>
                </ul>
                <Button size="sm" variant="outline" className="w-full">
                  Choose Premium
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <h5 className="font-medium text-gray-900 mb-2">
              Need a Custom Package?
            </h5>
            <p className="text-sm text-gray-600 mb-4">
              Contact us to discuss your specific event requirements and get a
              personalized quote.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Contact for Custom Quote
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
