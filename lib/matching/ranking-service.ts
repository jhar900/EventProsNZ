import { ContractorMatch, ContractorRanking } from '@/types/matching';

export class RankingService {
  /**
   * Rank contractors based on matches and algorithm
   */
  async rankContractors(
    matches: ContractorMatch[],
    algorithm: string = 'default'
  ): Promise<ContractorRanking[]> {
    try {
      let rankedMatches: ContractorMatch[];

      switch (algorithm) {
        case 'premium_boost':
          rankedMatches = this.rankWithPremiumBoost(matches);
          break;
        case 'location_priority':
          rankedMatches = this.rankWithLocationPriority(matches);
          break;
        case 'budget_priority':
          rankedMatches = this.rankWithBudgetPriority(matches);
          break;
        case 'performance_priority':
          rankedMatches = this.rankWithPerformancePriority(matches);
          break;
        default:
          rankedMatches = this.rankDefault(matches);
      }

      return rankedMatches.map((match, index) => ({
        contractor_id: match.contractor_id,
        rank: index + 1,
        score: match.overall_score,
        is_premium: match.is_premium,
        match_reasons: this.generateMatchReasons(match),
      }));
    } catch (error) {
      console.error('Error ranking contractors:', error);
      throw new Error('Failed to rank contractors');
    }
  }

  /**
   * Default ranking algorithm
   */
  private rankDefault(matches: ContractorMatch[]): ContractorMatch[] {
    return [...matches].sort((a, b) => {
      // Primary sort: overall score
      if (b.overall_score !== a.overall_score) {
        return b.overall_score - a.overall_score;
      }

      // Secondary sort: premium status
      if (a.is_premium !== b.is_premium) {
        return b.is_premium ? 1 : -1;
      }

      // Tertiary sort: compatibility score
      return b.compatibility_score - a.compatibility_score;
    });
  }

  /**
   * Ranking with premium boost
   */
  private rankWithPremiumBoost(matches: ContractorMatch[]): ContractorMatch[] {
    return [...matches].sort((a, b) => {
      // Apply premium boost to scores
      const scoreA = a.is_premium ? a.overall_score * 1.1 : a.overall_score;
      const scoreB = b.is_premium ? b.overall_score * 1.1 : b.overall_score;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // Secondary sort: premium status
      if (a.is_premium !== b.is_premium) {
        return b.is_premium ? 1 : -1;
      }

      return b.overall_score - a.overall_score;
    });
  }

  /**
   * Ranking with location priority
   */
  private rankWithLocationPriority(
    matches: ContractorMatch[]
  ): ContractorMatch[] {
    return [...matches].sort((a, b) => {
      // Primary sort: location score
      if (b.location_score !== a.location_score) {
        return b.location_score - a.location_score;
      }

      // Secondary sort: overall score
      if (b.overall_score !== a.overall_score) {
        return b.overall_score - a.overall_score;
      }

      // Tertiary sort: premium status
      if (a.is_premium !== b.is_premium) {
        return b.is_premium ? 1 : -1;
      }

      return b.compatibility_score - a.compatibility_score;
    });
  }

  /**
   * Ranking with budget priority
   */
  private rankWithBudgetPriority(
    matches: ContractorMatch[]
  ): ContractorMatch[] {
    return [...matches].sort((a, b) => {
      // Primary sort: budget score
      if (b.budget_score !== a.budget_score) {
        return b.budget_score - a.budget_score;
      }

      // Secondary sort: overall score
      if (b.overall_score !== a.overall_score) {
        return b.overall_score - a.overall_score;
      }

      // Tertiary sort: premium status
      if (a.is_premium !== b.is_premium) {
        return b.is_premium ? 1 : -1;
      }

      return b.compatibility_score - a.compatibility_score;
    });
  }

  /**
   * Ranking with performance priority
   */
  private rankWithPerformancePriority(
    matches: ContractorMatch[]
  ): ContractorMatch[] {
    return [...matches].sort((a, b) => {
      // Primary sort: performance score
      if (b.performance_score !== a.performance_score) {
        return b.performance_score - a.performance_score;
      }

      // Secondary sort: overall score
      if (b.overall_score !== a.overall_score) {
        return b.overall_score - a.overall_score;
      }

      // Tertiary sort: premium status
      if (a.is_premium !== b.is_premium) {
        return b.is_premium ? 1 : -1;
      }

      return b.compatibility_score - a.compatibility_score;
    });
  }

  /**
   * Generate match reasons for a contractor
   */
  private generateMatchReasons(match: ContractorMatch): string[] {
    const reasons: string[] = [];

    if (match.compatibility_score > 0.8) {
      reasons.push('High service compatibility');
    }

    if (match.availability_score > 0.8) {
      reasons.push('Available for your event date');
    }

    if (match.budget_score > 0.8) {
      reasons.push('Fits within your budget');
    }

    if (match.location_score > 0.8) {
      reasons.push('Located in your service area');
    }

    if (match.performance_score > 0.8) {
      reasons.push('Excellent performance record');
    }

    if (match.is_premium) {
      reasons.push('Premium contractor');
    }

    if (match.overall_score > 0.9) {
      reasons.push('Exceptional overall match');
    }

    if (match.compatibility_score > 0.7 && match.availability_score > 0.7) {
      reasons.push('Strong availability and compatibility');
    }

    if (match.budget_score > 0.7 && match.location_score > 0.7) {
      reasons.push('Good budget and location fit');
    }

    return reasons;
  }

  /**
   * Get ranking algorithm information
   */
  getAlgorithmInfo(algorithm: string): {
    name: string;
    description: string;
    weights: {
      compatibility: number;
      availability: number;
      budget: number;
      location: number;
      performance: number;
    };
  } {
    const algorithms = {
      default: {
        name: 'Default',
        description: 'Balanced scoring across all factors',
        weights: {
          compatibility: 0.25,
          availability: 0.2,
          budget: 0.2,
          location: 0.15,
          performance: 0.2,
        },
      },
      premium_boost: {
        name: 'Premium Boost',
        description: 'Prioritizes premium contractors with quality boost',
        weights: {
          compatibility: 0.25,
          availability: 0.2,
          budget: 0.15,
          location: 0.15,
          performance: 0.25,
        },
      },
      location_priority: {
        name: 'Location Priority',
        description: 'Emphasizes location and proximity factors',
        weights: {
          compatibility: 0.2,
          availability: 0.15,
          budget: 0.15,
          location: 0.35,
          performance: 0.15,
        },
      },
      budget_priority: {
        name: 'Budget Priority',
        description: 'Focuses on budget compatibility and value',
        weights: {
          compatibility: 0.2,
          availability: 0.15,
          budget: 0.35,
          location: 0.15,
          performance: 0.15,
        },
      },
      performance_priority: {
        name: 'Performance Priority',
        description: 'Emphasizes contractor performance and reliability',
        weights: {
          compatibility: 0.2,
          availability: 0.15,
          budget: 0.15,
          location: 0.15,
          performance: 0.35,
        },
      },
    };

    return (
      algorithms[algorithm as keyof typeof algorithms] || algorithms.default
    );
  }
}

export const rankingService = new RankingService();
