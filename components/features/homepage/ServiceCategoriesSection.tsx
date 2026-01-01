'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  Utensils,
  Music,
  Flower2,
  Car,
  Palette,
  Video,
  Mic,
  Sparkles,
  Users,
  Calendar,
  Star,
  HelpCircle,
  Building,
  Shield,
  Laptop,
  Trash2,
} from 'lucide-react';

interface ApiCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  contractor_count: number;
  popular: boolean;
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  contractor_count: number;
  color: string;
  popular: boolean;
}

interface ServiceCategoriesSectionProps {
  categories?: ServiceCategory[];
  className?: string;
}

// Icon mapping from string names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Camera,
  Utensils,
  Music,
  Flower2,
  Car,
  Palette,
  Video,
  Mic,
  Sparkles,
  Users,
  Calendar,
  Star,
  HelpCircle,
  Building,
  Shield,
  Laptop,
  Trash2,
};

// Icon mapping based on category name
const getIconForCategory = (
  name: string
): React.ComponentType<{ className?: string }> => {
  const iconNameMap: Record<string, string> = {
    Photography: 'Camera',
    Catering: 'Utensils',
    Entertainment: 'Music',
    'Floral Design': 'Flower2',
    Flowers: 'Flower2',
    Transportation: 'Car',
    'Decor & Styling': 'Palette',
    Decorations: 'Palette',
    Videography: 'Video',
    'Audio/Visual': 'Mic',
    Lighting: 'Sparkles',
    Security: 'Shield',
    Planning: 'Calendar',
    Venue: 'Building',
    Technology: 'Laptop',
    Tech: 'Laptop',
    'Waste Management': 'Trash2',
    Waste: 'Trash2',
  };
  const iconName = iconNameMap[name] || 'HelpCircle';
  return iconMap[iconName] || HelpCircle;
};

// Color mapping based on category name
const getColorForCategory = (name: string): string => {
  const colorMap: Record<string, string> = {
    Photography: 'blue',
    Catering: 'green',
    Entertainment: 'purple',
    'Floral Design': 'pink',
    Flowers: 'pink',
    Transportation: 'gray',
    'Decor & Styling': 'orange',
    Decorations: 'orange',
    Videography: 'red',
    'Audio/Visual': 'indigo',
    Lighting: 'yellow',
    Security: 'red',
    Planning: 'blue',
    Venue: 'gray',
  };
  return colorMap[name] || 'blue';
};

const defaultCategories: ServiceCategory[] = [
  {
    id: '1',
    name: 'Photography',
    description: 'Professional photographers for all occasions',
    icon: Camera,
    contractor_count: 89,
    color: 'blue',
    popular: true,
  },
  {
    id: '2',
    name: 'Catering',
    description: 'Delicious food and beverage services',
    icon: Utensils,
    contractor_count: 67,
    color: 'green',
    popular: true,
  },
  {
    id: '3',
    name: 'Entertainment',
    description: 'DJs, bands, and entertainment services',
    icon: Music,
    contractor_count: 45,
    color: 'purple',
    popular: false,
  },
  {
    id: '4',
    name: 'Floral Design',
    description: 'Beautiful flowers and arrangements',
    icon: Flower2,
    contractor_count: 34,
    color: 'pink',
    popular: false,
  },
  {
    id: '5',
    name: 'Transportation',
    description: 'Limos, buses, and transport services',
    icon: Car,
    contractor_count: 23,
    color: 'gray',
    popular: false,
  },
  {
    id: '6',
    name: 'Decor & Styling',
    description: 'Event decoration and styling services',
    icon: Palette,
    contractor_count: 56,
    color: 'orange',
    popular: true,
  },
  {
    id: '7',
    name: 'Videography',
    description: 'Professional video production',
    icon: Video,
    contractor_count: 28,
    color: 'red',
    popular: false,
  },
  {
    id: '8',
    name: 'Audio/Visual',
    description: 'Sound systems and AV equipment',
    icon: Mic,
    contractor_count: 41,
    color: 'indigo',
    popular: false,
  },
];

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600 border-blue-200',
  green: 'bg-green-100 text-green-600 border-green-200',
  purple: 'bg-purple-100 text-purple-600 border-purple-200',
  pink: 'bg-pink-100 text-pink-600 border-pink-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  orange: 'bg-orange-100 text-orange-600 border-orange-200',
  red: 'bg-red-100 text-red-600 border-red-200',
  indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
};

export function ServiceCategoriesSection({
  categories: propCategories,
  className = '',
}: ServiceCategoriesSectionProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If categories are provided as props, use them
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
      setLoading(false);
      return;
    }

    // Otherwise, fetch from API
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/homepage/categories');

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();

        // Transform API data to component format
        const transformedCategories: ServiceCategory[] = data.categories.map(
          (cat: ApiCategory) => {
            // Map category name to icon component
            const IconComponent = getIconForCategory(cat.name);
            return {
              id: cat.id,
              name: cat.name,
              description: cat.description || '',
              icon: IconComponent,
              contractor_count: cat.contractor_count || 0,
              color: getColorForCategory(cat.name),
              popular: cat.popular || false,
            };
          }
        );

        setCategories(transformedCategories);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
        // Fallback to default categories on error
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [propCategories]);

  if (loading) {
    return (
      <section className={`py-20 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && categories.length === 0) {
    return (
      <section className={`py-20 bg-gray-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-20 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Service Categories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the perfect contractors for every aspect of your event
          </p>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map(category => {
            const IconComponent = category.icon;
            const colorClass =
              colorClasses[category.color as keyof typeof colorClasses];
            const hasContractors = category.contractor_count > 0;
            const contractorsUrl = hasContractors
              ? `/contractors?service_types=${encodeURIComponent(category.name)}`
              : '#';

            const CardContent = (
              <div
                className={`group relative bg-white rounded-xl p-6 shadow-lg transition-all duration-300 h-full flex flex-col ${
                  hasContractors
                    ? 'hover:shadow-xl transform hover:scale-105 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                {/* Popular badge */}
                {category.popular && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Popular
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-16 h-16 ${colorClass} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <IconComponent className="w-8 h-8" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {category.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>
                      {category.contractor_count === 0
                        ? 'Coming Soon'
                        : `${category.contractor_count} ${
                            category.contractor_count === 1
                              ? 'contractor'
                              : 'contractors'
                          }`}
                    </span>
                  </div>
                  {hasContractors && (
                    <div className="text-blue-600 font-semibold text-sm group-hover:text-blue-700">
                      Explore →
                    </div>
                  )}
                </div>
              </div>
            );

            if (hasContractors) {
              return (
                <Link
                  key={category.id}
                  href={contractorsUrl}
                  className="h-full"
                >
                  {CardContent}
                </Link>
              );
            }

            return (
              <div key={category.id} className="h-full">
                {CardContent}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/contractors">
            <button className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-amber-700 transition-all duration-300 transform hover:scale-105">
              Browse All Categories
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
