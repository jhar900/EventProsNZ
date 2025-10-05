'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { MAPBOX_CONFIG } from '@/lib/maps/mapbox-config';

interface AddressSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
    wikidata?: string;
  }>;
}

interface AddressAutosuggestProps {
  name: string;
  placeholder?: string;
  className?: string;
  onAddressSelect?: (address: string, coordinates?: [number, number]) => void;
}

export default function AddressAutosuggest({
  name,
  placeholder = 'Enter your address',
  className = '',
  onAddressSelect,
}: AddressAutosuggestProps) {
  const { register, setValue, watch } = useFormContext();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Watch the form field value
  const fieldValue = watch(name);

  // Initialize with existing value
  useEffect(() => {
    if (fieldValue && !query) {
      setQuery(fieldValue);
    }
  }, [fieldValue, query]);

  // Debounced search function
  const searchAddresses = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
      console.warn('Mapbox token not configured');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_CONFIG.ACCESS_TOKEN}&country=${MAPBOX_CONFIG.GEOCODING.country}&types=${MAPBOX_CONFIG.GEOCODING.types}&limit=${MAPBOX_CONFIG.GEOCODING.limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setValue(name, value);
    setSelectedIndex(-1);

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search
    debounceRef.current = setTimeout(() => {
      searchAddresses(value);
    }, 300);

    setShowSuggestions(true);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setQuery(suggestion.place_name);
    setValue(name, suggestion.place_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Call the optional callback with coordinates
    onAddressSelect?.(suggestion.place_name, suggestion.center);
  };

  // Handle manual input (when user types without selecting)
  const handleManualInput = (value: string) => {
    setQuery(value);
    setValue(name, value);
    onAddressSelect?.(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
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
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        {...register(name)}
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`px-4 py-3 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="font-medium flex items-start">
                <span className="mr-2 text-gray-400">📍</span>
                <span>{suggestion.place_name}</span>
              </div>
              {suggestion.context && suggestion.context.length > 0 && (
                <div className="text-xs text-gray-500 mt-1 ml-6">
                  {suggestion.context
                    .slice(0, 2)
                    .map(ctx => ctx.text)
                    .join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showSuggestions &&
        !isLoading &&
        suggestions.length === 0 &&
        query.length >= 3 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500">
            No addresses found. Try a different search term.
          </div>
        )}
    </div>
  );
}
