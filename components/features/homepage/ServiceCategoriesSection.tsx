'use client';

import React from 'react';
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
} from 'lucide-react';

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
  categories = defaultCategories,
  className = '',
}: ServiceCategoriesSectionProps) {
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

            return (
              <div
                key={category.id}
                className="group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{category.contractor_count} contractors</span>
                  </div>
                  <div className="text-blue-600 font-semibold text-sm group-hover:text-blue-700">
                    Explore →
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Featured categories */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Most Popular Services
            </h3>
            <p className="text-gray-600">These categories are in high demand</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories
              .filter(cat => cat.popular)
              .map(category => {
                const IconComponent = category.icon;
                const colorClass =
                  colorClasses[category.color as keyof typeof colorClasses];

                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {category.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {category.contractor_count} contractors available
                      </p>
                    </div>
                    <div className="text-blue-600 font-semibold">→</div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
            Browse All Categories
          </button>
        </div>
      </div>
    </section>
  );
}
