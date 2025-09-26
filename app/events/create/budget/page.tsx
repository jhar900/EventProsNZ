'use client';

import React from 'react';
import { BudgetPlanning } from '@/components/features/budget/BudgetPlanning';

export default function BudgetPlanningPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Budget Planning
          </h1>
          <p className="text-gray-600">
            Plan your event budget with AI-powered recommendations and real-time
            pricing data.
          </p>
        </div>

        <BudgetPlanning />
      </div>
    </div>
  );
}
