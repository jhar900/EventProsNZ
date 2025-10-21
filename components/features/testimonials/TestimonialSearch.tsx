'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface TestimonialSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function TestimonialSearch({
  onSearch,
  placeholder = 'Search testimonials...',
  className = '',
}: TestimonialSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== '') {
        setIsSearching(true);
        onSearch(query);
        setIsSearching(false);
      } else {
        onSearch('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {query && (
          <div className="mt-2 text-sm text-gray-500">
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <span>Searching for: &quot;{query}&quot;</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
