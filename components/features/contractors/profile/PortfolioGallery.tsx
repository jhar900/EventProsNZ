'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarIcon,
  EyeIcon,
  ShareIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks/usePortfolio';

// Performance monitoring for image loading
interface ImageLoadMetrics {
  imageId: string;
  loadTime: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

const SLOW_LOAD_THRESHOLD = 2000; // 2 seconds
const imageLoadTimes = new Map<string, number>();
const imageLoadMetrics: ImageLoadMetrics[] = [];

// Performance monitoring functions
function trackImageLoadStart(imageId: string): void {
  imageLoadTimes.set(imageId, Date.now());
}

function trackImageLoadEnd(
  imageId: string,
  success: boolean,
  error?: string
): void {
  const startTime = imageLoadTimes.get(imageId);
  if (!startTime) return;

  const loadTime = Date.now() - startTime;
  const metric: ImageLoadMetrics = {
    imageId,
    loadTime,
    timestamp: Date.now(),
    success,
    error,
  };

  imageLoadMetrics.push(metric);
  imageLoadTimes.delete(imageId);

  // Log slow loading images
  if (loadTime > SLOW_LOAD_THRESHOLD) {
    }

  // Keep only last 100 metrics to prevent memory leaks
  if (imageLoadMetrics.length > 100) {
    imageLoadMetrics.splice(0, imageLoadMetrics.length - 100);
  }
}

function getImageLoadStats(): {
  averageLoadTime: number;
  slowLoads: number;
  totalLoads: number;
} {
  if (imageLoadMetrics.length === 0) {
    return { averageLoadTime: 0, slowLoads: 0, totalLoads: 0 };
  }

  const totalLoadTime = imageLoadMetrics.reduce(
    (sum, metric) => sum + metric.loadTime,
    0
  );
  const slowLoads = imageLoadMetrics.filter(
    metric => metric.loadTime > SLOW_LOAD_THRESHOLD
  ).length;

  return {
    averageLoadTime: Math.round(totalLoadTime / imageLoadMetrics.length),
    slowLoads,
    totalLoads: imageLoadMetrics.length,
  };
}

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoPlatform?: string;
  eventDate?: string;
  category?: string;
  createdAt: string;
}

interface PortfolioGalleryProps {
  contractorId: string;
  initialPortfolio?: PortfolioItem[];
  className?: string;
}

interface LightboxProps {
  item: PortfolioItem;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

function Lightbox({
  item,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: LightboxProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrevious) onPrevious();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    if (navigator.share && item.imageUrl) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: item.imageUrl,
        });
      } catch (error) {
        }
    } else {
      // Fallback: copy to clipboard
      if (item.imageUrl) {
        await navigator.clipboard.writeText(item.imageUrl);
        // You could show a toast notification here
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="relative max-w-7xl max-h-full p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Navigation buttons */}
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>
        )}

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Media */}
          <div className="flex-1 flex items-center justify-center">
            {item.videoUrl ? (
              <div className="w-full max-w-4xl">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {item.videoPlatform === 'youtube' ? (
                    <iframe
                      src={item.videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                      title={item.title}
                    />
                  ) : (
                    <video
                      src={item.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>
              </div>
            ) : item.imageUrl ? (
              <div className="relative max-w-4xl max-h-[80vh]">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={1200}
                  height={800}
                  className="object-contain max-h-[80vh] w-auto"
                  priority
                  onLoadStart={() => trackImageLoadStart(`${item.id}-lightbox`)}
                  onLoad={() => trackImageLoadEnd(`${item.id}-lightbox`, true)}
                  onError={() =>
                    trackImageLoadEnd(
                      `${item.id}-lightbox`,
                      false,
                      'Failed to load lightbox image'
                    )
                  }
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="w-full lg:w-80 text-white">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                {item.description && (
                  <p className="text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {item.eventDate && (
                  <div className="flex items-center text-gray-300">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span>{formatDate(item.eventDate)}</span>
                  </div>
                )}

                {item.category && (
                  <Badge
                    variant="secondary"
                    className="bg-white bg-opacity-20 text-white"
                  >
                    {item.category}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="border-white text-white hover:bg-white hover:text-black"
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioGallery({
  contractorId,
  initialPortfolio = [],
  className = '',
}: PortfolioGalleryProps) {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [allPortfolio, setAllPortfolio] =
    useState<PortfolioItem[]>(initialPortfolio);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Performance monitoring state
  const [imageLoadStats, setImageLoadStats] = useState(getImageLoadStats());

  // Use React Query for data fetching
  const { data, isLoading, error, refetch } = usePortfolio(contractorId, {
    page,
    limit: 12,
    category: selectedCategory,
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllPortfolio(data.portfolio);
      } else {
        setAllPortfolio(prev => [...prev, ...data.portfolio]);
      }
    }
  }, [data, page]);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
    setAllPortfolio([]);
  }, [selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const goToNext = () => {
    if (lightboxIndex < allPortfolio.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
    });
  };

  // Image load handlers for performance monitoring
  const handleImageLoadStart = useCallback((imageId: string) => {
    trackImageLoadStart(imageId);
  }, []);

  const handleImageLoad = useCallback((imageId: string) => {
    trackImageLoadEnd(imageId, true);
    setImageLoadStats(getImageLoadStats());
  }, []);

  const handleImageError = useCallback((imageId: string, error: string) => {
    trackImageLoadEnd(imageId, false, error);
    setImageLoadStats(getImageLoadStats());
  }, []);

  // Show error state
  if (error) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-red-500">
          <MagnifyingGlassIcon className="h-16 w-16 mx-auto mb-4 text-red-300" />
          <h3 className="text-lg font-medium mb-2">Error Loading Portfolio</h3>
          <p>There was an error loading the portfolio. Please try again.</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Show empty state
  if (allPortfolio.length === 0 && !isLoading) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <div className="text-gray-500">
          <MagnifyingGlassIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Portfolio Items</h3>
          <p>This contractor hasn&apos;t added any portfolio items yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`portfolio-gallery ${className}`}>
      {/* Performance Monitoring (Development Only) */}
      {process.env.NODE_ENV === 'development' &&
        imageLoadStats.totalLoads > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-800">
                Image Performance:
              </span>
              <div className="flex gap-4 text-blue-600">
                <span>Avg: {imageLoadStats.averageLoadTime}ms</span>
                <span>
                  Slow: {imageLoadStats.slowLoads}/{imageLoadStats.totalLoads}
                </span>
              </div>
            </div>
          </div>
        )}

      {/* Category Filter */}
      {data?.categories && data.categories.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('')}
            >
              All
            </Button>
            {data.categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {allPortfolio.map((item, index) => (
          <Card
            key={item.id}
            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
            onClick={() => openLightbox(index)}
          >
            <div className="aspect-video relative bg-gray-100">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  onLoadStart={() => handleImageLoadStart(item.id)}
                  onLoad={() => handleImageLoad(item.id)}
                  onError={() =>
                    handleImageError(item.id, 'Failed to load image')
                  }
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              ) : item.videoUrl ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center mb-2">
                      <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                    </div>
                    <p className="text-sm text-gray-600">Video</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <EyeIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Category Badge */}
              {item.category && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
              )}
            </div>

            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                {item.title}
              </h4>
              {item.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}
              {item.eventDate && (
                <div className="flex items-center text-xs text-gray-500">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>{formatDate(item.eventDate)}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {data && page < data.totalPages && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
            className="min-w-32"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Loading...
              </div>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          item={allPortfolio[lightboxIndex]}
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
          hasPrevious={lightboxIndex > 0}
          hasNext={lightboxIndex < allPortfolio.length - 1}
        />
      )}
    </div>
  );
}
