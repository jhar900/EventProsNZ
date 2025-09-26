'use client';

import React from 'react';
import { BudgetRecommendations } from '@/components/features/budget/BudgetRecommendations';

export default function BudgetRecommendationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Budget Recommendations
          </h1>
          <p className="text-gray-600">
            AI-powered budget recommendations based on your event details and
            industry data.
          </p>
        </div>

        <BudgetRecommendations recommendations={[]} totalBudget={0} />
      </div>
    </div>
  );
}
