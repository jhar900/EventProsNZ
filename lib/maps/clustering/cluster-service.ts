/**
 * Cluster Service
 * Advanced clustering algorithms and management for map pins
 */

import { MapContractor } from '../map-service';

export interface MapCluster {
  id: string;
  center: { lat: number; lng: number };
  contractors: MapContractor[];
  count: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  serviceTypes: string[];
  isExpanded: boolean;
}

export interface ClusteringConfig {
  clusterRadius: number;
  clusterMaxZoom: number;
  clusterMinPoints: number;
  clusterColor: string;
  clusterTextColor: string;
  clusterTextSize: number;
  maxClusters: number;
  enableAnimations: boolean;
}

export interface PinFilters {
  service_type?: string;
  verified_only?: boolean;
  subscription_tier?: string;
  search_query?: string;
}

const DEFAULT_CONFIG: ClusteringConfig = {
  clusterRadius: 50,
  clusterMaxZoom: 14,
  clusterMinPoints: 2,
  clusterColor: '#3b82f6',
  clusterTextColor: '#ffffff',
  clusterTextSize: 12,
  maxClusters: 100,
  enableAnimations: true,
};

class ClusterService {
  private config: ClusteringConfig;

  constructor(config: Partial<ClusteringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create clusters from contractors based on current zoom and bounds
   */
  createClusters(
    contractors: MapContractor[],
    zoom: number,
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    filters?: PinFilters
  ): MapCluster[] {
    // Filter contractors first
    const filteredContractors = this.filterContractors(contractors, filters);

    // If zoom is high enough or few contractors, don't cluster
    if (
      zoom >= this.config.clusterMaxZoom ||
      filteredContractors.length < this.config.clusterMinPoints
    ) {
      return filteredContractors.map(contractor =>
        this.createSingleContractorCluster(contractor)
      );
    }

    // Apply clustering algorithm
    const clusters = this.performClustering(filteredContractors, zoom, bounds);

    // Limit number of clusters for performance
    return clusters.slice(0, this.config.maxClusters);
  }

  /**
   * Filter contractors based on search criteria
   */
  private filterContractors(
    contractors: MapContractor[],
    filters?: PinFilters
  ): MapContractor[] {
    if (!filters) return contractors;

    return contractors.filter(contractor => {
      // Service type filter
      if (
        filters.service_type &&
        contractor.service_type !== filters.service_type
      ) {
        return false;
      }

      // Verified only filter
      if (filters.verified_only && !contractor.is_verified) {
        return false;
      }

      // Subscription tier filter
      if (
        filters.subscription_tier &&
        contractor.subscription_tier !== filters.subscription_tier
      ) {
        return false;
      }

      // Search query filter
      if (filters.search_query) {
        const query = filters.search_query.toLowerCase();
        const matchesName = contractor.company_name
          .toLowerCase()
          .includes(query);
        const matchesAddress = contractor.business_address
          .toLowerCase()
          .includes(query);
        const matchesService = contractor.service_type
          .toLowerCase()
          .includes(query);

        if (!matchesName && !matchesAddress && !matchesService) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Create a single contractor cluster (no clustering)
   */
  private createSingleContractorCluster(contractor: MapContractor): MapCluster {
    return {
      id: contractor.id,
      center: contractor.location,
      contractors: [contractor],
      count: 1,
      bounds: {
        north: contractor.location.lat + 0.001,
        south: contractor.location.lat - 0.001,
        east: contractor.location.lng + 0.001,
        west: contractor.location.lng - 0.001,
      },
      serviceTypes: [contractor.service_type],
      isExpanded: false,
    };
  }

  /**
   * Perform clustering using distance-based algorithm
   */
  private performClustering(
    contractors: MapContractor[],
    zoom: number,
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  ): MapCluster[] {
    const clusters: MapCluster[] = [];
    const processed = new Set<string>();

    // Adjust cluster radius based on zoom level
    const dynamicRadius = this.calculateDynamicRadius(zoom);

    contractors.forEach(contractor => {
      if (processed.has(contractor.id)) return;

      const cluster: MapCluster = {
        id: `cluster-${contractor.id}`,
        center: contractor.location,
        contractors: [contractor],
        count: 1,
        bounds: {
          north: contractor.location.lat,
          south: contractor.location.lat,
          east: contractor.location.lng,
          west: contractor.location.lng,
        },
        serviceTypes: [contractor.service_type],
        isExpanded: false,
      };

      // Find nearby contractors to cluster
      contractors.forEach(otherContractor => {
        if (
          otherContractor.id !== contractor.id &&
          !processed.has(otherContractor.id)
        ) {
          const distance = this.calculateDistance(
            contractor.location,
            otherContractor.location
          );

          if (distance <= dynamicRadius) {
            cluster.contractors.push(otherContractor);
            cluster.count++;
            processed.add(otherContractor.id);

            // Update cluster bounds
            cluster.bounds.north = Math.max(
              cluster.bounds.north,
              otherContractor.location.lat
            );
            cluster.bounds.south = Math.min(
              cluster.bounds.south,
              otherContractor.location.lat
            );
            cluster.bounds.east = Math.max(
              cluster.bounds.east,
              otherContractor.location.lng
            );
            cluster.bounds.west = Math.min(
              cluster.bounds.west,
              otherContractor.location.lng
            );

            // Add service type if not already present
            if (!cluster.serviceTypes.includes(otherContractor.service_type)) {
              cluster.serviceTypes.push(otherContractor.service_type);
            }
          }
        }
      });

      // Calculate cluster center as centroid
      cluster.center = this.calculateCentroid(cluster.contractors);

      processed.add(contractor.id);
      clusters.push(cluster);
    });

    return clusters;
  }

  /**
   * Calculate dynamic cluster radius based on zoom level
   */
  private calculateDynamicRadius(zoom: number): number {
    // Higher zoom = smaller radius (more detailed clustering)
    const baseRadius = this.config.clusterRadius;
    const zoomFactor = Math.pow(2, this.config.clusterMaxZoom - zoom);
    return baseRadius * zoomFactor;
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate centroid of multiple points
   */
  private calculateCentroid(contractors: MapContractor[]): {
    lat: number;
    lng: number;
  } {
    if (contractors.length === 1) {
      return contractors[0].location;
    }

    const totalLat = contractors.reduce(
      (sum, contractor) => sum + contractor.location.lat,
      0
    );
    const totalLng = contractors.reduce(
      (sum, contractor) => sum + contractor.location.lng,
      0
    );

    return {
      lat: totalLat / contractors.length,
      lng: totalLng / contractors.length,
    };
  }

  /**
   * Expand a cluster to show individual contractors
   */
  expandCluster(cluster: MapCluster): MapCluster[] {
    return cluster.contractors.map(contractor =>
      this.createSingleContractorCluster(contractor)
    );
  }

  /**
   * Collapse individual contractors back into a cluster
   */
  collapseToCluster(contractors: MapContractor[]): MapCluster {
    if (contractors.length === 0) {
      throw new Error('Cannot create cluster from empty contractor list');
    }

    return {
      id: `cluster-${contractors[0].id}`,
      center: this.calculateCentroid(contractors),
      contractors,
      count: contractors.length,
      bounds: this.calculateBounds(contractors),
      serviceTypes: [...new Set(contractors.map(c => c.service_type))],
      isExpanded: false,
    };
  }

  /**
   * Calculate bounds for a group of contractors
   */
  private calculateBounds(contractors: MapContractor[]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    if (contractors.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    const lats = contractors.map(c => c.location.lat);
    const lngs = contractors.map(c => c.location.lng);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  }

  /**
   * Update clustering configuration
   */
  updateConfig(newConfig: Partial<ClusteringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ClusteringConfig {
    return { ...this.config };
  }

  /**
   * Check if clustering should be applied at current zoom level
   */
  shouldCluster(zoom: number, contractorCount: number): boolean {
    return (
      zoom < this.config.clusterMaxZoom &&
      contractorCount >= this.config.clusterMinPoints
    );
  }
}

export const clusterService = new ClusterService();
