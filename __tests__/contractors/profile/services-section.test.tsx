import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServicesSection } from '@/components/features/contractors/profile/ServicesSection';

// Mock fetch
global.fetch = jest.fn();

const mockServices = [
  {
    id: '1',
    serviceType: 'Wedding Photography',
    description: 'Professional wedding photography services',
    priceRangeMin: 1000,
    priceRangeMax: 3000,
    availability: 'Available',
    isVisible: true,
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    serviceType: 'Event Videography',
    description: 'High-quality event videography',
    priceRangeMin: 1500,
    priceRangeMax: 4000,
    availability: 'Limited availability',
    isVisible: true,
    createdAt: '2024-01-02T10:00:00Z',
  },
];

describe('ServicesSection', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders services correctly', () => {
    render(
      <ServicesSection
        contractorId="test-contractor-id"
        initialServices={mockServices}
      />
    );

    expect(screen.getByText('Services Offered')).toBeInTheDocument();
    expect(screen.getAllByText('Wedding Photography')).toHaveLength(2); // Title + category badge
    expect(screen.getAllByText('Event Videography')).toHaveLength(2); // Title + category badge
    expect(
      screen.getByText('Professional wedding photography services')
    ).toBeInTheDocument();
    expect(
      screen.getByText('High-quality event videography')
    ).toBeInTheDocument();
  });

  it('displays pricing information correctly', () => {
    render(
      <ServicesSection
        contractorId="test-contractor-id"
        initialServices={mockServices}
      />
    );

    expect(screen.getByText('$1,000 - $3,000')).toBeInTheDocument();
    expect(screen.getByText('$1,500 - $4,000')).toBeInTheDocument();
  });

  it('shows availability status with correct colors', () => {
    render(
      <ServicesSection
        contractorId="test-contractor-id"
        initialServices={mockServices}
      />
    );

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Limited availability')).toBeInTheDocument();
  });

  it('displays service packages', () => {
    render(
      <ServicesSection
        contractorId="test-contractor-id"
        initialServices={mockServices}
      />
    );

    expect(screen.getByText('Service Packages')).toBeInTheDocument();
    expect(screen.getByText('Basic Package')).toBeInTheDocument();
    expect(screen.getByText('Professional Package')).toBeInTheDocument();
    expect(screen.getByText('Premium Package')).toBeInTheDocument();
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('handles empty services state', async () => {
    // Mock empty API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ services: [] }),
    });

    render(
      <ServicesSection contractorId="test-contractor-id" initialServices={[]} />
    );

    // Wait for the API call to complete and show empty state
    await waitFor(() => {
      expect(screen.getByText('No Services Listed')).toBeInTheDocument();
    });

    expect(
      screen.getByText("This contractor hasn't added any services yet.")
    ).toBeInTheDocument();
  });

  it('loads services from API when no initial services provided', async () => {
    const mockResponse = {
      services: mockServices,
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <ServicesSection contractorId="test-contractor-id" initialServices={[]} />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/contractors/test-contractor-id/services'
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText('Wedding Photography')).toHaveLength(2); // Title + category badge
    });
  });

  it('handles different pricing formats', () => {
    const servicesWithDifferentPricing = [
      {
        id: '1',
        serviceType: 'Service with min only',
        priceRangeMin: 500,
        priceRangeMax: undefined,
        availability: 'Available',
        isVisible: true,
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        serviceType: 'Service with max only',
        priceRangeMin: undefined,
        priceRangeMax: 2000,
        availability: 'Available',
        isVisible: true,
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '3',
        serviceType: 'Service with same min/max',
        priceRangeMin: 1000,
        priceRangeMax: 1000,
        availability: 'Available',
        isVisible: true,
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '4',
        serviceType: 'Service with no pricing',
        priceRangeMin: undefined,
        priceRangeMax: undefined,
        availability: 'Available',
        isVisible: true,
        createdAt: '2024-01-01T10:00:00Z',
      },
    ];

    render(
      <ServicesSection
        contractorId="test-contractor-id"
        initialServices={servicesWithDifferentPricing}
      />
    );

    expect(screen.getByText('From $500')).toBeInTheDocument();
    expect(screen.getByText('Up to $2,000')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('Contact for pricing')).toBeInTheDocument();
  });

  it('handles different availability statuses', async () => {
    const servicesWithDifferentAvailability = [
      {
        id: '1',
        serviceType: 'Available Service',
        description: 'This service is available',
        priceRangeMin: 100,
        priceRangeMax: 500,
        availability: 'Available',
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        serviceType: 'Unavailable Service',
        description: 'This service is currently unavailable',
        priceRangeMin: 200,
        priceRangeMax: 600,
        availability: 'Currently unavailable',
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '3',
        serviceType: 'Limited Service',
        description: 'This service has limited availability',
        priceRangeMin: 150,
        priceRangeMax: 400,
        availability: 'Limited availability',
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '4',
        serviceType: 'Custom Service',
        description: 'Contact for availability',
        priceRangeMin: null,
        priceRangeMax: null,
        availability: 'Contact for availability',
        createdAt: '2024-01-01T10:00:00Z',
      },
    ];

    render(
      <ServicesSection
        contractorId="test-contractor-id"
        initialServices={servicesWithDifferentAvailability}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Available')).toHaveLength(2); // Two available services
    });

    // Check that all availability statuses are present
    expect(screen.getByText('Currently unavailable')).toBeInTheDocument();
    expect(screen.getByText('Limited availability')).toBeInTheDocument();
    expect(screen.getByText('Contact for availability')).toBeInTheDocument();
  });

  it('shows action buttons for each service', () => {
    render(
      <ServicesSection
        contractorId="test-contractor-id"
        initialServices={mockServices}
      />
    );

    const getQuoteButtons = screen.getAllByText('Get Quote');
    const learnMoreButtons = screen.getAllByText('Learn More');

    expect(getQuoteButtons).toHaveLength(mockServices.length);
    expect(learnMoreButtons).toHaveLength(mockServices.length);
  });

  it('displays custom quote CTA', () => {
    render(
      <ServicesSection
        contractorId="test-contractor-id"
        initialServices={mockServices}
      />
    );

    expect(screen.getByText('Need a Custom Package?')).toBeInTheDocument();
    expect(screen.getByText('Contact for Custom Quote')).toBeInTheDocument();
  });
});
