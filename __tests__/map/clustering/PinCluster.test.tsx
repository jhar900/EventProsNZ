/**
 * PinCluster Component Tests
 * Tests for the enhanced pin clustering component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PinCluster } from '@/components/features/map/PinCluster';
import { MapContractor } from '@/lib/maps/map-service';
import { MapCluster } from '@/lib/maps/clustering/cluster-service';

// Mock the clustering services
jest.mock('@/lib/maps/clustering/cluster-service', () => ({
  clusterService: {
    createClusters: jest.fn(),
  },
}));

jest.mock('@/lib/maps/clustering/pin-service', () => ({
  pinService: {
    initializePin: jest.fn(),
    handlePinClick: jest.fn(),
    handlePinHover: jest.fn(),
    handlePinHoverEnd: jest.fn(),
  },
}));

jest.mock('@/lib/maps/clustering/animation-service', () => ({
  animationService: {
    animatePinBounce: jest.fn(),
    animatePinScale: jest.fn(),
  },
}));

jest.mock('@/lib/maps/mapbox-context', () => ({
  useMapbox: () => ({
    mapInstance: {
      project: jest.fn(() => ({ x: 100, y: 200 })),
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

// Mock contractors for testing
const mockContractors: MapContractor[] = [
  {
    id: '1',
    company_name: 'Test Catering',
    business_address: '123 Main St, Auckland',
    service_type: 'catering',
    location: { lat: -36.8485, lng: 174.7633 },
    is_verified: true,
    subscription_tier: 'premium',
  },
  {
    id: '2',
    company_name: 'Test Photography',
    business_address: '456 Queen St, Auckland',
    service_type: 'photography',
    location: { lat: -36.8486, lng: 174.7634 },
    is_verified: false,
    subscription_tier: 'essential',
  },
];

const mockClusters: MapCluster[] = [
  {
    id: 'cluster-1',
    center: { lat: -36.8485, lng: 174.7633 },
    contractors: mockContractors,
    count: 2,
    bounds: {
      north: -36.8485,
      south: -36.8486,
      east: 174.7634,
      west: 174.7633,
    },
    serviceTypes: ['catering', 'photography'],
    isExpanded: false,
  },
];

const mockBounds = {
  north: -36.848,
  south: -36.849,
  east: 174.764,
  west: 174.763,
};

describe('PinCluster', () => {
  const mockOnContractorSelect = jest.fn();
  const mockOnClusterExpand = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cluster service to return test clusters
    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue(mockClusters);
  });

  const defaultProps = {
    contractors: mockContractors,
    onContractorSelect: mockOnContractorSelect,
    onClusterExpand: mockOnClusterExpand,
    zoom: 10,
    bounds: mockBounds,
    filters: {},
  };

  it('should render clusters', () => {
    render(<PinCluster {...defaultProps} />);

    // Should render cluster container
    const clusterContainer = screen.getByTestId('cluster-container');
    expect(clusterContainer).toBeInTheDocument();
  });

  it('should handle cluster click for single contractor', () => {
    const singleContractorCluster: MapCluster = {
      ...mockClusters[0],
      count: 1,
      contractors: [mockContractors[0]],
    };

    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue([singleContractorCluster]);

    render(<PinCluster {...defaultProps} />);

    const clusterElement = screen.getByTestId('cluster-1');
    fireEvent.click(clusterElement);

    expect(mockOnContractorSelect).toHaveBeenCalledWith('1');
  });

  it('should handle cluster click for multiple contractors', () => {
    render(<PinCluster {...defaultProps} />);

    const clusterElement = screen.getByTestId('cluster-1');
    fireEvent.click(clusterElement);

    expect(mockOnClusterExpand).toHaveBeenCalledWith(mockClusters[0]);
  });

  it('should handle cluster hover', () => {
    const { pinService } = require('@/lib/maps/clustering/pin-service');

    render(<PinCluster {...defaultProps} />);

    const clusterElement = screen.getByTestId('cluster-1');
    fireEvent.mouseEnter(clusterElement);

    expect(pinService.handlePinHover).toHaveBeenCalled();
  });

  it('should handle cluster hover end', () => {
    const { pinService } = require('@/lib/maps/clustering/pin-service');

    render(<PinCluster {...defaultProps} />);

    const clusterElement = screen.getByTestId('cluster-1');
    fireEvent.mouseLeave(clusterElement);

    expect(pinService.handlePinHoverEnd).toHaveBeenCalled();
  });

  it('should show cluster tooltip on hover', async () => {
    render(<PinCluster {...defaultProps} />);

    const clusterElement = screen.getByTestId('cluster-1');
    fireEvent.mouseEnter(clusterElement);

    await waitFor(() => {
      expect(screen.getByText('2 contractors')).toBeInTheDocument();
    });
  });

  it('should show individual contractor tooltip for single contractor cluster', async () => {
    const singleContractorCluster: MapCluster = {
      ...mockClusters[0],
      count: 1,
      contractors: [mockContractors[0]],
    };

    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue([singleContractorCluster]);

    render(<PinCluster {...defaultProps} />);

    const clusterElement = screen.getByTestId('cluster-1');
    fireEvent.mouseEnter(clusterElement);

    await waitFor(() => {
      expect(screen.getByText('Test Catering')).toBeInTheDocument();
    });
  });

  it('should display verification badge for verified contractors', () => {
    const singleContractorCluster: MapCluster = {
      ...mockClusters[0],
      count: 1,
      contractors: [mockContractors[0]], // verified contractor
    };

    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue([singleContractorCluster]);

    render(<PinCluster {...defaultProps} />);

    const verificationBadge = screen.getByTestId('verification-badge');
    expect(verificationBadge).toBeInTheDocument();
  });

  it('should not display verification badge for unverified contractors', () => {
    const singleContractorCluster: MapCluster = {
      ...mockClusters[0],
      count: 1,
      contractors: [mockContractors[1]], // unverified contractor
    };

    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue([singleContractorCluster]);

    render(<PinCluster {...defaultProps} />);

    const verificationBadge = screen.queryByTestId('verification-badge');
    expect(verificationBadge).not.toBeInTheDocument();
  });

  it('should show expansion indicator for multi-contractor clusters', () => {
    render(<PinCluster {...defaultProps} />);

    const expansionIndicator = screen.getByTestId('expansion-indicator');
    expect(expansionIndicator).toBeInTheDocument();
  });

  it('should not show expansion indicator for single contractor clusters', () => {
    const singleContractorCluster: MapCluster = {
      ...mockClusters[0],
      count: 1,
      contractors: [mockContractors[0]],
    };

    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue([singleContractorCluster]);

    render(<PinCluster {...defaultProps} />);

    const expansionIndicator = screen.queryByTestId('expansion-indicator');
    expect(expansionIndicator).not.toBeInTheDocument();
  });

  it('should handle expanded cluster state', () => {
    render(<PinCluster {...defaultProps} />);

    // Click on the cluster to expand it
    const clusterElement = screen.getByTestId('cluster-1');
    fireEvent.click(clusterElement);

    // Should show individual contractor pins when expanded
    const individualPins = screen.getAllByTestId(/individual-pin-/);
    expect(individualPins).toHaveLength(2);
  });

  it('should handle individual contractor pin click when expanded', () => {
    render(<PinCluster {...defaultProps} />);

    // Click on the cluster to expand it
    const clusterElement = screen.getByTestId('cluster-1');
    fireEvent.click(clusterElement);

    // Now click on an individual pin
    const individualPin = screen.getByTestId('individual-pin-1');
    fireEvent.click(individualPin);

    expect(mockOnContractorSelect).toHaveBeenCalledWith('1');
  });

  it('should apply correct service type colors', () => {
    const cateringCluster: MapCluster = {
      ...mockClusters[0],
      serviceTypes: ['catering'],
    };

    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue([cateringCluster]);

    render(<PinCluster {...defaultProps} />);

    const clusterElement = screen.getByTestId('cluster-1');
    const clusterBody = clusterElement.querySelector(
      '[data-testid="cluster-body"]'
    );

    // Should have catering color (red)
    expect(clusterBody).toHaveStyle('background-color: #ef4444');
  });

  it('should apply correct cluster sizes based on count', () => {
    const largeCluster: MapCluster = {
      ...mockClusters[0],
      count: 50,
    };

    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue([largeCluster]);

    render(<PinCluster {...defaultProps} />);

    const clusterElement = screen.getByTestId('cluster-1');
    const clusterBody = clusterElement.querySelector(
      '[data-testid="cluster-body"]'
    );

    // Should have larger size for high count (50 < 100, so w-12 h-12)
    expect(clusterBody).toHaveClass('w-12', 'h-12');
  });

  it('should handle empty contractors array', () => {
    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    clusterService.createClusters.mockReturnValue([]);

    render(<PinCluster {...defaultProps} contractors={[]} />);

    // Should not render any clusters
    const clusterContainer = screen.queryByTestId('cluster-container');
    expect(clusterContainer).toBeEmptyDOMElement();
  });

  it('should update clusters when props change', () => {
    const { rerender } = render(<PinCluster {...defaultProps} />);

    const newContractors = [
      ...mockContractors,
      {
        id: '3',
        company_name: 'Test Music',
        business_address: '789 King St, Auckland',
        service_type: 'music',
        location: { lat: -36.8487, lng: 174.7635 },
        is_verified: true,
        subscription_tier: 'professional',
      },
    ];

    rerender(<PinCluster {...defaultProps} contractors={newContractors} />);

    // Should call createClusters with new contractors
    const { clusterService } = require('@/lib/maps/clustering/cluster-service');
    expect(clusterService.createClusters).toHaveBeenCalledWith(
      newContractors,
      defaultProps.zoom,
      defaultProps.bounds,
      defaultProps.filters
    );
  });
});
