/**
 * Map Animations Component
 * Handles smooth animations and transitions for map interactions
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animationService } from '@/lib/maps/clustering/animation-service';

interface MapAnimationsProps {
  isCollapsed?: boolean;
  isFullScreen?: boolean;
  onAnimationComplete?: () => void;
  className?: string;
}

export const MapAnimations: React.FC<MapAnimationsProps> = ({
  isCollapsed = false,
  isFullScreen = false,
  onAnimationComplete,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStats, setAnimationStats] = useState({
    pinAnimations: 0,
    clusterAnimations: 0,
    mapAnimations: 0,
    totalAnimations: 0,
  });

  // Update animation stats periodically
  useEffect(() => {
    const updateStats = () => {
      const stats = animationService.getAnimationStats();
      setAnimationStats(stats);
    };

    const interval = setInterval(updateStats, 100);
    return () => clearInterval(interval);
  }, []);

  // Handle collapse animation
  useEffect(() => {
    if (containerRef.current) {
      setIsAnimating(true);

      const element = containerRef.current;
      element.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';

      if (isCollapsed) {
        element.style.transform = 'translateY(100%)';
        element.style.opacity = '0.8';
      } else {
        element.style.transform = 'translateY(0)';
        element.style.opacity = '1';
      }

      setTimeout(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      }, 300);
    }
  }, [isCollapsed, onAnimationComplete]);

  // Handle fullscreen animation
  useEffect(() => {
    if (containerRef.current) {
      setIsAnimating(true);

      const element = containerRef.current;
      element.style.transition = 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)';

      if (isFullScreen) {
        element.style.transform = 'scale(1.02)';
        element.style.borderRadius = '0';
      } else {
        element.style.transform = 'scale(1)';
        element.style.borderRadius = '0.5rem';
      }

      setTimeout(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      }, 400);
    }
  }, [isFullScreen, onAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-300 ${className}`}
    >
      {/* Animation Status Indicator (for debugging) */}
      {process.env.NODE_ENV === 'development' &&
        animationStats.totalAnimations > 0 && (
          <div className="absolute top-2 right-2 z-50 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            Animations: {animationStats.totalAnimations}
          </div>
        )}

      {/* Animation Overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 pointer-events-none z-40">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Pin Animation Keyframes (CSS)
 * These should be added to your global CSS file
 */
export const pinAnimationStyles = `
@keyframes pinBounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-10px) scale(1.1);
  }
  60% {
    transform: translateY(-5px) scale(1.05);
  }
}

@keyframes pinPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@keyframes clusterExpand {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes clusterCollapse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

@keyframes slideInFromBottom {
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutToBottom {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes scaleOut {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

/* Animation utility classes */
.animate-pin-bounce {
  animation: pinBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-pin-pulse {
  animation: pinPulse 1s ease-in-out infinite;
}

.animate-cluster-expand {
  animation: clusterExpand 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-cluster-collapse {
  animation: clusterCollapse 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-in-bottom {
  animation: slideInFromBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slide-out-bottom {
  animation: slideOutToBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-in-out;
}

.animate-fade-out {
  animation: fadeOut 0.2s ease-in-out;
}

.animate-scale-in {
  animation: scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-scale-out {
  animation: scaleOut 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
`;
