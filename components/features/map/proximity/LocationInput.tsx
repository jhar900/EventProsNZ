/**
 * Location Input Component
 * Location input with Mapbox autocomplete integration
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, X, Loader2 } from 'lucide-react';
import { LocationSuggestion } from '@/lib/maps/proximity/proximity-service';

export interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  suggestions: LocationSuggestion[];
  showSuggestions: boolean;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function LocationInput({
  value,
  onChange,
  onSelect,
  suggestions,
  showSuggestions,
  onClear,
  placeholder = 'Enter location...',
  className,
  disabled = false,
}: LocationInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    onSelect(suggestion);
    setSelectedIndex(-1);
    inputRef.current?.blur();
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
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (value.length >= 2) {
      // This will be handled by the parent component
    }
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent) => {
    // Delay blur to allow suggestion clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  // Handle clear
  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  // Get suggestion icon
  const getSuggestionIcon = (type: LocationSuggestion['type']) => {
    switch (type) {
      case 'address':
        return <MapPin className="h-4 w-4" />;
      case 'poi':
        return <MapPin className="h-4 w-4" />;
      case 'city':
        return <MapPin className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
        />

        {/* Clear Button */}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && isFocused && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
        >
          <div className="max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground ${
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : ''
                } ${index === 0 ? 'rounded-t-md' : ''} ${
                  index === suggestions.length - 1 ? 'rounded-b-md' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {suggestion.name}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {suggestion.formatted_address}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showSuggestions && suggestions.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-center text-sm text-muted-foreground shadow-lg">
          No locations found
        </div>
      )}
    </div>
  );
}
