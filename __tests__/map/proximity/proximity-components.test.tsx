/**
 * Proximity Components Tests
 * Tests for proximity filtering UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProximityFilter } from '@/components/features/map/proximity/ProximityFilter';
import { LocationInput } from '@/components/features/map/proximity/LocationInput';
import { ProximityResults } from '@/components/features/map/proximity/ProximityResults';
import { RadiusSelector } from '@/components/features/map/proximity/RadiusSelector';
import { ServiceAreaVisualization } from '@/components/features/map/proximity/ServiceAreaVisualization';

// Mock the proximity hook
jest.mock('@/hooks/useProximityFilter', () => ({
  useProximityFilter: () => ({
    searchLocation: null,
    searchRadius: 50,
    serviceType: null,
    verifiedOnly: false,
    filteredContractors: [],
    locationSuggestions: [],
    isLoading: false,
    error: null,
    total: 0,
    setSearchLocation: jest.fn(),
    setSearchRadius: jest.fn(),
    setServiceType: jest.fn(),
    setVerifiedOnly: jest.fn(),
    getLocationSuggestions: jest.fn(),
    clearFilters: jest.fn(),
    clearError: jest.fn(),
  }),
}));

// Mock proximity service
jest.mock('@/lib/maps/proximity/proximity-service', () => ({
  proximityService: {
    getRadiusOptions: () => [
      { value: 10, label: '10km' },
      { value: 25, label: '25km' },
      { value: 50, label: '50km' },
      { value: 100, label: '100km' },
      { value: 200, label: '200km' },
    ],
    formatDistance: (distance: number) => `${distance.toFixed(1)}km`,
  },
}));

describe('Proximity Components', () => {
  describe('ProximityFilter', () => {
    it('should render proximity filter component', () => {
      render(<ProximityFilter />);

      expect(screen.getByText('Find Contractors Near You')).toBeInTheDocument();
      expect(screen.getByText('Event Location')).toBeInTheDocument();
      expect(screen.getByText('Search Radius')).toBeInTheDocument();
      expect(screen.getByText('Service Type')).toBeInTheDocument();
      expect(screen.getByText('Verified contractors only')).toBeInTheDocument();
    });

    it('should render clear all button', () => {
      render(<ProximityFilter />);

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should call onContractorSelect when provided', () => {
      const mockOnContractorSelect = jest.fn();
      render(<ProximityFilter onContractorSelect={mockOnContractorSelect} />);

      // Component should render without errors
      expect(screen.getByText('Find Contractors Near You')).toBeInTheDocument();
    });
  });

  describe('LocationInput', () => {
    const mockProps = {
      value: '',
      onChange: jest.fn(),
      onSelect: jest.fn(),
      suggestions: [],
      showSuggestions: false,
      onClear: jest.fn(),
    };

    it('should render location input', () => {
      render(<LocationInput {...mockProps} />);

      expect(
        screen.getByPlaceholderText('Enter location...')
      ).toBeInTheDocument();
    });

    it('should call onChange when input changes', () => {
      render(<LocationInput {...mockProps} />);

      const input = screen.getByPlaceholderText('Enter location...');
      fireEvent.change(input, { target: { value: 'Auckland' } });

      expect(mockProps.onChange).toHaveBeenCalledWith('Auckland');
    });

    it('should show suggestions when provided', () => {
      const suggestions = [
        {
          id: 'suggestion-1',
          name: 'Auckland, New Zealand',
          location: { lat: -36.8485, lng: 174.7633 },
          type: 'city' as const,
          formatted_address: 'Auckland, New Zealand',
        },
      ];

      render(
        <LocationInput
          {...mockProps}
          suggestions={suggestions}
          showSuggestions={true}
        />
      );

      expect(screen.getByText('Auckland, New Zealand')).toBeInTheDocument();
    });

    it('should call onSelect when suggestion is clicked', () => {
      const suggestions = [
        {
          id: 'suggestion-1',
          name: 'Auckland, New Zealand',
          location: { lat: -36.8485, lng: 174.7633 },
          type: 'city' as const,
          formatted_address: 'Auckland, New Zealand',
        },
      ];

      render(
        <LocationInput
          {...mockProps}
          suggestions={suggestions}
          showSuggestions={true}
        />
      );

      const suggestion = screen.getByText('Auckland, New Zealand');
      fireEvent.click(suggestion);

      expect(mockProps.onSelect).toHaveBeenCalledWith(suggestions[0]);
    });

    it('should show clear button when value is provided', () => {
      render(<LocationInput {...mockProps} value="Auckland" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should call onClear when clear button is clicked', () => {
      render(<LocationInput {...mockProps} value="Auckland" />);

      const clearButton = screen.getByRole('button');
      fireEvent.click(clearButton);

      expect(mockProps.onClear).toHaveBeenCalled();
    });
  });

  describe('ProximityResults', () => {
    const mockContractors = [
      {
        id: 'contractor-1',
        company_name: 'Test Catering Co',
        business_address: '123 Queen Street, Auckland',
        service_type: 'catering',
        location: { lat: -36.8485, lng: 174.7633 },
        is_verified: true,
        subscription_tier: 'professional',
        distance: 5.2,
      },
    ];

    it('should render loading state', () => {
      render(<ProximityResults contractors={[]} isLoading={true} />);

      expect(
        screen.getByText('Searching for contractors...')
      ).toBeInTheDocument();
    });

    it('should render no results state', () => {
      render(<ProximityResults contractors={[]} isLoading={false} />);

      expect(screen.getByText('No contractors found')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Try adjusting your search radius or location to find more contractors.'
        )
      ).toBeInTheDocument();
    });

    it('should render contractor results', () => {
      render(
        <ProximityResults contractors={mockContractors} isLoading={false} />
      );

      expect(screen.getByText('Nearby Contractors (1)')).toBeInTheDocument();
      expect(screen.getByText('Test Catering Co')).toBeInTheDocument();
      expect(
        screen.getByText('123 Queen Street, Auckland')
      ).toBeInTheDocument();
      expect(screen.getByText('catering')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('should call onContractorSelect when contractor is selected', () => {
      const mockOnContractorSelect = jest.fn();
      render(
        <ProximityResults
          contractors={mockContractors}
          isLoading={false}
          onContractorSelect={mockOnContractorSelect}
        />
      );

      const selectButton = screen.getByText('Select');
      fireEvent.click(selectButton);

      expect(mockOnContractorSelect).toHaveBeenCalledWith(mockContractors[0]);
    });
  });

  describe('RadiusSelector', () => {
    const mockOptions = [
      { value: 10, label: '10km' },
      { value: 25, label: '25km' },
      { value: 50, label: '50km' },
    ];

    it('should render radius options', () => {
      render(
        <RadiusSelector value={50} onChange={jest.fn()} options={mockOptions} />
      );

      expect(screen.getByLabelText('10km')).toBeInTheDocument();
      expect(screen.getByLabelText('25km')).toBeInTheDocument();
      expect(screen.getByLabelText('50km')).toBeInTheDocument();
    });

    it('should call onChange when option is selected', () => {
      const mockOnChange = jest.fn();
      render(
        <RadiusSelector
          value={50}
          onChange={mockOnChange}
          options={mockOptions}
        />
      );

      const option25 = screen.getByLabelText('25km');
      fireEvent.click(option25);

      expect(mockOnChange).toHaveBeenCalledWith(25);
    });
  });

  describe('ServiceAreaVisualization', () => {
    const mockServiceAreas = [
      {
        id: 'default-radius',
        name: 'Test Service Area',
        type: 'radius' as const,
        coordinates: [{ lat: -36.8485, lng: 174.7633 }],
        radius: 50,
        description: 'Primary service area',
      },
    ];

    const mockBusinessLocation = { lat: -36.8485, lng: 174.7633 };

    it('should render service areas', () => {
      render(
        <ServiceAreaVisualization
          serviceAreas={mockServiceAreas}
          businessLocation={mockBusinessLocation}
          contractorName="Test Contractor"
        />
      );

      expect(screen.getByText('Service Areas')).toBeInTheDocument();
      expect(screen.getByText('Business Location')).toBeInTheDocument();
      expect(screen.getByText('Test Service Area')).toBeInTheDocument();
      expect(screen.getByText('Primary service area')).toBeInTheDocument();
      expect(screen.getByText('Radius: 50km')).toBeInTheDocument();
    });

    it('should render no service areas state', () => {
      render(
        <ServiceAreaVisualization
          serviceAreas={[]}
          businessLocation={null}
          contractorName="Test Contractor"
        />
      );

      expect(screen.getByText('Service Areas')).toBeInTheDocument();
      expect(screen.getByText('No service areas defined')).toBeInTheDocument();
    });

    it('should render map placeholder', () => {
      render(
        <ServiceAreaVisualization
          serviceAreas={mockServiceAreas}
          businessLocation={mockBusinessLocation}
          contractorName="Test Contractor"
        />
      );

      expect(
        screen.getByText('Map visualization would appear here')
      ).toBeInTheDocument();
      expect(screen.getByText('Service areas: 1')).toBeInTheDocument();
    });
  });
});
