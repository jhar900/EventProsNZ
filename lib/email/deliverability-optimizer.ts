import { createClient } from '@/lib/supabase/server';
import { EmailDeliveryMonitor } from './email-delivery-monitor';
import { EmailAuthenticationService } from './email-authentication';

export interface SenderReputation {
  domain: string;
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  factors: {
    bounceRate: number;
    complaintRate: number;
    spamTrapHits: number;
    authenticationScore: number;
    engagementRate: number;
  };
  lastUpdated: string;
}

export interface ContentOptimization {
  subject: string;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export interface ListHygiene {
  totalEmails: number;
  validEmails: number;
  invalidEmails: number;
  riskyEmails: number;
  score: number; // 0-100
  recommendations: string[];
}

export interface EngagementMetrics {
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  spamComplaintRate: number;
  engagementScore: number; // 0-100
}

export interface DeliverabilityReport {
  overallScore: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  senderReputation: SenderReputation;
  contentOptimization: ContentOptimization;
  listHygiene: ListHygiene;
  engagementMetrics: EngagementMetrics;
  recommendations: string[];
  lastUpdated: string;
}

export interface OptimizationAction {
  id: string;
  type: 'content' | 'list' | 'authentication' | 'timing' | 'frequency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export class DeliverabilityOptimizer {
  private supabase = createClient();
  private deliveryMonitor = new EmailDeliveryMonitor();
  private authService = new EmailAuthenticationService();

  /**
   * Get comprehensive deliverability report
   */
  async getDeliverabilityReport(domain: string): Promise<DeliverabilityReport> {
    try {
      const [
        senderReputation,
        contentOptimization,
        listHygiene,
        engagementMetrics,
        authStatus,
      ] = await Promise.all([
        this.getSenderReputation(domain),
        this.analyzeContentOptimization(domain),
        this.analyzeListHygiene(domain),
        this.getEngagementMetrics(domain),
        this.authService.getAuthenticationStatus(domain),
      ]);

      const overallScore = this.calculateOverallScore(
        senderReputation,
        contentOptimization,
        listHygiene,
        engagementMetrics,
        authStatus
      );

      const recommendations = this.generateRecommendations(
        senderReputation,
        contentOptimization,
        listHygiene,
        engagementMetrics,
        authStatus
      );

      const report: DeliverabilityReport = {
        overallScore,
        status: this.getStatusFromScore(overallScore),
        senderReputation,
        contentOptimization,
        listHygiene,
        engagementMetrics,
        recommendations,
        lastUpdated: new Date().toISOString(),
      };

      // Store report
      await this.storeDeliverabilityReport(domain, report);

      return report;
    } catch (error) {
      console.error('Error generating deliverability report:', error);
      throw error;
    }
  }

  /**
   * Get sender reputation
   */
  private async getSenderReputation(domain: string): Promise<SenderReputation> {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const metrics = await this.deliveryMonitor.getDeliveryMetrics(
        startDate,
        endDate
      );

      const factors = {
        bounceRate: metrics.bounceRate,
        complaintRate: metrics.complaintRate,
        spamTrapHits: 0, // Would need external service
        authenticationScore: 0, // Will be calculated from auth status
        engagementRate: 0, // Will be calculated from engagement metrics
      };

      const score = this.calculateSenderReputationScore(factors);

      return {
        domain,
        score,
        status: this.getStatusFromScore(score),
        factors,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting sender reputation:', error);
      throw error;
    }
  }

  /**
   * Analyze content optimization
   */
  private async analyzeContentOptimization(
    domain: string
  ): Promise<ContentOptimization> {
    try {
      // In a real implementation, you would analyze email content
      // For now, we'll return a mock analysis
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check for common spam triggers
      const spamTriggers = [
        'FREE',
        'URGENT',
        'ACT NOW',
        'LIMITED TIME',
        'CLICK HERE',
        'BUY NOW',
        'SAVE MONEY',
      ];

      // Mock content analysis
      const mockContent = 'This is a test email with no spam triggers.';

      if (spamTriggers.some(trigger => mockContent.includes(trigger))) {
        issues.push('Contains potential spam triggers');
        recommendations.push('Remove or replace spam trigger words');
      }

      // Check for proper HTML structure
      if (!mockContent.includes('<html>')) {
        issues.push('Missing proper HTML structure');
        recommendations.push('Use proper HTML email template');
      }

      const score = Math.max(0, 100 - issues.length * 20);

      return {
        subject: 'Test Subject',
        score,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error('Error analyzing content optimization:', error);
      throw error;
    }
  }

  /**
   * Analyze list hygiene
   */
  private async analyzeListHygiene(domain: string): Promise<ListHygiene> {
    try {
      // In a real implementation, you would analyze email list quality
      const totalEmails = 1000;
      const validEmails = 950;
      const invalidEmails = 30;
      const riskyEmails = 20;

      const score = Math.round((validEmails / totalEmails) * 100);

      const recommendations: string[] = [];

      if (invalidEmails > 0) {
        recommendations.push('Remove invalid email addresses from your list');
      }

      if (riskyEmails > 0) {
        recommendations.push('Review and clean risky email addresses');
      }

      if (score < 90) {
        recommendations.push('Implement double opt-in for new subscribers');
      }

      return {
        totalEmails,
        validEmails,
        invalidEmails,
        riskyEmails,
        score,
        recommendations,
      };
    } catch (error) {
      console.error('Error analyzing list hygiene:', error);
      throw error;
    }
  }

  /**
   * Get engagement metrics
   */
  private async getEngagementMetrics(
    domain: string
  ): Promise<EngagementMetrics> {
    try {
      // In a real implementation, you would calculate from actual data
      const openRate = 25.5;
      const clickRate = 3.2;
      const unsubscribeRate = 0.8;
      const spamComplaintRate = 0.1;

      const engagementScore = this.calculateEngagementScore(
        openRate,
        clickRate,
        unsubscribeRate,
        spamComplaintRate
      );

      return {
        openRate,
        clickRate,
        unsubscribeRate,
        spamComplaintRate,
        engagementScore,
      };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate overall deliverability score
   */
  private calculateOverallScore(
    senderReputation: SenderReputation,
    contentOptimization: ContentOptimization,
    listHygiene: ListHygiene,
    engagementMetrics: EngagementMetrics,
    authStatus: any
  ): number {
    const weights = {
      senderReputation: 0.3,
      contentOptimization: 0.2,
      listHygiene: 0.2,
      engagementMetrics: 0.2,
      authentication: 0.1,
    };

    const authScore =
      authStatus.overallStatus === 'pass'
        ? 100
        : authStatus.overallStatus === 'partial'
          ? 50
          : 0;

    return Math.round(
      senderReputation.score * weights.senderReputation +
        contentOptimization.score * weights.contentOptimization +
        listHygiene.score * weights.listHygiene +
        engagementMetrics.engagementScore * weights.engagementMetrics +
        authScore * weights.authentication
    );
  }

  /**
   * Calculate sender reputation score
   */
  private calculateSenderReputationScore(factors: any): number {
    let score = 100;

    // Deduct points for high bounce rate
    if (factors.bounceRate > 5) score -= 30;
    else if (factors.bounceRate > 2) score -= 15;

    // Deduct points for high complaint rate
    if (factors.complaintRate > 0.1) score -= 40;
    else if (factors.complaintRate > 0.05) score -= 20;

    // Deduct points for spam trap hits
    if (factors.spamTrapHits > 0) score -= 50;

    // Deduct points for poor authentication
    if (factors.authenticationScore < 50) score -= 25;

    // Deduct points for poor engagement
    if (factors.engagementRate < 10) score -= 20;

    return Math.max(0, score);
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(
    openRate: number,
    clickRate: number,
    unsubscribeRate: number,
    spamComplaintRate: number
  ): number {
    let score = 100;

    // Reward high open rates
    if (openRate > 25) score += 10;
    else if (openRate < 15) score -= 20;

    // Reward high click rates
    if (clickRate > 5) score += 15;
    else if (clickRate < 2) score -= 15;

    // Penalize high unsubscribe rates
    if (unsubscribeRate > 2) score -= 30;
    else if (unsubscribeRate > 1) score -= 15;

    // Penalize high spam complaint rates
    if (spamComplaintRate > 0.1) score -= 40;
    else if (spamComplaintRate > 0.05) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get status from score
   */
  private getStatusFromScore(
    score: number
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 50) return 'poor';
    return 'critical';
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    senderReputation: SenderReputation,
    contentOptimization: ContentOptimization,
    listHygiene: ListHygiene,
    engagementMetrics: EngagementMetrics,
    authStatus: any
  ): string[] {
    const recommendations: string[] = [];

    // Sender reputation recommendations
    if (senderReputation.score < 80) {
      recommendations.push(
        'Improve sender reputation by reducing bounce and complaint rates'
      );
    }

    // Content optimization recommendations
    if (contentOptimization.score < 80) {
      recommendations.push('Optimize email content to avoid spam filters');
    }

    // List hygiene recommendations
    if (listHygiene.score < 90) {
      recommendations.push('Clean your email list to remove invalid addresses');
    }

    // Engagement recommendations
    if (engagementMetrics.engagementScore < 70) {
      recommendations.push(
        'Improve email engagement through better content and timing'
      );
    }

    // Authentication recommendations
    if (authStatus.overallStatus !== 'pass') {
      recommendations.push(
        'Set up proper email authentication (SPF, DKIM, DMARC)'
      );
    }

    return recommendations;
  }

  /**
   * Get optimization actions
   */
  async getOptimizationActions(domain: string): Promise<OptimizationAction[]> {
    try {
      const report = await this.getDeliverabilityReport(domain);
      const actions: OptimizationAction[] = [];

      // Sender reputation actions
      if (report.senderReputation.score < 80) {
        actions.push({
          id: 'improve-sender-reputation',
          type: 'list',
          priority: 'high',
          title: 'Improve Sender Reputation',
          description:
            'Your sender reputation needs improvement to ensure better deliverability.',
          action:
            'Clean your email list, reduce bounce rates, and improve engagement.',
          expectedImpact: 'Increase deliverability by 15-25%',
          effort: 'medium',
          timeline: '2-4 weeks',
        });
      }

      // Content optimization actions
      if (report.contentOptimization.score < 80) {
        actions.push({
          id: 'optimize-content',
          type: 'content',
          priority: 'medium',
          title: 'Optimize Email Content',
          description: 'Your email content may be triggering spam filters.',
          action: 'Review and optimize email content to avoid spam triggers.',
          expectedImpact: 'Reduce spam score by 20-30%',
          effort: 'low',
          timeline: '1-2 weeks',
        });
      }

      // List hygiene actions
      if (report.listHygiene.score < 90) {
        actions.push({
          id: 'clean-email-list',
          type: 'list',
          priority: 'high',
          title: 'Clean Email List',
          description: 'Your email list contains invalid or risky addresses.',
          action: 'Remove invalid emails and implement list hygiene practices.',
          expectedImpact: 'Reduce bounce rate by 10-20%',
          effort: 'medium',
          timeline: '1-3 weeks',
        });
      }

      // Authentication actions
      if (report.overallScore < 80) {
        actions.push({
          id: 'setup-authentication',
          type: 'authentication',
          priority: 'critical',
          title: 'Set Up Email Authentication',
          description: 'Email authentication is not properly configured.',
          action: 'Configure SPF, DKIM, and DMARC records for your domain.',
          expectedImpact: 'Improve deliverability by 30-40%',
          effort: 'high',
          timeline: '1-2 weeks',
        });
      }

      return actions;
    } catch (error) {
      console.error('Error getting optimization actions:', error);
      throw error;
    }
  }

  /**
   * Store deliverability report
   */
  private async storeDeliverabilityReport(
    domain: string,
    report: DeliverabilityReport
  ): Promise<void> {
    try {
      await this.supabase.from('deliverability_reports').upsert({
        domain,
        report,
        last_updated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error storing deliverability report:', error);
    }
  }

  /**
   * Get deliverability trends
   */
  async getDeliverabilityTrends(
    domain: string,
    days: number = 30
  ): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('deliverability_reports')
        .select('*')
        .eq('domain', domain)
        .gte('last_updated', startDate.toISOString())
        .order('last_updated', { ascending: false });

      if (error) {
        throw new Error(
          `Failed to fetch deliverability trends: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deliverability trends:', error);
      throw error;
    }
  }

  /**
   * Get deliverability statistics
   */
  async getDeliverabilityStats(): Promise<{
    totalDomains: number;
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    critical: number;
    averageScore: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('deliverability_reports')
        .select('*');

      if (error) {
        throw new Error(
          `Failed to fetch deliverability stats: ${error.message}`
        );
      }

      const stats = {
        totalDomains: data.length,
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        critical: 0,
        averageScore: 0,
      };

      let totalScore = 0;

      data.forEach(record => {
        const report = record.report;
        totalScore += report.overallScore;

        switch (report.status) {
          case 'excellent':
            stats.excellent++;
            break;
          case 'good':
            stats.good++;
            break;
          case 'fair':
            stats.fair++;
            break;
          case 'poor':
            stats.poor++;
            break;
          case 'critical':
            stats.critical++;
            break;
        }
      });

      stats.averageScore =
        data.length > 0 ? Math.round(totalScore / data.length) : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching deliverability stats:', error);
      throw error;
    }
  }
}
