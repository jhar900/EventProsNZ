'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { EventLocation } from '@/types/events';
import { LocationMap } from './LocationMap';

interface EventLocationInputProps {
  value?: EventLocation;
  onChange: (location: EventLocation) => void;
}

interface PlaceSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

export function EventLocationInput({
  value,
  onChange,
}: EventLocationInputProps) {
  const [query, setQuery] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query with value prop when it changes (e.g., when event data is loaded)
  useEffect(() => {
    if (value?.address && value.address !== query) {
      setQuery(value.address);
      setShowSuggestions(false);
    } else if (!value?.address && query) {
      // If address is cleared from value prop, clear query too
      setQuery('');
    }
  }, [value?.address]);

  // Debounced search - only search if user is actively typing (query differs from saved value)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't auto-search if query matches the saved address (user hasn't changed it)
    // But allow search if user is typing something different
    if (query === value?.address && query.length > 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (query.length < 3) {
      setSuggestions([]);
      // Don't hide suggestions if user is actively typing (query is changing)
      if (query.length === 0) {
        setShowSuggestions(false);
      }
      return;
    }

    debounceRef.current = setTimeout(async () => {
      await searchPlaces(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, value?.address]);

  const searchPlaces = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Using Nominatim (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=nz`
      );

      if (!response.ok) {
        throw new Error('Failed to search locations');
      }

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      setError('Failed to search locations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: PlaceSuggestion) => {
    const location: EventLocation = {
      address: suggestion.display_name,
      coordinates: {
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon),
      },
      placeId: String(suggestion.place_id), // Convert to string as Nominatim returns number
      city: suggestion.address?.city,
      region: suggestion.address?.state,
      country: suggestion.address?.country || 'New Zealand',
      toBeConfirmed: false, // Clear toBeConfirmed when a location is selected
    };

    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    onChange(location);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!e.target.value) {
      // When address is deleted, clear location but keep toBeConfirmed if it was already set
      onChange({
        address: '',
        coordinates: { lat: 0, lng: 0 },
        toBeConfirmed: value?.toBeConfirmed || false,
      });
    } else {
      // When user starts typing, clear toBeConfirmed
      onChange({
        ...value,
        address: e.target.value,
        toBeConfirmed: false,
      });
    }
  };

  const handleToBeConfirmedChange = (checked: boolean) => {
    if (checked) {
      // Clear location when "To Be Confirmed" is checked
      setQuery('');
      onChange({
        address: '',
        coordinates: { lat: 0, lng: 0 },
        toBeConfirmed: true,
      });
    } else {
      // Unchecking - keep current location or clear
      onChange({
        ...value,
        toBeConfirmed: false,
      });
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't hide suggestions if clicking inside the suggestions dropdown
    if (
      suggestionsRef.current &&
      suggestionsRef.current.contains(e.relatedTarget as Node)
    ) {
      return;
    }
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );

          if (!response.ok) {
            throw new Error('Failed to get address');
          }

          const data = await response.json();

          const location: EventLocation = {
            address: data.display_name,
            coordinates: { lat: latitude, lng: longitude },
            placeId: data.place_id,
            city: data.address?.city || data.address?.town,
            region: data.address?.state,
            country: data.address?.country || 'New Zealand',
            toBeConfirmed: false, // Clear toBeConfirmed when current location is used
          };

          setQuery(data.display_name);
          onChange(location);
        } catch (err) {
          setError('Failed to get current location address.');
        } finally {
          setIsLoading(false);
        }
      },
      error => {
        setError('Unable to get your current location.');
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Enter event location (e.g., Auckland, New Zealand)"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="pl-10 pr-10"
            disabled={value?.toBeConfirmed}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Card
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg bg-white border border-gray-200"
          >
            <CardContent className="p-0 bg-white">
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.place_id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  onMouseDown={e => e.preventDefault()}
                >
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {suggestion.display_name}
                      </p>
                      {suggestion.address && (
                        <p className="text-xs text-muted-foreground">
                          {[
                            suggestion.address.city,
                            suggestion.address.state,
                            suggestion.address.country,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* To Be Confirmed Checkbox - Only show when address is empty or toBeConfirmed is true */}
      {(!query || !value?.address || value.toBeConfirmed) && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="locationToBeConfirmed"
            checked={value?.toBeConfirmed || false}
            onCheckedChange={handleToBeConfirmedChange}
          />
          <Label
            htmlFor="locationToBeConfirmed"
            className="text-sm font-normal cursor-pointer"
          >
            To Be Confirmed
          </Label>
        </div>
      )}

      {/* Selected Location Display */}
      {value && value.address && !value.toBeConfirmed && (
        <LocationMap
          coordinates={
            value.coordinates.lat !== 0 && value.coordinates.lng !== 0
              ? value.coordinates
              : undefined
          }
          address={
            value.coordinates.lat === 0 || value.coordinates.lng === 0
              ? value.address
              : undefined
          }
        />
      )}
    </div>
  );
}
