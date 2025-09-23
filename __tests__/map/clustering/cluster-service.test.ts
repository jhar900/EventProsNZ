/**
 * Cluster Service Tests
 * Tests for the map clustering service functionality
 */

import {
  clusterService,
  MapCluster,
} from '@/lib/maps/clustering/cluster-service';
import { MapContractor } from '@/lib/maps/map-service';

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
  {
    id: '3',
    company_name: 'Test Music',
    business_address: '789 King St, Auckland',
    service_type: 'music',
    location: { lat: -36.8487, lng: 174.7635 },
    is_verified: true,
    subscription_tier: 'professional',
  },
  {
    id: '4',
    company_name: 'Test Venue',
    business_address: '321 Albert St, Auckland',
    service_type: 'venue',
    location: { lat: -36.8488, lng: 174.7636 },
    is_verified: false,
    subscription_tier: 'premium',
  },
];

const mockBounds = {
  north: -36.848,
  south: -36.849,
  east: 174.764,
  west: 174.763,
};

describe('ClusterService', () => {
  beforeEach(() => {
    // Reset cluster service configuration
    clusterService.updateConfig({
      clusterRadius: 50,
      clusterMaxZoom: 14,
      clusterMinPoints: 2,
      clusterColor: '#3b82f6',
      clusterTextColor: '#ffffff',
      clusterTextSize: 12,
      maxClusters: 100,
      enableAnimations: true,
    });
  });

  describe('createClusters', () => {
    it('should create individual clusters when zoom is high enough', () => {
      const clusters = clusterService.createClusters(
        mockContractors,
        15,
        mockBounds
      );

      expect(clusters).toHaveLength(4);
      clusters.forEach(cluster => {
        expect(cluster.count).toBe(1);
        expect(cluster.contractors).toHaveLength(1);
      });
    });

    it('should create clusters when zoom is low enough', () => {
      const clusters = clusterService.createClusters(
        mockContractors,
        10,
        mockBounds
      );

      expect(clusters.length).toBeLessThanOrEqual(4);
      expect(clusters.length).toBeGreaterThan(0);
    });

    it('should filter contractors based on service type', () => {
      const filters = { service_type: 'catering' };
      const clusters = clusterService.createClusters(
        mockContractors,
        15,
        mockBounds,
        filters
      );

      expect(clusters).toHaveLength(1);
      expect(clusters[0].contractors[0].service_type).toBe('catering');
    });

    it('should filter contractors based on verification status', () => {
      const filters = { verified_only: true };
      const clusters = clusterService.createClusters(
        mockContractors,
        15,
        mockBounds,
        filters
      );

      expect(clusters).toHaveLength(2);
      clusters.forEach(cluster => {
        expect(cluster.contractors[0].is_verified).toBe(true);
      });
    });

    it('should filter contractors based on subscription tier', () => {
      const filters = { subscription_tier: 'premium' };
      const clusters = clusterService.createClusters(
        mockContractors,
        15,
        mockBounds,
        filters
      );

      expect(clusters).toHaveLength(2);
      clusters.forEach(cluster => {
        expect(cluster.contractors[0].subscription_tier).toBe('premium');
      });
    });

    it('should filter contractors based on search query', () => {
      const filters = { search_query: 'Test' };
      const clusters = clusterService.createClusters(
        mockContractors,
        15,
        mockBounds,
        filters
      );

      expect(clusters).toHaveLength(4);
    });

    it('should return empty array for no matching contractors', () => {
      const filters = { search_query: 'NonExistent' };
      const clusters = clusterService.createClusters(
        mockContractors,
        15,
        mockBounds,
        filters
      );

      expect(clusters).toHaveLength(0);
    });
  });

  describe('expandCluster', () => {
    it('should expand a cluster into individual contractor clusters', () => {
      const cluster: MapCluster = {
        id: 'cluster-1',
        center: { lat: -36.8485, lng: 174.7633 },
        contractors: mockContractors.slice(0, 2),
        count: 2,
        bounds: {
          north: -36.8485,
          south: -36.8486,
          east: 174.7634,
          west: 174.7633,
        },
        serviceTypes: ['catering', 'photography'],
        isExpanded: false,
      };

      const expandedClusters = clusterService.expandCluster(cluster);

      expect(expandedClusters).toHaveLength(2);
      expandedClusters.forEach(cluster => {
        expect(cluster.count).toBe(1);
        expect(cluster.contractors).toHaveLength(1);
      });
    });
  });

  describe('collapseToCluster', () => {
    it('should collapse individual contractors into a single cluster', () => {
      const contractors = mockContractors.slice(0, 2);
      const cluster = clusterService.collapseToCluster(contractors);

      expect(cluster.count).toBe(2);
      expect(cluster.contractors).toHaveLength(2);
      expect(cluster.serviceTypes).toContain('catering');
      expect(cluster.serviceTypes).toContain('photography');
    });

    it('should throw error for empty contractor list', () => {
      expect(() => {
        clusterService.collapseToCluster([]);
      }).toThrow('Cannot create cluster from empty contractor list');
    });
  });

  describe('shouldCluster', () => {
    it('should return true when zoom is below max zoom and contractor count is above minimum', () => {
      expect(clusterService.shouldCluster(10, 5)).toBe(true);
    });

    it('should return false when zoom is above max zoom', () => {
      expect(clusterService.shouldCluster(15, 5)).toBe(false);
    });

    it('should return false when contractor count is below minimum', () => {
      expect(clusterService.shouldCluster(10, 1)).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update clustering configuration', () => {
      const newConfig = { clusterRadius: 100, clusterMaxZoom: 12 };
      clusterService.updateConfig(newConfig);

      const config = clusterService.getConfig();
      expect(config.clusterRadius).toBe(100);
      expect(config.clusterMaxZoom).toBe(12);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = clusterService.getConfig();

      expect(config).toHaveProperty('clusterRadius');
      expect(config).toHaveProperty('clusterMaxZoom');
      expect(config).toHaveProperty('clusterMinPoints');
      expect(config).toHaveProperty('clusterColor');
      expect(config).toHaveProperty('clusterTextColor');
      expect(config).toHaveProperty('clusterTextSize');
      expect(config).toHaveProperty('maxClusters');
      expect(config).toHaveProperty('enableAnimations');
    });
  });
});
