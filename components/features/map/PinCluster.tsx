/**
 * Pin Cluster Component
 * Enhanced clustered pin groups with advanced interactions
 */

'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { MapContractor } from '@/lib/maps/map-service';
import { MapCluster } from '@/lib/maps/clustering/cluster-service';
import { clusterService } from '@/lib/maps/clustering/cluster-service';
import { pinService } from '@/lib/maps/clustering/pin-service';
import { animationService } from '@/lib/maps/clustering/animation-service';
import { useMapbox } from '@/lib/maps/mapbox-context';

interface PinClusterProps {
  contractors: MapContractor[];
  onContractorSelect: (contractorId: string) => void;
  onClusterExpand?: (cluster: MapCluster) => void;
  zoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  filters?: {
    service_type?: string;
    verified_only?: boolean;
    subscription_tier?: string;
    search_query?: string;
  };
  clusterRadius?: number;
  className?: string;
}

const SERVICE_COLORS: Record<string, string> = {
  catering: '#ef4444',
  photography: '#3b82f6',
  music: '#8b5cf6',
  venue: '#10b981',
  decorations: '#f59e0b',
  transportation: '#6b7280',
  security: '#dc2626',
  other: '#6b7280',
};

const SERVICE_ICONS: Record<string, string> = {
  catering: '🍽️',
  photography: '📸',
  music: '🎵',
  venue: '🏛️',
  decorations: '🎨',
  transportation: '🚗',
  security: '🛡️',
  other: '⚙️',
};

export const PinCluster: React.FC<PinClusterProps> = ({
  contractors,
  onContractorSelect,
  onClusterExpand,
  zoom,
  bounds,
  filters,
  clusterRadius = 50,
  className = '',
}) => {
  const clusterRef = useRef<HTMLDivElement>(null);
  const { mapInstance } = useMapbox();
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    new Set()
  );
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);

  // Create clusters using the cluster service
  const processedClusters = useMemo(() => {
    return clusterService.createClusters(contractors, zoom, bounds, filters);
  }, [contractors, zoom, bounds, filters]);

  // Update clusters when processed clusters change
  useEffect(() => {
    setClusters(processedClusters);
  }, [processedClusters]);

  // Handle cluster click
  const handleClusterClick = (cluster: MapCluster, event: React.MouseEvent) => {
    event.stopPropagation();

    if (cluster.count === 1) {
      // Single contractor - select it directly
      const contractor = cluster.contractors[0];
      onContractorSelect(contractor.id);

      // Animate pin selection
      const pinElement = event.currentTarget as HTMLElement;
      animationService.animatePinBounce(pinElement);
    } else {
      // Multiple contractors - expand cluster or show popup
      if (expandedClusters.has(cluster.id)) {
        // Already expanded, collapse it
        setExpandedClusters(prev => {
          const newSet = new Set(prev);
          newSet.delete(cluster.id);
          return newSet;
        });
      } else {
        // Expand cluster
        setExpandedClusters(prev => new Set(prev).add(cluster.id));
        onClusterExpand?.(cluster);

        // Animate cluster expansion
        const clusterElement = event.currentTarget as HTMLElement;
        animationService.animatePinBounce(clusterElement);
      }
    }
  };

  // Handle cluster hover
  const handleClusterHover = (cluster: MapCluster, event: React.MouseEvent) => {
    setHoveredCluster(cluster.id);
    pinService.handlePinHover(cluster.id);

    const clusterElement = event.currentTarget as HTMLElement;
    animationService.animatePinScale(clusterElement, 1.05);
  };

  // Handle cluster hover end
  const handleClusterHoverEnd = (
    cluster: MapCluster,
    event: React.MouseEvent
  ) => {
    setHoveredCluster(null);
    pinService.handlePinHoverEnd(cluster.id);

    const clusterElement = event.currentTarget as HTMLElement;
    animationService.animatePinScale(clusterElement, 1);
  };

  // Get cluster color based on service types
  const getClusterColor = (cluster: MapCluster): string => {
    if (cluster.serviceTypes.length === 1) {
      return SERVICE_COLORS[cluster.serviceTypes[0]] || SERVICE_COLORS.other;
    }
    // Mixed service types - use a neutral color
    return '#6366f1';
  };

  // Get cluster icon based on service types
  const getClusterIcon = (cluster: MapCluster): string => {
    if (cluster.serviceTypes.length === 1) {
      return SERVICE_ICONS[cluster.serviceTypes[0]] || SERVICE_ICONS.other;
    }
    // Mixed service types - use a generic icon
    return '📍';
  };

  // Get cluster size based on count
  const getClusterSize = (count: number): string => {
    if (count === 1) return 'w-8 h-8';
    if (count < 10) return 'w-10 h-10';
    if (count < 100) return 'w-12 h-12';
    return 'w-14 h-14';
  };

  // Get cluster text size based on count
  const getClusterTextSize = (count: number): string => {
    if (count === 1) return 'text-sm';
    if (count < 10) return 'text-sm';
    if (count < 100) return 'text-xs';
    return 'text-xs';
  };

  return (
    <div ref={clusterRef} className={className} data-testid="cluster-container">
      {clusters.map(cluster => {
        const isExpanded = expandedClusters.has(cluster.id);
        const isHovered = hoveredCluster === cluster.id;
        const clusterColor = getClusterColor(cluster);
        const clusterIcon = getClusterIcon(cluster);
        const clusterSize = getClusterSize(cluster.count);
        const textSize = getClusterTextSize(cluster.count);

        return (
          <div
            key={cluster.id}
            data-testid={cluster.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
              isHovered ? 'z-20' : 'z-10'
            }`}
            style={{
              left: `${cluster.center.lng}px`,
              top: `${cluster.center.lat}px`,
            }}
            onClick={e => handleClusterClick(cluster, e)}
            onMouseEnter={e => handleClusterHover(cluster, e)}
            onMouseLeave={e => handleClusterHoverEnd(cluster, e)}
          >
            {/* Cluster Container */}
            <div className="relative">
              {/* Cluster Shadow */}
              <div
                className={`absolute ${clusterSize} bg-black opacity-20 rounded-full transform translate-x-1 translate-y-1`}
                style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              />

              {/* Cluster Body */}
              <div
                data-testid="cluster-body"
                className={`relative ${clusterSize} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold ${textSize}`}
                style={{ backgroundColor: clusterColor }}
              >
                {cluster.count === 1 ? (
                  // Single contractor - show service icon
                  <span className="text-lg">{clusterIcon}</span>
                ) : (
                  // Multiple contractors - show count
                  <span>{cluster.count}</span>
                )}
              </div>

              {/* Verification Badge for single contractors */}
              {cluster.count === 1 && cluster.contractors[0].is_verified && (
                <div
                  data-testid="verification-badge"
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}

              {/* Hover Ring */}
              {isHovered && (
                <div
                  className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-60 animate-pulse"
                  style={{ transform: 'scale(1.2)' }}
                />
              )}

              {/* Expansion Indicator */}
              {cluster.count > 1 && !isExpanded && (
                <div
                  data-testid="expansion-indicator"
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>

            {/* Cluster Tooltip */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {cluster.count === 1
                    ? cluster.contractors[0].company_name
                    : `${cluster.count} contractors`}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            )}

            {/* Expanded Individual Pins */}
            {isExpanded && cluster.count > 1 && (
              <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2">
                {cluster.contractors.map((contractor, index) => {
                  const angle = (index * 360) / cluster.contractors.length;
                  const radius = 60; // Distance from cluster center
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;

                  return (
                    <div
                      key={contractor.id}
                      data-testid={`individual-pin-${contractor.id}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        onContractorSelect(contractor.id);
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{
                          backgroundColor:
                            SERVICE_COLORS[contractor.service_type] ||
                            SERVICE_COLORS.other,
                        }}
                      >
                        {SERVICE_ICONS[contractor.service_type] ||
                          SERVICE_ICONS.other}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
