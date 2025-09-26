'use client';

import React from 'react';
import { BudgetTracking } from '@/components/features/budget/BudgetTracking';

export default function BudgetTrackingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Budget Tracking
          </h1>
          <p className="text-gray-600">
            Track your actual costs against estimated budgets and get insights
            for future planning.
          </p>
        </div>

        <BudgetTracking tracking={[]} totalBudget={0} />
      </div>
    </div>
  );
}
