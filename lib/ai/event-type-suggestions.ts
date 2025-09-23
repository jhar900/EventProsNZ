import { ServiceRecommendation, EventType } from '@/types/contractors';

export interface EventTypeSuggestion {
  eventType: EventType;
  confidence: number;
  reasoning: string;
  suggestedServices: ServiceRecommendation[];
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  guestCountRange: {
    min: number;
    max: number;
  };
  duration: {
    min: number; // in hours
    max: number;
  };
}

export interface EventTypeContext {
  description?: string;
  guestCount?: number;
  budget?: number;
  location?: string;
  date?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  formality?: 'casual' | 'semi-formal' | 'formal' | 'black-tie';
  indoorOutdoor?: 'indoor' | 'outdoor' | 'mixed';
}

// Event type patterns and characteristics
const EVENT_TYPE_PATTERNS = {
  wedding: {
    keywords: [
      'wedding',
      'marriage',
      'ceremony',
      'reception',
      'bride',
      'groom',
      'bridal',
      'nuptials',
    ],
    services: [
      {
        name: 'Photography',
        category: 'photography',
        priority: 'high',
        importance: 95,
      },
      {
        name: 'Videography',
        category: 'photography',
        priority: 'high',
        importance: 90,
      },
      {
        name: 'Catering',
        category: 'catering',
        priority: 'high',
        importance: 95,
      },
      {
        name: 'Music/DJ',
        category: 'entertainment',
        priority: 'high',
        importance: 90,
      },
      {
        name: 'Flowers',
        category: 'decoration',
        priority: 'high',
        importance: 85,
      },
      { name: 'Venue', category: 'venue', priority: 'high', importance: 100 },
      {
        name: 'Wedding Planner',
        category: 'planning',
        priority: 'medium',
        importance: 80,
      },
      {
        name: 'Transportation',
        category: 'transportation',
        priority: 'medium',
        importance: 70,
      },
      {
        name: 'Hair & Makeup',
        category: 'beauty',
        priority: 'medium',
        importance: 75,
      },
      {
        name: 'Cake',
        category: 'catering',
        priority: 'medium',
        importance: 80,
      },
    ],
    budgetRange: { min: 5000, max: 50000 },
    guestCountRange: { min: 50, max: 300 },
    duration: { min: 6, max: 12 },
  },
  corporate: {
    keywords: [
      'corporate',
      'business',
      'conference',
      'meeting',
      'seminar',
      'workshop',
      'training',
      'presentation',
    ],
    services: [
      {
        name: 'AV Equipment',
        category: 'technology',
        priority: 'high',
        importance: 90,
      },
      {
        name: 'Catering',
        category: 'catering',
        priority: 'medium',
        importance: 70,
      },
      { name: 'Venue', category: 'venue', priority: 'high', importance: 95 },
      {
        name: 'Event Coordinator',
        category: 'planning',
        priority: 'high',
        importance: 85,
      },
      {
        name: 'Transportation',
        category: 'transportation',
        priority: 'low',
        importance: 50,
      },
      {
        name: 'Photography',
        category: 'photography',
        priority: 'low',
        importance: 40,
      },
      {
        name: 'Security',
        category: 'security',
        priority: 'medium',
        importance: 60,
      },
    ],
    budgetRange: { min: 2000, max: 20000 },
    guestCountRange: { min: 20, max: 500 },
    duration: { min: 2, max: 8 },
  },
  birthday: {
    keywords: [
      'birthday',
      'party',
      'celebration',
      'turning',
      'years old',
      'anniversary',
    ],
    services: [
      {
        name: 'Catering',
        category: 'catering',
        priority: 'high',
        importance: 85,
      },
      {
        name: 'Music/DJ',
        category: 'entertainment',
        priority: 'high',
        importance: 80,
      },
      {
        name: 'Photography',
        category: 'photography',
        priority: 'medium',
        importance: 70,
      },
      {
        name: 'Decoration',
        category: 'decoration',
        priority: 'medium',
        importance: 75,
      },
      { name: 'Cake', category: 'catering', priority: 'high', importance: 90 },
      {
        name: 'Entertainment',
        category: 'entertainment',
        priority: 'medium',
        importance: 65,
      },
      { name: 'Venue', category: 'venue', priority: 'medium', importance: 70 },
    ],
    budgetRange: { min: 500, max: 5000 },
    guestCountRange: { min: 10, max: 100 },
    duration: { min: 3, max: 6 },
  },
  conference: {
    keywords: [
      'conference',
      'convention',
      'summit',
      'symposium',
      'expo',
      'trade show',
    ],
    services: [
      {
        name: 'AV Equipment',
        category: 'technology',
        priority: 'high',
        importance: 95,
      },
      { name: 'Venue', category: 'venue', priority: 'high', importance: 100 },
      {
        name: 'Catering',
        category: 'catering',
        priority: 'medium',
        importance: 75,
      },
      {
        name: 'Event Coordinator',
        category: 'planning',
        priority: 'high',
        importance: 90,
      },
      {
        name: 'Transportation',
        category: 'transportation',
        priority: 'medium',
        importance: 60,
      },
      {
        name: 'Photography',
        category: 'photography',
        priority: 'medium',
        importance: 55,
      },
      {
        name: 'Security',
        category: 'security',
        priority: 'medium',
        importance: 70,
      },
      {
        name: 'Registration',
        category: 'technology',
        priority: 'high',
        importance: 85,
      },
    ],
    budgetRange: { min: 5000, max: 100000 },
    guestCountRange: { min: 100, max: 2000 },
    duration: { min: 4, max: 12 },
  },
};

export class EventTypeSuggestionEngine {
  /**
   * Analyze event context and suggest the most likely event type
   */
  static suggestEventType(context: EventTypeContext): EventTypeSuggestion[] {
    const suggestions: EventTypeSuggestion[] = [];

    // Calculate confidence scores for each event type
    for (const [eventType, patterns] of Object.entries(EVENT_TYPE_PATTERNS)) {
      const confidence = this.calculateConfidence(context, patterns);

      if (confidence > 0.1) {
        // Only include suggestions with >10% confidence
        suggestions.push({
          eventType: eventType as EventType,
          confidence,
          reasoning: this.generateReasoning(context, patterns, confidence),
          suggestedServices: this.getSuggestedServices(
            eventType as EventType,
            context
          ),
          estimatedBudget: this.estimateBudget(eventType as EventType, context),
          guestCountRange: this.estimateGuestCount(
            eventType as EventType,
            context
          ),
          duration: this.estimateDuration(eventType as EventType, context),
        });
      }
    }

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score for an event type based on context
   */
  private static calculateConfidence(
    context: EventTypeContext,
    patterns: any
  ): number {
    let score = 0;
    let factors = 0;

    // Keyword matching from description
    if (context.description) {
      const description = context.description.toLowerCase();
      const keywordMatches = patterns.keywords.filter((keyword: string) =>
        description.includes(keyword.toLowerCase())
      ).length;
      score += (keywordMatches / patterns.keywords.length) * 0.4;
      factors++;
    }

    // Guest count analysis
    if (context.guestCount) {
      const { min, max } = patterns.guestCountRange;
      if (context.guestCount >= min && context.guestCount <= max) {
        score += 0.3;
      } else if (
        context.guestCount < min * 0.5 ||
        context.guestCount > max * 1.5
      ) {
        score -= 0.2;
      }
      factors++;
    }

    // Budget analysis
    if (context.budget) {
      const { min, max } = patterns.budgetRange;
      if (context.budget >= min && context.budget <= max) {
        score += 0.2;
      } else if (context.budget < min * 0.3 || context.budget > max * 2) {
        score -= 0.1;
      }
      factors++;
    }

    // Time of day analysis
    if (context.timeOfDay) {
      const timeScore = this.getTimeOfDayScore(context.timeOfDay, patterns);
      score += timeScore * 0.1;
      factors++;
    }

    return factors > 0 ? Math.max(0, score / factors) : 0;
  }

  /**
   * Get time of day relevance score for event type
   */
  private static getTimeOfDayScore(timeOfDay: string, patterns: any): number {
    const timePreferences: Record<string, Record<string, number>> = {
      wedding: { evening: 0.9, afternoon: 0.7, morning: 0.3, night: 0.8 },
      corporate: { morning: 0.8, afternoon: 0.9, evening: 0.4, night: 0.1 },
      birthday: { afternoon: 0.8, evening: 0.9, morning: 0.4, night: 0.6 },
      conference: { morning: 0.9, afternoon: 0.8, evening: 0.3, night: 0.1 },
    };

    return timePreferences[patterns.eventType]?.[timeOfDay] || 0.5;
  }

  /**
   * Generate human-readable reasoning for the suggestion
   */
  private static generateReasoning(
    context: EventTypeContext,
    patterns: any,
    confidence: number
  ): string {
    const reasons: string[] = [];

    if (context.description) {
      const description = context.description.toLowerCase();
      const matchedKeywords = patterns.keywords.filter((keyword: string) =>
        description.includes(keyword.toLowerCase())
      );
      if (matchedKeywords.length > 0) {
        reasons.push(
          `Keywords like "${matchedKeywords.join(', ')}" suggest this event type`
        );
      }
    }

    if (context.guestCount) {
      const { min, max } = patterns.guestCountRange;
      if (context.guestCount >= min && context.guestCount <= max) {
        reasons.push(
          `Guest count of ${context.guestCount} is typical for this event type`
        );
      }
    }

    if (context.budget) {
      const { min, max } = patterns.budgetRange;
      if (context.budget >= min && context.budget <= max) {
        reasons.push(
          `Budget range aligns with typical costs for this event type`
        );
      }
    }

    if (reasons.length === 0) {
      reasons.push('Based on general event characteristics');
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Get suggested services for the event type
   */
  private static getSuggestedServices(
    eventType: EventType,
    context: EventTypeContext
  ): ServiceRecommendation[] {
    const patterns = EVENT_TYPE_PATTERNS[eventType];
    if (!patterns) return [];

    // Filter and adjust services based on context
    return patterns.services.map(service => ({
      ...service,
      id: `${eventType}-${service.name.toLowerCase().replace(/\s+/g, '-')}`,
      reasoning: this.generateServiceReasoning(service, context),
    }));
  }

  /**
   * Generate reasoning for why a service is recommended
   */
  private static generateServiceReasoning(
    service: any,
    context: EventTypeContext
  ): string {
    const baseReasons: Record<string, string> = {
      Photography: 'Essential for capturing memories and moments',
      Videography: 'Great for preserving the event in motion',
      Catering: 'Required to keep guests satisfied and comfortable',
      'Music/DJ': 'Creates atmosphere and keeps guests entertained',
      Flowers: 'Adds beauty and elegance to the event',
      Venue: 'Provides the perfect setting for your event',
      'Wedding Planner': 'Helps coordinate all aspects of the event',
      Transportation: 'Ensures guests arrive safely and on time',
      'Hair & Makeup': 'Helps you look your best for the special day',
      Cake: 'Traditional centerpiece for celebration',
      'AV Equipment': 'Essential for presentations and audio',
      'Event Coordinator': 'Manages logistics and ensures smooth execution',
      Security: 'Provides safety and peace of mind',
      Decoration: 'Transforms the space to match your vision',
      Entertainment: 'Keeps guests engaged and having fun',
      Registration: 'Streamlines check-in and attendee management',
    };

    return baseReasons[service.name] || 'Recommended for this type of event';
  }

  /**
   * Estimate budget range for the event type
   */
  private static estimateBudget(
    eventType: EventType,
    context: EventTypeContext
  ): { min: number; max: number; currency: string } {
    const patterns = EVENT_TYPE_PATTERNS[eventType];
    if (!patterns) return { min: 0, max: 0, currency: 'NZD' };

    let { min, max } = patterns.budgetRange;

    // Adjust based on guest count
    if (context.guestCount) {
      const guestMultiplier = context.guestCount / 100; // Base on 100 guests
      min = Math.round(min * guestMultiplier);
      max = Math.round(max * guestMultiplier);
    }

    // Adjust based on location (Auckland is more expensive)
    if (context.location?.toLowerCase().includes('auckland')) {
      min = Math.round(min * 1.2);
      max = Math.round(max * 1.2);
    }

    return { min, max, currency: 'NZD' };
  }

  /**
   * Estimate guest count range for the event type
   */
  private static estimateGuestCount(
    eventType: EventType,
    context: EventTypeContext
  ): { min: number; max: number } {
    const patterns = EVENT_TYPE_PATTERNS[eventType];
    if (!patterns) return { min: 0, max: 0 };

    return patterns.guestCountRange;
  }

  /**
   * Estimate duration range for the event type
   */
  private static estimateDuration(
    eventType: EventType,
    context: EventTypeContext
  ): { min: number; max: number } {
    const patterns = EVENT_TYPE_PATTERNS[eventType];
    if (!patterns) return { min: 0, max: 0 };

    return patterns.duration;
  }

  /**
   * Get event type specific tips and recommendations
   */
  static getEventTypeTips(eventType: EventType): string[] {
    const tips: Record<EventType, string[]> = {
      wedding: [
        'Book your venue 12-18 months in advance',
        'Consider hiring a wedding planner for stress-free planning',
        "Don't forget about marriage license requirements",
        'Plan for weather contingencies if having an outdoor ceremony',
        'Create a detailed timeline for the day',
      ],
      corporate: [
        'Send invitations 4-6 weeks in advance',
        'Prepare backup plans for technology issues',
        'Consider dietary restrictions for catering',
        'Have a clear agenda and stick to timing',
        'Follow up with attendees after the event',
      ],
      birthday: [
        'Consider the age group when planning activities',
        'Plan age-appropriate entertainment',
        "Don't forget about party favors or gifts",
        'Consider dietary restrictions and allergies',
        'Have a backup plan for outdoor parties',
      ],
      conference: [
        'Book venues 6-12 months in advance',
        'Prepare comprehensive speaker guidelines',
        'Plan for networking opportunities',
        'Consider accessibility requirements',
        'Have technical support on standby',
      ],
    };

    return tips[eventType] || [];
  }
}
