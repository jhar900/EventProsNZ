/**
 * Mobile Map Controls Component
 * Mobile-optimized map controls and navigation
 */

'use client';

import React, { useState, useEffect } from 'react';

interface MobileMapControlsProps {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onCollapse: () => void;
  onExpand: () => void;
  isCollapsed: boolean;
  className?: string;
}

export const MobileMapControls: React.FC<MobileMapControlsProps> = ({
  isFullScreen,
  onToggleFullScreen,
  onCollapse,
  onExpand,
  isCollapsed,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeout);
      setIsVisible(true);
      timeout = setTimeout(() => {
        if (isFullScreen) {
          setIsVisible(false);
        }
      }, 3000); // Hide after 3 seconds of inactivity
    };

    const handleTouch = () => resetTimeout();
    const handleMouseMove = () => resetTimeout();

    document.addEventListener('touchstart', handleTouch);
    document.addEventListener('mousemove', handleMouseMove);

    resetTimeout();

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isFullScreen]);

  // Handle touch gestures
  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartX(touch.clientX);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = touch.clientX - touchStartX;

    // Swipe down to collapse (if not already collapsed)
    if (deltaY > 50 && Math.abs(deltaX) < 100 && !isCollapsed) {
      onCollapse();
    }
    // Swipe up to expand (if collapsed)
    else if (deltaY < -50 && Math.abs(deltaX) < 100 && isCollapsed) {
      onExpand();
    }
  };

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
        {/* Back Button (when fullscreen) */}
        {isFullScreen && (
          <button
            onClick={onToggleFullScreen}
            className="w-10 h-10 bg-white bg-opacity-90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullScreen}
          className="w-10 h-10 bg-white bg-opacity-90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-all"
        >
          {isFullScreen ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
        {/* Collapse/Expand Handle */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-12 h-1 bg-white bg-opacity-50 rounded-full transition-all duration-300 ${
              isCollapsed ? 'bg-opacity-30' : 'bg-opacity-50'
            }`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {/* Collapse/Expand Button */}
          <button
            onClick={isCollapsed ? onExpand : onCollapse}
            className="w-12 h-12 bg-white bg-opacity-90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-all"
          >
            {isCollapsed ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>

          {/* Center Map Button */}
          <button
            onClick={() => {
              // This would center the map on user's location
              console.log('Center map on location');
            }}
            className="w-12 h-12 bg-white bg-opacity-90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Zoom Controls */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => {
                // This would zoom in
                console.log('Zoom in');
              }}
              className="w-10 h-10 bg-white bg-opacity-90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                // This would zoom out
                console.log('Zoom out');
              }}
              className="w-10 h-10 bg-white bg-opacity-90 rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-opacity-100 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 12H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Gesture Instructions (shown briefly on first use) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="bg-black bg-opacity-75 text-white text-sm px-4 py-2 rounded-lg text-center">
          <div className="mb-1">Swipe down to collapse</div>
          <div>Swipe up to expand</div>
        </div>
      </div>
    </div>
  );
};
