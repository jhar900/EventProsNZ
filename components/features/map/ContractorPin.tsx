/**
 * Contractor Pin Component
 * Enhanced individual contractor location pins with advanced interactions
 */

'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { MapContractor } from '@/lib/maps/map-service';
import { useMapbox } from '@/lib/maps/mapbox-context';
import { pinService } from '@/lib/maps/clustering/pin-service';
import { animationService } from '@/lib/maps/clustering/animation-service';

interface ContractorPinProps {
  contractor: MapContractor;
  isSelected: boolean;
  isHovered?: boolean;
  onClick: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
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

export const ContractorPin: React.FC<ContractorPinProps> = ({
  contractor,
  isSelected,
  isHovered = false,
  onClick,
  onHover,
  onHoverEnd,
  className = '',
}) => {
  const pinRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const { mapInstance } = useMapbox();

  // Use a ref to store the last known position to prevent unnecessary updates
  const lastPositionRef = useRef({ x: 0, y: 0 });

  const serviceColor =
    SERVICE_COLORS[contractor.service_type] || SERVICE_COLORS.other;
  const serviceIcon =
    SERVICE_ICONS[contractor.service_type] || SERVICE_ICONS.other;

  // Memoize the contractor location to prevent unnecessary re-renders
  const contractorLocation = useMemo(
    () => ({
      lat: contractor.location.lat,
      lng: contractor.location.lng,
    }),
    [contractor.location.lat, contractor.location.lng]
  );

  // Initialize pin state
  useEffect(() => {
    pinService.initializePin(contractor.id);
  }, [contractor.id]);

  // Update pin position when map moves or contractor location changes
  useEffect(() => {
    if (!mapInstance || !pinRef.current) {
      // Set a default position when map is not available (e.g., in tests)
      setPosition({ x: 100, y: 100 });
      return;
    }

    // Use a ref to track if we're currently updating to prevent race conditions
    const isUpdatingRef = { current: false };
    let animationFrameId: number | null = null;

    const updatePosition = () => {
      // Prevent multiple simultaneous updates
      if (isUpdatingRef.current) return;

      isUpdatingRef.current = true;

      try {
        const point = mapInstance.project([
          contractorLocation.lng,
          contractorLocation.lat,
        ]);

        const newPosition = { x: point.x, y: point.y };

        // Use a more stable comparison to prevent unnecessary updates
        const deltaX = Math.abs(lastPositionRef.current.x - newPosition.x);
        const deltaY = Math.abs(lastPositionRef.current.y - newPosition.y);

        // Only update if position changed significantly (5px threshold)
        if (deltaX > 5 || deltaY > 5) {
          lastPositionRef.current = newPosition;
          setPosition(newPosition);
        }
      } catch (error) {
        // Fallback to default position if projection fails
        setPosition({ x: 100, y: 100 });
      } finally {
        isUpdatingRef.current = false;
      }
    };

    // Throttled update function using requestAnimationFrame
    const throttledUpdate = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        updatePosition();
        animationFrameId = null;
      });
    };

    // Initial position calculation
    updatePosition();

    // Add event listeners with throttling
    mapInstance.on('move', throttledUpdate);
    mapInstance.on('zoom', throttledUpdate);
    mapInstance.on('rotate', throttledUpdate);
    mapInstance.on('pitch', throttledUpdate);

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      mapInstance.off('move', throttledUpdate);
      mapInstance.off('zoom', throttledUpdate);
      mapInstance.off('rotate', throttledUpdate);
      mapInstance.off('pitch', throttledUpdate);
    };
  }, [mapInstance, contractorLocation.lat, contractorLocation.lng]);

  // Handle pin click - memoized to prevent unnecessary re-renders
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      const coordinates = { x: event.clientX, y: event.clientY };
      pinService.handlePinClick(contractor.id, contractor, coordinates);

      // Animate pin selection
      if (pinRef.current) {
        animationService.animatePinBounce(pinRef.current);
      }

      onClick();
    },
    [contractor.id, contractor, onClick]
  );

  // Handle pin hover - memoized to prevent unnecessary re-renders
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent) => {
      const coordinates = { x: event.clientX, y: event.clientY };
      pinService.handlePinHover(contractor.id, contractor, coordinates);

      // Animate pin hover
      if (pinRef.current) {
        animationService.animatePinScale(pinRef.current, 1.1);
      }

      onHover?.();
    },
    [contractor.id, contractor, onHover]
  );

  // Handle pin hover end - memoized to prevent unnecessary re-renders
  const handleMouseLeave = useCallback(() => {
    pinService.handlePinHoverEnd(contractor.id);

    // Animate pin back to normal
    if (pinRef.current) {
      animationService.animatePinScale(pinRef.current, 1);
    }

    onHoverEnd?.();
  }, [contractor.id, onHoverEnd]);

  // Handle touch events for mobile - memoized to prevent unnecessary re-renders
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      const coordinates = { x: touch.clientX, y: touch.clientY };
      pinService.handlePinHover(contractor.id, contractor, coordinates);
    },
    [contractor.id, contractor]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      event.preventDefault();
      const touch = event.changedTouches[0];
      const coordinates = { x: touch.clientX, y: touch.clientY };
      pinService.handlePinClick(contractor.id, contractor, coordinates);
      pinService.handlePinHoverEnd(contractor.id);
      onClick();
    },
    [contractor.id, contractor, onClick]
  );

  return (
    <div
      ref={pinRef}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
        isSelected ? 'z-20 scale-110' : isHovered ? 'z-15 scale-105' : 'z-10'
      } ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Pin Container */}
      <div className="relative">
        {/* Pin Shadow */}
        <div
          className="absolute w-6 h-6 bg-black opacity-20 rounded-full transform translate-x-1 translate-y-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        />

        {/* Pin Body */}
        <div
          className="relative w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm transition-all duration-200"
          style={{ backgroundColor: serviceColor }}
        >
          {serviceIcon}
        </div>

        {/* Verification Badge */}
        {contractor.is_verified && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}

        {/* Selection Ring */}
        {isSelected && (
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse"
            style={{ transform: 'scale(1.2)' }}
          />
        )}

        {/* Hover Ring */}
        {isHovered && !isSelected && (
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-60"
            style={{ transform: 'scale(1.1)' }}
          />
        )}

        {/* Pulse Animation for Attention */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
        )}
      </div>

      {/* Enhanced Hover Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
            <div className="font-medium">{contractor.company_name}</div>
            <div className="text-gray-300 capitalize">
              {contractor.service_type.replace('_', ' ')}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};
