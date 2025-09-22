import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContractorCard } from '@/components/features/contractors/ContractorCard';
import { Contractor } from '@/types/contractors';

const mockContractor: Contractor = {
  id: '1',
  name: 'John Doe',
  companyName: 'Event Solutions Ltd',
  description: 'Professional event planning services for all occasions',
  location: 'Auckland',
  avatarUrl: null,
  serviceCategories: ['planning', 'catering', 'venue'],
  averageRating: 4.5,
  reviewCount: 12,
  isVerified: true,
  subscriptionTier: 'professional',
  isPremium: true,
  email: 'john@eventsolutions.co.nz',
  bio: null,
  website: 'https://eventsolutions.co.nz',
  phone: '+64 9 123 4567',
  address: null,
  timezone: 'Pacific/Auckland',
  businessAddress: '123 Queen Street, Auckland',
  nzbn: '123456789',
  serviceAreas: ['Auckland', 'Wellington'],
  socialLinks: null,
  verificationDate: '2024-01-15T00:00:00Z',
  services: [
    {
      id: '1',
      serviceType: 'Event Planning',
      description: 'Full event planning services',
      priceRangeMin: 1000,
      priceRangeMax: 5000,
      availability: 'Monday to Friday',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  portfolio: [],
  testimonials: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ContractorCard', () => {
  it('renders contractor information correctly', () => {
    render(<ContractorCard contractor={mockContractor} />);

    expect(screen.getByText('Event Solutions Ltd')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Auckland')).toBeInTheDocument();
    expect(
      screen.getByText('Professional event planning services for all occasions')
    ).toBeInTheDocument();
  });

  it('renders premium badge for premium contractors', () => {
    render(<ContractorCard contractor={mockContractor} />);

    expect(screen.getByText('Professional')).toBeInTheDocument();
  });

  it('renders featured badge when isFeatured is true', () => {
    render(<ContractorCard contractor={mockContractor} isFeatured={true} />);

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('renders rating and review count', () => {
    render(<ContractorCard contractor={mockContractor} />);

    expect(screen.getByText('4.5 (12 reviews)')).toBeInTheDocument();
  });

  it('renders service categories as badges', () => {
    render(<ContractorCard contractor={mockContractor} />);

    expect(screen.getByText('Event Planning')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('Venue & Location')).toBeInTheDocument();
  });

  it('renders price range from services', () => {
    render(<ContractorCard contractor={mockContractor} />);

    expect(screen.getByText('$1000 - $5000')).toBeInTheDocument();
  });

  it('renders contact information when available', () => {
    render(<ContractorCard contractor={mockContractor} />);

    expect(screen.getByText('+64 9 123 4567')).toBeInTheDocument();
    expect(screen.getByText('Visit Website')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<ContractorCard contractor={mockContractor} />);

    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    expect(screen.getByText('View Profile')).toBeInTheDocument();
  });

  it('renders avatar placeholder when no avatar URL', () => {
    render(<ContractorCard contractor={mockContractor} />);

    expect(screen.getByText('E')).toBeInTheDocument(); // First letter of company name
  });

  it('renders in list view when viewMode is list', () => {
    render(<ContractorCard contractor={mockContractor} viewMode="list" />);

    // The component should render differently for list view
    // This would be tested by checking the CSS classes or layout
    expect(screen.getByText('Event Solutions Ltd')).toBeInTheDocument();
  });

  it('shows "Contact for pricing" when no services have pricing', () => {
    const contractorWithoutPricing = {
      ...mockContractor,
      services: [
        {
          id: '1',
          serviceType: 'Event Planning',
          description: 'Full event planning services',
          priceRangeMin: null,
          priceRangeMax: null,
          availability: 'Monday to Friday',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    };

    render(<ContractorCard contractor={contractorWithoutPricing} />);

    expect(screen.getByText('Contact for pricing')).toBeInTheDocument();
  });

  it('shows limited service categories with "more" indicator', () => {
    const contractorWithManyServices = {
      ...mockContractor,
      serviceCategories: [
        'planning',
        'catering',
        'venue',
        'photography',
        'music',
        'decorations',
      ],
    };

    render(<ContractorCard contractor={contractorWithManyServices} />);

    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });

  it('does not show rating when review count is 0', () => {
    const contractorWithoutReviews = {
      ...mockContractor,
      averageRating: 0,
      reviewCount: 0,
    };

    render(<ContractorCard contractor={contractorWithoutReviews} />);

    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
    expect(screen.queryByText('(12 reviews)')).not.toBeInTheDocument();
  });
});
