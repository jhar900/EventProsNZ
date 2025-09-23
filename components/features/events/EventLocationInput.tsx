'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EventLocation } from '@/types/events';

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

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
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
  }, [query]);

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
      console.error('Location search error:', err);
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
      placeId: suggestion.place_id,
      city: suggestion.address?.city,
      region: suggestion.address?.state,
      country: suggestion.address?.country || 'New Zealand',
    };

    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    onChange(location);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!e.target.value) {
      onChange({
        address: '',
        coordinates: { lat: 0, lng: 0 },
      });
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

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
          };

          setQuery(data.display_name);
          onChange(location);
        } catch (err) {
          setError('Failed to get current location address.');
          console.error('Reverse geocoding error:', err);
        } finally {
          setIsLoading(false);
        }
      },
      error => {
        setError('Unable to get your current location.');
        setIsLoading(false);
        console.error('Geolocation error:', error);
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter event location (e.g., Auckland, New Zealand)"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="pl-10 pr-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-0">
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.place_id}
                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSuggestionSelect(suggestion)}
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

      {/* Current Location Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={getCurrentLocation}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <MapPin className="h-4 w-4" />
        Use Current Location
      </Button>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Selected Location Display */}
      {value && value.address && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{value.address}</p>
              {value.coordinates.lat !== 0 && value.coordinates.lng !== 0 && (
                <p className="text-xs text-muted-foreground">
                  Coordinates: {value.coordinates.lat.toFixed(6)},{' '}
                  {value.coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
