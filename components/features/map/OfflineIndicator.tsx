/**
 * Offline Indicator Component
 * Shows offline mode status and cache information
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, Trash2 } from 'lucide-react';
import { useMapStore } from '@/stores/map';
import { mapCacheService } from '@/lib/maps/cache-service';

export const OfflineIndicator: React.FC = () => {
  const {
    isOffline,
    cacheStats,
    updateCacheStats,
    clearCache,
    cleanupExpiredTiles,
  } = useMapStore();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    updateCacheStats();
  }, [updateCacheStats]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearCache = async () => {
    await clearCache();
    setShowDetails(false);
  };

  const handleCleanupExpired = async () => {
    const cleaned = await cleanupExpiredTiles();
    if (cleaned > 0) {
      // Tiles cleaned up successfully
    }
  };

  return (
    <div className="relative">
      {/* Main Indicator */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg border transition-all ${
          isOffline
            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
        }`}
      >
        {isOffline ? (
          <WifiOff className="w-4 h-4" />
        ) : (
          <Wifi className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOffline ? 'Offline' : 'Online'}
        </span>
      </button>

      {/* Details Panel */}
      {showDetails && (
        <div className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-64 z-40">
          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Connection
              </span>
              <div className="flex items-center space-x-2">
                {isOffline ? (
                  <WifiOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Wifi className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm text-gray-600">
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
            </div>

            {/* Cache Information */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Cache</span>
                <Database className="w-4 h-4 text-gray-500" />
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Tiles:</span>
                  <span>{cacheStats.totalTiles}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{formatBytes(cacheStats.totalSize)}</span>
                </div>
                {cacheStats.oldestTile > 0 && (
                  <div className="flex justify-between">
                    <span>Oldest:</span>
                    <span>
                      {new Date(cacheStats.oldestTile).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cache Actions */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex space-x-2">
                <button
                  onClick={handleCleanupExpired}
                  className="flex-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                >
                  Clean Expired
                </button>
                <button
                  onClick={handleClearCache}
                  className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Offline Notice */}
            {isOffline && (
              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Offline Mode:</strong> You&apos;re viewing cached map
                  data. Some features may be limited.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
