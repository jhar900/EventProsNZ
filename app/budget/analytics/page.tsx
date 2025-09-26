'use client';

import React from 'react';
import { BudgetValidation } from '@/components/features/budget/BudgetValidation';

export default function BudgetAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Budget Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive budget analysis and validation to ensure your event
            planning is on track.
          </p>
        </div>

        <BudgetValidation
          budgetPlan={{
            totalBudget: 0,
            serviceBreakdown: [],
            recommendations: [],
            packages: [],
            tracking: [],
            adjustments: [],
          }}
        />
      </div>
    </div>
  );
}
