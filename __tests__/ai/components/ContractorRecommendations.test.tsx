import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractorRecommendations } from '@/components/features/ai/ContractorRecommendations';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ContractorRecommendations', () => {
  const mockRecommendations = [
    {
      contractor: {
        id: '1',
        name: 'John Smith',
        businessName: 'Smith Photography',
        email: 'john@smithphoto.com',
        phone: '+64 21 123 4567',
        website: 'https://smithphoto.com',
        location: {
          address: '123 Queen St',
          city: 'Auckland',
          region: 'Auckland',
          coordinates: { lat: -36.8485, lng: 174.7633 },
        },
        services: ['Wedding Photography', 'Portrait Photography'],
        specializations: ['Wedding', 'Corporate'],
        rating: 4.8,
        reviewCount: 127,
        priceRange: { min: 2000, max: 5000, currency: 'NZD' },
        availability: { isAvailable: true, nextAvailableDate: '2024-02-01' },
        portfolio: {
          images: [],
          videos: [],
          description: 'Professional wedding photography',
        },
        certifications: ['Professional Photographer'],
        experience: 8,
        isVerified: true,
        isPremium: true,
        responseTime: '2h',
        completionRate: 98,
        lastActive: '2024-01-15T10:00:00Z',
      },
      matchScore: 92,
      reasoning: [
        'Specializes in Wedding Photography services',
        'Excellent rating of 4.8 stars',
        '8 years of experience',
        'Currently available for new projects',
        'Located in Auckland',
        'Verified contractor with background checks',
        'Premium contractor with enhanced services',
        '98% project completion rate',
      ],
      estimatedCost: 3500,
      estimatedTimeline: '2 weeks',
      availability: true,
      priority: 'high' as const,
    },
    {
      contractor: {
        id: '2',
        name: 'Jane Doe',
        businessName: 'Doe Events',
        email: 'jane@doeevents.com',
        phone: '+64 21 987 6543',
        location: {
          address: '456 Ponsonby Rd',
          city: 'Auckland',
          region: 'Auckland',
          coordinates: { lat: -36.8519, lng: 174.7435 },
        },
        services: ['Event Photography', 'Corporate Photography'],
        specializations: ['Corporate', 'Birthday'],
        rating: 4.5,
        reviewCount: 89,
        priceRange: { min: 1500, max: 4000, currency: 'NZD' },
        availability: { isAvailable: false, nextAvailableDate: '2024-02-15' },
        portfolio: {
          images: [],
          videos: [],
          description: 'Corporate event photography',
        },
        certifications: [],
        experience: 5,
        isVerified: true,
        isPremium: false,
        responseTime: '4h',
        completionRate: 95,
        lastActive: '2024-01-14T15:30:00Z',
      },
      matchScore: 78,
      reasoning: [
        'Specializes in Event Photography services',
        'High rating of 4.5 stars',
        'Experienced with 5 years in business',
        'Located in Auckland',
        'Verified contractor with background checks',
        '95% project completion rate',
      ],
      estimatedCost: 2800,
      estimatedTimeline: '1 week',
      availability: false,
      priority: 'medium' as const,
    },
  ];

  const mockProps = {
    serviceId: 'photography-1',
    serviceName: 'Wedding Photography',
    eventType: 'wedding',
    eventData: {
      location: 'Auckland',
      budget: 5000,
      guestCount: 100,
      eventDate: '2024-06-15',
    },
    onContractorSelect: jest.fn(),
    onContractorContact: jest.fn(),
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders contractor recommendations', async () => {
    // Mock the fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Initially should show loading state
    expect(
      screen.getByText('Loading contractor recommendations...')
    ).toBeInTheDocument();

    // Wait for loading to complete and data to be rendered
    await waitFor(
      () => {
        expect(
          screen.queryByText('Loading contractor recommendations...')
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Now should show the actual content
    expect(screen.getByText('Contractor Recommendations')).toBeInTheDocument();
    expect(
      screen.getByText('AI-matched contractors for Wedding Photography')
    ).toBeInTheDocument();

    // Verify the API call was made
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/contractors/recommendations')
    );

    // Should show the contractor data
    expect(screen.getByText('Smith Photography')).toBeInTheDocument();
    expect(screen.getByText('Doe Events')).toBeInTheDocument();
  });

  it('displays contractor information correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByText('Smith Photography')).toBeInTheDocument();
        expect(screen.getAllByText('Auckland, Auckland')).toHaveLength(2);
        expect(screen.getByText('4.8 (127 reviews)')).toBeInTheDocument();
        expect(screen.getByText('8 years experience')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows match scores and reasoning', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByText('92%')).toBeInTheDocument();
        expect(screen.getByText('78%')).toBeInTheDocument();
        expect(
          screen.getAllByText('Why this contractor matches:')
        ).toHaveLength(2);
        expect(
          screen.getByText('Specializes in Wedding Photography services')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('displays estimated costs and timelines', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByText('$3,500.00')).toBeInTheDocument();
        expect(screen.getByText('$2,800.00')).toBeInTheDocument();
        expect(screen.getByText('2 weeks')).toBeInTheDocument();
        expect(screen.getByText('1 week')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows contractor badges and status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getAllByText('Verified')).toHaveLength(2);
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('high priority')).toBeInTheDocument();
        expect(screen.getByText('medium priority')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles contractor selection', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        const viewProfileButton = screen.getAllByText('View Profile')[0];
        fireEvent.click(viewProfileButton);
      },
      { timeout: 3000 }
    );

    expect(mockProps.onContractorSelect).toHaveBeenCalledWith(
      mockRecommendations[0].contractor
    );
  });

  it('handles contractor contact', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        const contactButton = screen.getAllByText('Contact')[0];
        fireEvent.click(contactButton);
      },
      { timeout: 3000 }
    );

    expect(mockProps.onContractorContact).toHaveBeenCalledWith(
      mockRecommendations[0].contractor
    );
  });

  it('handles filter changes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    const locationFilter = screen.getByLabelText('Location');
    fireEvent.change(locationFilter, { target: { value: 'Wellington' } });

    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('filter_location=Wellington')
        );
      },
      { timeout: 3000 }
    );
  });

  it('handles price range filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    const priceFilter = screen.getByLabelText('Price Range');
    fireEvent.click(priceFilter);

    const priceOption = screen.getByText('$1,000 - $5,000');
    fireEvent.click(priceOption);

    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('filter_price_range=1000-5000')
        );
      },
      { timeout: 3000 }
    );
  });

  it('handles rating filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    const ratingFilter = screen.getByLabelText('Minimum Rating');
    fireEvent.click(ratingFilter);

    const ratingOption = screen.getByText('4.5+ stars');
    fireEvent.click(ratingOption);

    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('filter_rating=4.5')
        );
      },
      { timeout: 3000 }
    );
  });

  it('handles availability filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    const availabilityFilter = screen.getByLabelText('Availability');
    fireEvent.click(availabilityFilter);

    const availableOption = screen.getByText('Available');
    fireEvent.click(availableOption);

    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('filter_availability=available')
        );
      },
      { timeout: 3000 }
    );
  });

  it('handles sort changes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        const sortSelect = screen.getByLabelText('Sort By');
        fireEvent.click(sortSelect);

        const ratingOption = screen.getByText('Rating');
        fireEvent.click(ratingOption);
      },
      { timeout: 3000 }
    );

    // Should re-sort the displayed recommendations
    expect(screen.getByText('Smith Photography')).toBeInTheDocument();
  });

  it('clears filters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    const clearFiltersButton = screen.getByText('Clear Filters');
    fireEvent.click(clearFiltersButton);

    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.not.stringContaining('filter_location=')
        );
      },
      { timeout: 3000 }
    );
  });

  it('switches between tabs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    const mapViewButton = screen.getByText('Map View');
    fireEvent.click(mapViewButton);

    // Should switch to map view (though map component isn't implemented in this test)
    expect(mapViewButton).toHaveClass('bg-primary');
  });

  it('shows loading state', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<ContractorRecommendations {...mockProps} />);

    expect(
      screen.getByText('Loading contractor recommendations...')
    ).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<ContractorRecommendations {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  it('shows empty state when no recommendations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: [] }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No contractors found matching your criteria. Try adjusting your filters.'
        )
      ).toBeInTheDocument();
    });
  });

  it('displays results summary', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(
          screen.getByText('2 contractors found for Wedding Photography')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles refresh', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);
      },
      { timeout: 3000 }
    );

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('displays contractor services and specializations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
        expect(screen.getByText('Portrait Photography')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows completion rates and response times', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: mockRecommendations }),
    } as Response);

    render(<ContractorRecommendations {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading contractor recommendations...')
      ).not.toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.getByText('98%')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument();
        expect(screen.getAllByText('Completion rate')).toHaveLength(2);
      },
      { timeout: 3000 }
    );
  });
});
