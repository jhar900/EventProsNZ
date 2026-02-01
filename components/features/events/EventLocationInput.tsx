'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  const [query, setQuery] = useState(() => {
    // If toBeConfirmed or isVirtual is true, always start with empty query
    if (value?.toBeConfirmed || value?.isVirtual) {
      return '';
    }
    // Only use address if it's a valid string (not a JSON object string)
    const address = value?.address || '';
    // Check if address looks like a JSON object string and ignore it
    if (address && (address.startsWith('{') || address.startsWith('['))) {
      return '';
    }
    return address;
  });
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query with value prop when it changes (e.g., when event data is loaded)
  useEffect(() => {
    // If toBeConfirmed or isVirtual is true, always clear the query
    if (value?.toBeConfirmed || value?.isVirtual) {
      setQuery('');
      setShowSuggestions(false);
      return;
    }

    // Only update query if address is a valid string (not a JSON object)
    const address = value?.address || '';
    if (address && (address.startsWith('{') || address.startsWith('['))) {
      // Address is a JSON object string, ignore it
      setQuery('');
      setShowSuggestions(false);
      return;
    }

    // Use functional update to access current query state
    setQuery(prevQuery => {
      if (address && address !== prevQuery) {
        return address;
      } else if (!address && prevQuery) {
        // If address is cleared from value prop, clear query too
        return '';
      }
      return prevQuery;
    });
    setShowSuggestions(false);
  }, [value?.address, value?.toBeConfirmed, value?.isVirtual]);

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
      country: suggestion.address?.country || 'New Zealand',
      toBeConfirmed: false, // Clear toBeConfirmed when a location is selected
      isVirtual: false, // Clear isVirtual when a physical location is selected
    };

    // Only include optional fields if they have values
    if (suggestion.address?.city) {
      location.city = suggestion.address.city;
    }
    if (suggestion.address?.state) {
      location.region = suggestion.address.state;
    }

    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    onChange(location);
  };

  const handleVirtualEventChange = (checked: boolean) => {
    if (checked) {
      // When virtual event is checked, set isVirtual and clear location data
      onChange({
        address: 'Virtual Event',
        coordinates: { lat: 0, lng: 0 },
        isVirtual: true,
        toBeConfirmed: false,
      });
      setQuery('');
      setShowSuggestions(false);
    } else {
      // When unchecked, clear isVirtual and reset to empty location
      onChange({
        address: '',
        coordinates: { lat: 0, lng: 0 },
        isVirtual: false,
        toBeConfirmed: true,
      });
      setQuery('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);

    // Only clear the location when input is completely empty
    // Don't update the location while user is typing - wait for them to select from suggestions
    if (!e.target.value || e.target.value.trim() === '') {
      onChange({
        address: '',
        coordinates: { lat: 0, lng: 0 },
        toBeConfirmed: true,
        isVirtual: false,
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
    return undefined;
  }, [showSuggestions]);

  return (
    <div className="space-y-3">
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
            disabled={value?.isVirtual}
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

      {/* Virtual Event Checkbox - only show when not typing */}
      {!query && !showSuggestions && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="virtual-event"
            checked={value?.isVirtual || false}
            onCheckedChange={handleVirtualEventChange}
          />
          <Label
            htmlFor="virtual-event"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Virtual Event
          </Label>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Show "Virtual Event" message when virtual event is checked */}
      {value?.isVirtual && (
        <p className="text-sm text-green-600 italic">
          This event is set as a virtual event. No physical location required.
        </p>
      )}

      {/* Show "To Be Confirmed" message when location is empty and not virtual */}
      {!value?.isVirtual &&
        (!query || !value?.address || value.toBeConfirmed) && (
          <p className="text-sm text-muted-foreground italic">
            Location will be marked as &quot;To Be Confirmed&quot; if location
            inputs are left empty
          </p>
        )}

      {/* Selected Location Display - only show map if address picked from suggestions (has valid coordinates) */}
      {value &&
        value.address &&
        !value.toBeConfirmed &&
        !value.isVirtual &&
        value.coordinates &&
        value.coordinates.lat !== 0 &&
        value.coordinates.lng !== 0 && (
          <LocationMap coordinates={value.coordinates} />
        )}
    </div>
  );
}
