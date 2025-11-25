'use client';

import React, { useState, useEffect, useRef } from 'react';
// Mapbox CSS will be loaded dynamically
// DO NOT import mapbox-gl synchronously - it's large and blocks page load

interface SimpleMapProps {
  className?: string;
}

export function SimpleMap({ className = '' }: SimpleMapProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [contractors, setContractors] = useState<any[]>([]);
  const [isInViewport, setIsInViewport] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Lazy load map when it comes into viewport using Intersection Observer
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let observer: IntersectionObserver | null = null;
    let retryCount = 0;
    const maxRetries = 10; // Max 1 second of retries

    // Wait for component to render and check if already visible
    const checkVisibility = () => {
      if (!wrapperRef.current) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Retry after a short delay if ref not ready
          timeoutId = setTimeout(checkVisibility, 100);
        }
        return;
      }

      const element = wrapperRef.current;

      // Check if already visible (fallback for when observer hasn't fired yet)
      const rect = element.getBoundingClientRect();
      const isVisible =
        rect.top < window.innerHeight + 200 && // 200px margin
        rect.bottom > -200 &&
        rect.left < window.innerWidth + 200 &&
        rect.right > -200;

      if (isVisible) {
        console.log('SimpleMap: Already in viewport, loading immediately');
        setIsInViewport(true);
        return;
      }

      // Set up Intersection Observer for lazy loading
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              console.log('SimpleMap: Entered viewport, starting load');
              setIsInViewport(true);
              if (observer) {
                observer.disconnect();
                observer = null;
              }
            }
          });
        },
        {
          rootMargin: '200px', // Start loading 200px before it's visible
          threshold: 0.01,
        }
      );

      observer.observe(element);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      checkVisibility();
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // Check configuration
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await fetch('/api/maps/check-config');
        const data = await response.json();
        setIsConfigured(data.configured);
      } catch (error) {
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkConfiguration();
  }, []);

  // Fetch contractors
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        // Fetch contractors with default NZ bounds to get all contractors
        const bounds = {
          north: -34.0,
          south: -47.0,
          east: 179.0,
          west: 166.0,
        };
        const response = await fetch(
          `/api/map/contractors?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`
        );
        if (response.ok) {
          const data = await response.json();
          setContractors(data.contractors || []);
          console.log(
            'Fetched contractors for map:',
            data.contractors?.length || 0
          );
        }
      } catch (error) {
        console.error('Error fetching contractors:', error);
      }
    };
    if (isConfigured) {
      fetchContractors();
    }
  }, [isConfigured]);

  // Initialize map when configured - using dynamic import for code splitting
  // Only load when in viewport to improve initial page load
  useEffect(() => {
    if (
      !isConfigured ||
      !mapboxToken ||
      map ||
      !mapContainer.current ||
      !isInViewport
    ) {
      return;
    }

    let isMounted = true;
    let mapInstance: any = null;
    let loadTimeoutId: NodeJS.Timeout | null = null;

    // Dynamically import Mapbox GL and CSS for code splitting
    const initializeMap = async () => {
      try {
        // Add a small delay to ensure the container is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!mapContainer.current || !isMounted) {
          return;
        }

        // Dynamically import Mapbox GL JS (code splitting)
        const mapboxglModule = await import('mapbox-gl');
        const mapboxgl = mapboxglModule.default;

        if (!mapboxgl) {
          return;
        }

        // Dynamically load CSS if not already loaded
        // Try to load from node_modules first (more reliable than CDN)
        if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
          try {
            // Import CSS dynamically from node_modules
            await import('mapbox-gl/dist/mapbox-gl.css');
          } catch (cssImportError) {
            // Fallback to CDN
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href =
              'https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
          }
        }

        mapboxgl.accessToken = mapboxToken;

        // Ensure container has dimensions before creating map
        const container = mapContainer.current;
        if (
          !container ||
          container.offsetWidth === 0 ||
          container.offsetHeight === 0
        ) {
          container.style.width = '100%';
          container.style.height = '600px';
          container.style.minHeight = '600px';
          // Wait a bit for dimensions to apply
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const newMap = new mapboxgl.Map({
          container: container,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [174.0, -40.5], // Center of New Zealand
          zoom: 5.0, // Zoom level to show all of New Zealand
          maxBounds: [
            [166.0, -47.0], // West, South
            [179.0, -34.0], // East, North
          ],
        });

        // Handle map load - check if already loaded first
        let loadHandled = false;
        const handleMapLoad = () => {
          if (loadHandled) {
            console.log('SimpleMap: Load already handled, skipping');
            return;
          }

          loadHandled = true;
          console.log('SimpleMap: Map load event fired!');

          // Use setTimeout to ensure state update happens in next tick
          // This avoids issues with React batching or cleanup timing
          setTimeout(() => {
            if (mapContainer.current) {
              console.log('SimpleMap: Setting mapLoaded to true');
              setMapLoaded(true);
              console.log('SimpleMap: Map loaded successfully - state updated');
            } else {
              console.warn(
                'SimpleMap: Container gone, but attempting state update anyway'
              );
              setMapLoaded(true);
            }
          }, 0);

          // Fit the map to show all of New Zealand after it loads
          setTimeout(() => {
            try {
              newMap.fitBounds(
                [
                  [166.0, -47.0], // Southwest corner (West, South)
                  [179.0, -34.0], // Northeast corner (East, North)
                ],
                {
                  padding: 20,
                  duration: 0, // Instant, no animation
                }
              );
            } catch (fitError) {
              console.error('SimpleMap: Error fitting bounds:', fitError);
            }
          }, 100);
        };

        // Set up event listeners FIRST, before checking if loaded
        newMap.on('load', handleMapLoad);

        // Also listen to style.load as backup
        newMap.on('style.load', () => {
          console.log('SimpleMap: Style.load event fired');
          if (!isMounted || loadHandled) return;

          // Check if map is actually ready (using correct API)
          try {
            if (
              newMap.loaded &&
              newMap.isStyleLoaded &&
              newMap.isStyleLoaded()
            ) {
              console.log(
                'SimpleMap: Map style is loaded, triggering handleMapLoad'
              );
              handleMapLoad();
            }
          } catch (e) {
            console.log('SimpleMap: Error checking style loaded state:', e);
          }
        });

        // Check if map is already loaded (might happen if load event fired immediately)
        // Use a small delay to check
        setTimeout(() => {
          try {
            if (newMap && newMap.loaded) {
              console.log(
                'SimpleMap: Map already loaded when checked, calling handleMapLoad'
              );
              handleMapLoad();
            }
          } catch (e) {
            console.log('SimpleMap: Error checking loaded state:', e);
          }
        }, 500);

        // Fallback timeout - if load event doesn't fire within 2 seconds, assume it's loaded
        // This is a safety net since the map instance exists and should be rendering
        loadTimeoutId = setTimeout(() => {
          if (!loadHandled && isMounted && newMap) {
            console.warn(
              'SimpleMap: Load event timeout (2s), assuming map is loaded and forcing state update'
            );
            try {
              // Try to trigger a resize to wake up the map
              newMap.resize();
              handleMapLoad();
            } catch (e) {
              console.error('SimpleMap: Error in timeout handler:', e);
              // Even if resize fails, mark as loaded since map exists
              if (!loadHandled) {
                handleMapLoad();
              }
            }
          }
        }, 2000);

        newMap.on('error', (e: any) => {
          console.error(
            'SimpleMap: Map error event:',
            e.error?.message || e.message || 'Unknown error',
            e
          );
        });

        newMap.on('styledata', () => {
          console.log('SimpleMap: Style data loaded');
        });

        // Resize map to ensure it renders properly
        newMap.once('style.load', () => {
          console.log('SimpleMap: Triggering resize after style load');
          setTimeout(() => {
            if (newMap && isMounted) {
              newMap.resize();
            }
          }, 100);
        });

        if (isMounted) {
          mapInstance = newMap;
          setMap(newMap);
          console.log('SimpleMap: Map instance stored in state');

          // Force a resize immediately to ensure map renders
          setTimeout(() => {
            if (newMap && isMounted) {
              console.log('SimpleMap: Forcing initial resize');
              try {
                newMap.resize();
              } catch (e) {
                console.error('SimpleMap: Error on initial resize:', e);
              }
            }
          }, 100);

          // Add navigation controls
          try {
            newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
            console.log('SimpleMap: Navigation controls added');
          } catch (controlError) {
            console.error('SimpleMap: Error adding controls:', controlError);
          }
        } else {
          console.warn('SimpleMap: Component unmounted, removing map');
          newMap.remove();
        }
      } catch (error) {
        console.error('SimpleMap: Map initialization error:', error);
        if (error instanceof Error) {
          console.error('SimpleMap: Error details:', {
            message: error.message,
            stack: error.stack,
          });
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (loadTimeoutId) {
        clearTimeout(loadTimeoutId);
        loadTimeoutId = null;
      }
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
    // NOTE: Don't include 'map' in dependencies - it causes re-initialization loop
    // We check !map in the condition to prevent re-initialization
  }, [isConfigured, mapboxToken, isInViewport]);

  // Add markers for contractors when map and contractors are loaded
  useEffect(() => {
    if (!map || !mapLoaded || contractors.length === 0) return;

    // Store markers so we can clean them up
    const markers: any[] = [];
    // Track the currently open popup to ensure only one is open at a time
    let currentPopup: any = null;
    let isMounted = true;

    // Dynamically get mapboxgl from the map instance
    const addMarkers = async () => {
      // Import mapboxgl to get Marker and Popup classes
      const mapboxglModule = await import('mapbox-gl');
      const mapboxgl = mapboxglModule.default;

      if (!isMounted || !map) return;

      // Service icons and colors mapping
      const serviceConfig: Record<string, { icon: string; color: string }> = {
        catering: { icon: '🍽️', color: '#ef4444' },
        photography: { icon: '📸', color: '#3b82f6' },
        music: { icon: '🎵', color: '#8b5cf6' },
        venue: { icon: '🏛️', color: '#10b981' },
        decorations: { icon: '🎨', color: '#f59e0b' },
        transportation: { icon: '🚗', color: '#6b7280' },
        security: { icon: '🛡️', color: '#dc2626' },
        other: { icon: '⚙️', color: '#6b7280' },
      };

      // Helper function to format service type
      const formatServiceType = (type: string): string => {
        return type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      // Helper function to escape HTML entities for security
      const escapeHtml = (text: string): string => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      // Add markers for each contractor
      contractors.forEach(contractor => {
        // API returns location with lat/lng (not latitude/longitude)
        if (
          contractor.location &&
          contractor.location.lat &&
          contractor.location.lng
        ) {
          const serviceType = contractor.service_type?.toLowerCase() || 'other';
          const config = serviceConfig[serviceType] || serviceConfig.other;
          const formattedServiceType = formatServiceType(
            contractor.service_type || 'Service Provider'
          );

          // Escape user-provided content to prevent XSS
          const companyName = escapeHtml(contractor.company_name || 'Unnamed');
          const description = contractor.description
            ? escapeHtml(contractor.description)
            : null;
          const address = contractor.business_address
            ? escapeHtml(contractor.business_address)
            : '';
          const contractorId = escapeHtml(contractor.id);
          // Logo URL should not be HTML-escaped as it's used in src attribute
          // It's safe as it comes from our database
          const logoUrl = contractor.logo_url || null;

          // Determine what to show in the logo/icon area
          // Show logo if available, otherwise show service icon
          const logoDisplay = logoUrl
            ? `<img src="${logoUrl}" alt="${companyName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.onerror=null; this.style.display='none'; this.parentElement.style.backgroundColor='${config.color}'; this.parentElement.innerHTML='${config.icon}';" />`
            : config.icon;

          // Create enhanced popup HTML with better styling
          const popupHTML = `
            <div style="min-width: 280px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
              <!-- Header with logo/icon and company name -->
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${logoUrl ? '#ffffff' : config.color}; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; overflow: hidden; border: ${logoUrl ? '1px solid #e5e7eb' : 'none'};">
                  ${logoDisplay}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 4px 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${companyName}
                  </h3>
                  <p style="font-size: 13px; color: #6b7280; margin: 0; text-transform: capitalize;">
                    ${escapeHtml(formattedServiceType)}
                  </p>
                </div>
              </div>

              <!-- Business Description -->
              ${
                description
                  ? `
              <div style="margin-bottom: 12px;">
                <p style="font-size: 13px; color: #4b5563; margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                  ${description}
                </p>
              </div>
              `
                  : ''
              }

              <!-- Address -->
              ${
                address
                  ? `
                <div style="display: flex; align-items: start; gap: 8px; margin-bottom: 12px; padding: 8px; background-color: #f9fafb; border-radius: 6px;">
                  <span style="font-size: 14px; flex-shrink: 0; margin-top: 2px;">📍</span>
                  <p style="font-size: 12px; color: #4b5563; margin: 0; line-height: 1.5; word-break: break-word;">
                    ${address}
                  </p>
                </div>
              `
                  : ''
              }

              <!-- Action Button -->
              <a 
                href="/contractors/${contractorId}" 
                style="display: block; width: 100%; padding: 10px 16px; background-color: #2563eb; color: white; text-align: center; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none; transition: background-color 0.2s;"
                onmouseover="this.style.backgroundColor='#1d4ed8'"
                onmouseout="this.style.backgroundColor='#2563eb'"
              >
                View Profile →
              </a>
            </div>
          `;

          // Create a popup with enhanced styling
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            className: 'mapbox-popup-enhanced',
          }).setHTML(popupHTML);

          // Handle popup open event to close any previously open popup
          popup.on('open', () => {
            // Close any previously open popup
            if (currentPopup && currentPopup !== popup) {
              try {
                currentPopup.remove();
              } catch (e) {
                // Popup might already be closed, ignore error
              }
            }
            currentPopup = popup;
          });

          // Handle popup close event to clear the reference
          popup.on('close', () => {
            if (currentPopup === popup) {
              currentPopup = null;
            }
          });

          // Create and add marker with orange color to match brand
          const marker = new mapboxgl.Marker({
            color: '#f97316', // Orange color
            scale: 0.8,
          })
            .setLngLat([contractor.location.lng, contractor.location.lat])
            .setPopup(popup)
            .addTo(map);

          // Also handle marker click to ensure previous popup closes before opening new one
          marker.getElement().addEventListener('click', () => {
            if (currentPopup && currentPopup !== popup) {
              try {
                currentPopup.remove();
              } catch (e) {
                // Popup might already be closed, ignore error
              }
            }
          });

          markers.push(marker);
        } else {
          console.warn('Contractor missing location:', contractor);
        }
      });
    };

    addMarkers();

    // Cleanup function - remove markers when component unmounts or dependencies change
    return () => {
      isMounted = false;
      markers.forEach(marker => {
        if (marker && marker.remove) {
          marker.remove();
        }
      });
    };
  }, [map, mapLoaded, contractors]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full rounded-xl overflow-hidden border border-gray-200 ${className}`}
      style={{
        minHeight: '600px',
        height: '600px',
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10">
          <div className="text-gray-600">Checking configuration...</div>
        </div>
      )}

      {!isLoading && (!isConfigured || !mapboxToken) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10">
          <div className="text-center">
            <div className="text-red-500 text-lg font-semibold mb-2">
              Map Not Configured
            </div>
            <div className="text-gray-600 text-sm">
              Please set NEXT_PUBLIC_MAPBOX_TOKEN environment variable
            </div>
          </div>
        </div>
      )}

      {!isLoading && isConfigured && mapboxToken && (
        <>
          <div
            ref={mapContainer}
            className="w-full rounded-xl"
            style={{
              minHeight: '600px',
              width: '100%',
              height: '600px',
            }}
          />
          {!mapLoaded && isInViewport && map && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10 bg-opacity-90">
              <div className="text-gray-600">Loading map tiles...</div>
            </div>
          )}
          {!isInViewport && !map && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl z-10">
              <div className="text-gray-500 text-sm">
                Map will load when visible
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
