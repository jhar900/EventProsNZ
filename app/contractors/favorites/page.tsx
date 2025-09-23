'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { ContractorGrid } from '@/components/features/contractors/ContractorGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  HeartIcon,
  TrashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function FavoritesPage() {
  const { favorites, isLoading, getFavorites, removeFromFavorites } =
    useSearch();

  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    getFavorites();
  }, [getFavorites]);

  const handleRemoveFavorite = async (contractorId: string) => {
    setIsRemoving(contractorId);
    try {
      await removeFromFavorites(contractorId);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/contractors">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to contractors</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <HeartIcon className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Favorite Contractors
              </h1>
              <p className="text-gray-600">
                Your saved contractors for easy access
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading favorites...</span>
          </div>
        )}

        {/* No Favorites */}
        {!isLoading && favorites.length === 0 && (
          <Card className="p-6 text-center">
            <div className="text-gray-500 mb-4">
              <HeartIcon className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No favorites yet</h3>
              <p className="text-sm">
                Start exploring contractors and add them to your favorites for
                easy access.
              </p>
            </div>
            <Link href="/contractors">
              <Button>Browse Contractors</Button>
            </Link>
          </Card>
        )}

        {/* Favorites Grid */}
        {!isLoading && favorites.length > 0 && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {favorites.length} favorite contractor
                {favorites.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {/* Contractors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(favorite => (
                <div key={favorite.id} className="relative">
                  <ContractorGrid
                    contractors={[favorite.contractor]}
                    isLoading={false}
                  />

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFavorite(favorite.contractor.id)}
                    disabled={isRemoving === favorite.contractor.id}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                  >
                    {isRemoving === favorite.contractor.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
