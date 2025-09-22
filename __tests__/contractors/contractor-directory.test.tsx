import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractorDirectory } from '@/components/features/contractors/ContractorDirectory';
import { useContractors } from '@/hooks/useContractors';

// Mock the useContractors hook
jest.mock('@/hooks/useContractors');
const mockUseContractors = useContractors as jest.MockedFunction<
  typeof useContractors
>;

// Mock contractor data
const mockContractors = [
  {
    id: '1',
    name: 'John Doe',
    companyName: 'Event Solutions Ltd',
    description: 'Professional event planning services',
    location: 'Auckland',
    avatarUrl: null,
    serviceCategories: ['planning', 'catering'],
    averageRating: 4.5,
    reviewCount: 12,
    isVerified: true,
    subscriptionTier: 'professional' as const,
    isPremium: true,
    email: 'john@eventsolutions.co.nz',
    bio: null,
    website: null,
    phone: null,
    address: null,
    timezone: 'Pacific/Auckland',
    businessAddress: null,
    nzbn: null,
    serviceAreas: ['Auckland', 'Wellington'],
    socialLinks: null,
    verificationDate: '2024-01-15T00:00:00Z',
    services: [],
    portfolio: [],
    testimonials: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    companyName: 'Perfect Photography',
    description: 'Wedding and event photography',
    location: 'Wellington',
    avatarUrl: null,
    serviceCategories: ['photography'],
    averageRating: 4.8,
    reviewCount: 25,
    isVerified: true,
    subscriptionTier: 'essential' as const,
    isPremium: false,
    email: 'jane@perfectphoto.co.nz',
    bio: null,
    website: null,
    phone: null,
    address: null,
    timezone: 'Pacific/Auckland',
    businessAddress: null,
    nzbn: null,
    serviceAreas: ['Wellington', 'Christchurch'],
    socialLinks: null,
    verificationDate: '2024-02-01T00:00:00Z',
    services: [],
    portfolio: [],
    testimonials: [],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

const mockFeaturedContractors = [
  {
    ...mockContractors[0],
    isFeatured: true,
  },
];

const defaultMockReturn = {
  contractors: mockContractors,
  featuredContractors: mockFeaturedContractors,
  currentContractor: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 12,
    total: 2,
    totalPages: 1,
  },
  viewMode: 'grid' as const,
  isLoading: false,
  error: null,
  fetchContractors: jest.fn(),
  searchContractors: jest.fn(),
  fetchFeaturedContractors: jest.fn(),
  fetchContractorDetails: jest.fn(),
  setViewMode: jest.fn(),
  updateFilters: jest.fn(),
  loadMore: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
};

describe('ContractorDirectory', () => {
  beforeEach(() => {
    mockUseContractors.mockReturnValue(defaultMockReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders contractor directory with title and description', () => {
    render(<ContractorDirectory />);

    expect(
      screen.getByText('Find Your Perfect Contractor')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Discover verified contractors for your next event')
    ).toBeInTheDocument();
  });

  it('renders featured contractors section when showFeatured is true', () => {
    render(<ContractorDirectory showFeatured={true} />);

    expect(screen.getByText('Featured Contractors')).toBeInTheDocument();
  });

  it('does not render featured contractors section when showFeatured is false', () => {
    render(<ContractorDirectory showFeatured={false} />);

    expect(screen.queryByText('Featured Contractors')).not.toBeInTheDocument();
  });

  it('renders contractors in grid view by default', () => {
    render(<ContractorDirectory />);

    // Check that contractors are rendered (they appear in both featured and main sections)
    expect(screen.getAllByText('Event Solutions Ltd')).toHaveLength(2); // Featured + main
    expect(screen.getByText('Perfect Photography')).toBeInTheDocument();
  });

  it('shows results count', () => {
    render(<ContractorDirectory />);

    expect(screen.getByText('Showing 2 of 2 contractors')).toBeInTheDocument();
  });

  it('renders view toggle', () => {
    render(<ContractorDirectory />);

    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
  });

  it('calls setViewMode when view toggle is clicked', () => {
    render(<ContractorDirectory />);

    const listButton = screen.getByText('List');
    fireEvent.click(listButton);

    expect(defaultMockReturn.setViewMode).toHaveBeenCalledWith('list');
  });

  it('shows loading state when isLoading is true', () => {
    mockUseContractors.mockReturnValue({
      ...defaultMockReturn,
      contractors: [],
      isLoading: true,
    });

    render(<ContractorDirectory />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state when error is present', () => {
    mockUseContractors.mockReturnValue({
      ...defaultMockReturn,
      contractors: [],
      error: 'Failed to load contractors',
    });

    render(<ContractorDirectory />);

    expect(screen.getByText('Error Loading Contractors')).toBeInTheDocument();
    expect(screen.getByText('Failed to load contractors')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls clearError when Try Again button is clicked', () => {
    mockUseContractors.mockReturnValue({
      ...defaultMockReturn,
      contractors: [],
      error: 'Failed to load contractors',
    });

    render(<ContractorDirectory />);

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(defaultMockReturn.clearError).toHaveBeenCalled();
  });

  it('shows empty state when no contractors are found', () => {
    mockUseContractors.mockReturnValue({
      ...defaultMockReturn,
      contractors: [],
      pagination: { ...defaultMockReturn.pagination, total: 0 },
    });

    render(<ContractorDirectory />);

    // Check that the empty state message is present (there are multiple "No contractors found" texts)
    expect(
      screen.getByText('Try adjusting your search criteria or filters')
    ).toBeInTheDocument();
  });

  it('calls fetchContractors on mount', () => {
    render(<ContractorDirectory />);

    expect(defaultMockReturn.fetchContractors).toHaveBeenCalledWith({});
  });

  it('calls fetchContractors with initial filters on mount', () => {
    const initialFilters = { serviceType: 'photography' };
    render(<ContractorDirectory initialFilters={initialFilters} />);

    expect(defaultMockReturn.fetchContractors).toHaveBeenCalledWith(
      initialFilters
    );
  });
});
