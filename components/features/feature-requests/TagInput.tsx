'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
}

export default function TagInput({
  tags,
  onTagsChange,
  maxTags = 10,
  placeholder = 'Add tags...',
  className = '',
  showSuggestions = true,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load popular tags for suggestions
  useEffect(() => {
    if (showSuggestions) {
      const loadSuggestions = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/feature-requests/tags?limit=20');
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.map((tag: any) => tag.name));
          }
        } catch (error) {
          console.error('Error loading tag suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadSuggestions();
    }
  }, [showSuggestions]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizeTag = (tag: string): string => {
    return tag
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const addTag = (tag: string) => {
    const normalizedTag = normalizeTag(tag);

    if (!normalizedTag) {
      toast.error('Invalid tag format');
      return;
    }

    if (tags.includes(normalizedTag)) {
      toast.error('Tag already exists');
      return;
    }

    if (tags.length >= maxTags) {
      toast.error(`Maximum ${maxTags} tags allowed`);
      return;
    }

    onTagsChange([...tags, normalizedTag]);
    setInputValue('');
    setShowSuggestionsList(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (value.trim() && showSuggestions) {
      const filteredSuggestions = suggestions
        .filter(
          suggestion =>
            suggestion.toLowerCase().includes(value.toLowerCase()) &&
            !tags.includes(suggestion)
        )
        .slice(0, 5);

      setSuggestions(filteredSuggestions);
      setShowSuggestionsList(filteredSuggestions.length > 0);
    } else {
      setShowSuggestionsList(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false);
      inputRef.current?.blur();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  const filteredSuggestions = suggestions
    .filter(
      suggestion =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(suggestion)
    )
    .slice(0, 5);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="tag-input">Tags</Label>

      {/* Tag Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with Suggestions */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              id="tag-input"
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (inputValue.trim() && filteredSuggestions.length > 0) {
                  setShowSuggestionsList(true);
                }
              }}
              placeholder={placeholder}
              disabled={tags.length >= maxTags}
            />

            {/* Suggestions Dropdown */}
            {showSuggestionsList && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                {filteredSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={() => addTag(inputValue)}
            disabled={!inputValue.trim() || tags.length >= maxTags}
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        {/* Help Text */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>
            {tags.length}/{maxTags} tags
          </span>
          <span>Press Enter to add tag</span>
        </div>
      </div>

      {/* Popular Tags */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Popular Tags</Label>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 10).map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                disabled={tags.includes(suggestion) || tags.length >= maxTags}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
