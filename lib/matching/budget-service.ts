import { createClient } from '@/lib/supabase/server';
import { BudgetCompatibility } from '@/types/matching';

export class BudgetService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Calculate budget compatibility between event and contractor
   */
  async calculateBudgetCompatibility(
    eventBudget: number,
    contractorPricing: { min: number; max: number }
  ): Promise<BudgetCompatibility> {
    try {
      // Calculate budget range match
      const budgetRangeMatch =
        eventBudget >= contractorPricing.min &&
        eventBudget <= contractorPricing.max;

      // Calculate price affordability (how much of the budget the contractor's max price takes)
      const priceAffordability = Math.min(
        1,
        eventBudget / contractorPricing.max
      );

      // Calculate value score (how much value for money)
      const valueScore = contractorPricing.min / eventBudget;

      // Calculate budget flexibility (how much pricing range the contractor has)
      const budgetFlexibility = Math.min(
        1,
        (contractorPricing.max - contractorPricing.min) / eventBudget
      );

      // Calculate overall score
      const overallScore =
        (budgetRangeMatch ? 1 : 0) * 0.4 +
        priceAffordability * 0.3 +
        valueScore * 0.2 +
        budgetFlexibility * 0.1;

      return {
        budget_range_match: budgetRangeMatch,
        price_affordability: priceAffordability,
        value_score: valueScore,
        budget_flexibility: budgetFlexibility,
        overall_score: Math.min(1, Math.max(0, overallScore)),
      };
    } catch (error) {
      console.error('Error calculating budget compatibility:', error);
      throw new Error('Failed to calculate budget compatibility');
    }
  }

  /**
   * Get contractor pricing from services
   */
  async getContractorPricing(
    contractorId: string
  ): Promise<{ min: number; max: number }> {
    try {
      const { data: services, error } = await this.supabase
        .from('services')
        .select('price_range_min, price_range_max')
        .eq('user_id', contractorId);

      if (error) {
        console.error('Error fetching contractor pricing:', error);
        return { min: 0, max: 1000 };
      }

      if (!services || services.length === 0) {
        return { min: 0, max: 1000 };
      }

      const validPrices = services.filter(
        s => s.price_range_min && s.price_range_max
      );

      if (validPrices.length === 0) {
        return { min: 0, max: 1000 };
      }

      return {
        min: Math.min(...validPrices.map(s => s.price_range_min)),
        max: Math.max(...validPrices.map(s => s.price_range_max)),
      };
    } catch (error) {
      console.error('Error in getContractorPricing:', error);
      return { min: 0, max: 1000 };
    }
  }

  /**
   * Calculate budget compatibility for event and contractor
   */
  async calculateEventContractorBudgetCompatibility(
    eventId: string,
    contractorId: string
  ): Promise<BudgetCompatibility> {
    try {
      // Get event budget
      const { data: event, error: eventError } = await this.supabase
        .from('events')
        .select('budget_total')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found');
      }

      // Get contractor pricing
      const contractorPricing = await this.getContractorPricing(contractorId);

      // Calculate compatibility
      return await this.calculateBudgetCompatibility(
        event.budget_total || 0,
        contractorPricing
      );
    } catch (error) {
      console.error(
        'Error calculating event-contractor budget compatibility:',
        error
      );
      throw new Error('Failed to calculate budget compatibility');
    }
  }

  /**
   * Get budget recommendations based on event type and requirements
   */
  async getBudgetRecommendations(
    eventType: string,
    attendeeCount: number,
    duration: number
  ): Promise<{
    recommended_budget: { min: number; max: number };
    budget_breakdown: {
      category: string;
      percentage: number;
      amount: number;
    }[];
  }> {
    try {
      // Base budget calculations by event type
      const baseBudgets: Record<string, { min: number; max: number }> = {
        wedding: { min: 5000, max: 50000 },
        corporate: { min: 2000, max: 20000 },
        birthday: { min: 500, max: 5000 },
        conference: { min: 3000, max: 30000 },
        party: { min: 800, max: 8000 },
      };

      const baseBudget = baseBudgets[eventType.toLowerCase()] || {
        min: 1000,
        max: 10000,
      };

      // Adjust for attendee count
      const attendeeMultiplier = Math.max(1, attendeeCount / 50);
      const adjustedMin = baseBudget.min * attendeeMultiplier;
      const adjustedMax = baseBudget.max * attendeeMultiplier;

      // Adjust for duration
      const durationMultiplier = Math.max(1, duration / 8);
      const finalMin = adjustedMin * durationMultiplier;
      const finalMax = adjustedMax * durationMultiplier;

      const recommended_budget = {
        min: Math.round(finalMin),
        max: Math.round(finalMax),
      };

      // Budget breakdown by category
      const budget_breakdown = [
        {
          category: 'Venue',
          percentage: 0.4,
          amount: Math.round(recommended_budget.min * 0.4),
        },
        {
          category: 'Catering',
          percentage: 0.25,
          amount: Math.round(recommended_budget.min * 0.25),
        },
        {
          category: 'Entertainment',
          percentage: 0.15,
          amount: Math.round(recommended_budget.min * 0.15),
        },
        {
          category: 'Decorations',
          percentage: 0.1,
          amount: Math.round(recommended_budget.min * 0.1),
        },
        {
          category: 'Photography',
          percentage: 0.05,
          amount: Math.round(recommended_budget.min * 0.05),
        },
        {
          category: 'Other',
          percentage: 0.05,
          amount: Math.round(recommended_budget.min * 0.05),
        },
      ];

      return {
        recommended_budget,
        budget_breakdown,
      };
    } catch (error) {
      console.error('Error getting budget recommendations:', error);
      throw new Error('Failed to get budget recommendations');
    }
  }

  /**
   * Analyze budget trends for similar events
   */
  async analyzeBudgetTrends(
    eventType: string,
    location?: string
  ): Promise<{
    average_budget: number;
    budget_range: { min: number; max: number };
    trend: 'increasing' | 'decreasing' | 'stable';
  }> {
    try {
      // This would typically query historical event data
      // For now, return mock data
      const mockData = {
        average_budget: 15000,
        budget_range: { min: 5000, max: 30000 },
        trend: 'increasing' as const,
      };

      return mockData;
    } catch (error) {
      console.error('Error analyzing budget trends:', error);
      throw new Error('Failed to analyze budget trends');
    }
  }
}

export const budgetService = new BudgetService();
