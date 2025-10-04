/**
 * Fraud Detection Service
 * Enhanced fraud detection beyond Stripe's built-in features
 */

import { createClient } from '@/lib/supabase/server';

export interface PaymentData {
  amount: number;
  currency: string;
  cardNumber: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  country?: string;
  timestamp: string;
}

export interface RiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
  recommendations: string[];
  action: 'allow' | 'review' | 'block';
}

export interface BehaviorPattern {
  user_id: string;
  average_amount: number;
  payment_frequency: number;
  usual_times: string[];
  usual_countries: string[];
  usual_ip_ranges: string[];
}

export class FraudDetectionService {
  private supabase: any;

  constructor(supabase?: any) {
    this.supabase = supabase || createClient();
  }

  /**
   * Analyze payment risk using multiple detection methods
   */
  async analyzePaymentRisk(paymentData: PaymentData): Promise<RiskAnalysis> {
    const factors: string[] = [];
    let score = 0;

    // Check blacklist
    const isBlacklisted = await this.checkBlacklist(paymentData.cardNumber);
    if (isBlacklisted) {
      factors.push('Card is blacklisted');
      score += 100;
    }

    // Check velocity patterns
    const velocityRisk = await this.checkVelocityPatterns(paymentData);
    if (velocityRisk.score > 0) {
      factors.push(...velocityRisk.factors);
      score += velocityRisk.score;
    }

    // Check geographic anomalies
    const geoRisk = await this.checkGeographicAnomalies(paymentData);
    if (geoRisk.score > 0) {
      factors.push(...geoRisk.factors);
      score += geoRisk.score;
    }

    // Check behavior patterns
    const behaviorRisk = await this.analyzeBehaviorPatterns(paymentData);
    if (behaviorRisk.score > 0) {
      factors.push(...behaviorRisk.factors);
      score += behaviorRisk.score;
    }

    // Check amount anomalies
    const amountRisk = await this.checkAmountAnomalies(paymentData);
    if (amountRisk.score > 0) {
      factors.push(...amountRisk.factors);
      score += amountRisk.score;
    }

    // Check time-based patterns
    const timeRisk = await this.checkTimePatterns(paymentData);
    if (timeRisk.score > 0) {
      factors.push(...timeRisk.factors);
      score += timeRisk.score;
    }

    // Check device fingerprinting
    const deviceRisk = await this.checkDeviceFingerprint(paymentData);
    if (deviceRisk.score > 0) {
      factors.push(...deviceRisk.factors);
      score += deviceRisk.score;
    }

    // Check for suspicious amounts
    if (paymentData.amount > 50000) {
      factors.push('Unusually high amount');
      score += 40;
    }

    // Check for suspicious IP addresses
    const suspiciousIPs = ['192.168.1.1', '10.0.0.1', '127.0.0.1'];
    if (suspiciousIPs.includes(paymentData.ip_address)) {
      factors.push('Suspicious IP address');
      score += 30;
    }

    // Check for suspicious user agents
    const suspiciousAgents = ['curl', 'wget', 'python', 'bot'];
    if (
      suspiciousAgents.some(agent =>
        paymentData.user_agent.toLowerCase().includes(agent)
      )
    ) {
      factors.push('Suspicious user agent');
      score += 25;
    }

    // Determine risk level and action
    let riskLevel: 'low' | 'medium' | 'high';
    let action: 'allow' | 'review' | 'block';

    if (score >= 70) {
      riskLevel = 'high';
      action = 'block';
    } else if (score >= 30) {
      riskLevel = 'medium';
      action = 'review';
    } else {
      riskLevel = 'low';
      action = 'allow';
    }

    const recommendations = this.generateRecommendations(riskLevel, factors);

    return {
      riskLevel,
      score,
      factors,
      recommendations,
      action,
    };
  }

  /**
   * Check if card is blacklisted
   */
  async checkBlacklist(cardNumber: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('blacklisted_cards')
        .select('card_number, reason')
        .eq('card_number', cardNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error checking blacklist:', error);
      }
      return false;
    }
  }

  /**
   * Check velocity patterns (multiple payments in short time)
   */
  async checkVelocityPatterns(
    paymentData: PaymentData
  ): Promise<{ score: number; factors: string[] }> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('created_at, amount')
        .eq('user_id', paymentData.user_id)
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ) // Last 24 hours
        .order('created_at', { ascending: false });

      if (error) throw error;

      const factors: string[] = [];
      let score = 0;

      if (data && data.length > 0) {
        // Check for high frequency
        if (data.length >= 10) {
          factors.push('High payment frequency detected');
          score += 30;
        } else if (data.length >= 5) {
          factors.push('Elevated payment frequency detected');
          score += 15;
        }

        // Check for rapid succession
        const recentPayments = data.filter(
          (payment: any) =>
            new Date(payment.created_at).getTime() > Date.now() - 60 * 60 * 1000 // Last hour
        );

        if (recentPayments.length >= 5) {
          factors.push('Rapid payment succession detected');
          score += 25;
        }

        // Check for similar amounts
        const similarAmounts = data.filter(
          (payment: any) => Math.abs(payment.amount - paymentData.amount) < 1
        );

        if (similarAmounts.length >= 3) {
          factors.push('Multiple payments with similar amounts');
          score += 20;
        }
      }

      return { score, factors };
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error checking velocity patterns:', error);
      }
      return { score: 0, factors: [] };
    }
  }

  /**
   * Check geographic anomalies
   */
  async checkGeographicAnomalies(
    paymentData: PaymentData
  ): Promise<{ score: number; factors: string[] }> {
    try {
      const { data, error } = await this.supabase
        .from('user_locations')
        .select('country, ip_address, created_at')
        .eq('user_id', paymentData.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const factors: string[] = [];
      let score = 0;

      if (data && data.length > 0) {
        const recentLocation = data[0];
        const currentCountry = paymentData.country || 'Unknown';

        // Check for country change
        if (recentLocation.country !== currentCountry) {
          factors.push('Geographic anomaly detected');
          score += 25;
        }

        // Check for IP range change
        const currentIPRange = this.getIPRange(paymentData.ip_address);
        const recentIPRange = this.getIPRange(recentLocation.ip_address);

        if (currentIPRange !== recentIPRange) {
          factors.push('IP range anomaly detected');
          score += 15;
        }

        // Check for impossible travel
        const timeDiff =
          Date.now() - new Date(recentLocation.created_at).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 2 && recentLocation.country !== currentCountry) {
          factors.push('Impossible travel detected');
          score += 40;
        }
      }

      return { score, factors };
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error checking geographic anomalies:', error);
      }
      return { score: 0, factors: [] };
    }
  }

  /**
   * Analyze behavior patterns
   */
  async analyzeBehaviorPatterns(paymentData: PaymentData): Promise<{
    score: number;
    factors: string[];
    anomalies: string[];
    riskScore: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('amount, created_at, ip_address, user_agent, payment_method')
        .eq('user_id', paymentData.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const factors: string[] = [];
      const anomalies: string[] = [];
      let score = 0;

      if (data && data.length > 0) {
        // Check spending patterns
        const amounts = data.map((payment: any) => payment.amount);
        const averageAmount =
          amounts.reduce((sum: number, amount: number) => sum + amount, 0) /
          amounts.length;

        if (paymentData.amount > averageAmount * 3) {
          const anomaly = 'Unusual spending amount detected';
          factors.push(anomaly);
          anomalies.push(anomaly);
          score += 20;
        }

        // Check payment times
        const paymentHour = new Date(paymentData.timestamp).getHours();
        const usualHours = data.map((payment: any) =>
          new Date(payment.created_at).getHours()
        );
        const isUnusualTime = !usualHours.includes(paymentHour);

        if (isUnusualTime) {
          const anomaly = 'Unusual payment time detected';
          factors.push(anomaly);
          anomalies.push(anomaly);
          score += 10;
        }

        // Check user agent consistency
        const userAgents = data.map((payment: any) => payment.user_agent);
        const isNewUserAgent = !userAgents.includes(paymentData.user_agent);

        if (isNewUserAgent) {
          const anomaly = 'New user agent detected';
          factors.push(anomaly);
          anomalies.push(anomaly);
          score += 15;
        }

        // Check payment frequency
        const recentPayments = data.filter((payment: any) => {
          const paymentTime = new Date(payment.created_at).getTime();
          const currentTime = new Date(paymentData.timestamp).getTime();
          return currentTime - paymentTime < 24 * 60 * 60 * 1000; // Last 24 hours
        });

        if (recentPayments.length > 5) {
          const anomaly = 'Unusual payment frequency detected';
          factors.push(anomaly);
          anomalies.push(anomaly);
          score += 15;
        }

        // Check payment method consistency
        const paymentMethods = data.map(
          (payment: any) => payment.payment_method
        );
        const isNewPaymentMethod = !paymentMethods.includes(
          paymentData.payment_method
        );

        if (isNewPaymentMethod) {
          const anomaly = 'Unusual payment method detected';
          factors.push(anomaly);
          anomalies.push(anomaly);
          score += 10;
        }
      }

      return { score, factors, anomalies, riskScore: score };
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error analyzing behavior patterns:', error);
      }
      return { score: 0, factors: [], anomalies: [], riskScore: 0 };
    }
  }

  /**
   * Check amount anomalies
   */
  async checkAmountAnomalies(
    paymentData: PaymentData
  ): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    // Check for suspiciously high amounts
    if (paymentData.amount > 10000) {
      factors.push('High amount transaction');
      score += 30;
    }

    // Check for round numbers (potential test transactions)
    if (paymentData.amount % 100 === 0 && paymentData.amount > 1000) {
      factors.push('Round number transaction');
      score += 10;
    }

    // Check for micro transactions (potential testing)
    if (paymentData.amount < 1) {
      factors.push('Micro transaction detected');
      score += 5;
    }

    return { score, factors };
  }

  /**
   * Check time-based patterns
   */
  async checkTimePatterns(
    paymentData: PaymentData
  ): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    const paymentHour = new Date(paymentData.timestamp).getHours();

    // Check for unusual hours (3 AM - 6 AM)
    if (paymentHour >= 3 && paymentHour <= 6) {
      factors.push('Unusual payment time (early morning)');
      score += 15;
    }

    // Check for weekend payments (potential fraud)
    const dayOfWeek = new Date(paymentData.timestamp).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      factors.push('Weekend payment detected');
      score += 5;
    }

    return { score, factors };
  }

  /**
   * Check device fingerprinting
   */
  async checkDeviceFingerprint(
    paymentData: PaymentData
  ): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    // Check for suspicious user agents
    const suspiciousAgents = ['curl', 'wget', 'python', 'bot', 'crawler'];
    const isSuspiciousAgent = suspiciousAgents.some(agent =>
      paymentData.user_agent.toLowerCase().includes(agent)
    );

    if (isSuspiciousAgent) {
      factors.push('Suspicious user agent detected');
      score += 25;
    }

    // Check for missing user agent
    if (!paymentData.user_agent || paymentData.user_agent.length < 10) {
      factors.push('Missing or invalid user agent');
      score += 15;
    }

    return { score, factors };
  }

  /**
   * Generate recommendations based on risk analysis
   */
  private generateRecommendations(
    riskLevel: string,
    factors: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('Block payment immediately');
      recommendations.push('Require manual review');
      recommendations.push('Contact user for verification');
    } else if (riskLevel === 'medium') {
      recommendations.push('Require additional verification');
      recommendations.push('Monitor for similar patterns');
      recommendations.push('Consider 3D Secure authentication');
    } else {
      recommendations.push('Allow payment to proceed');
      recommendations.push('Continue monitoring');
    }

    return recommendations;
  }

  /**
   * Get IP range for comparison
   */
  private getIPRange(ip: string): string {
    const parts = ip.split('.');
    return parts.slice(0, 2).join('.');
  }

  /**
   * Log fraud detection event
   */
  async logFraudDetection(
    paymentData: PaymentData,
    riskAnalysis: RiskAnalysis
  ): Promise<void> {
    try {
      await this.supabase.from('fraud_detection_logs').insert({
        user_id: paymentData.user_id,
        payment_id: paymentData.cardNumber,
        risk_level: riskAnalysis.riskLevel,
        risk_score: riskAnalysis.score,
        factors: riskAnalysis.factors,
        action: riskAnalysis.action,
        ip_address: paymentData.ip_address,
        user_agent: paymentData.user_agent,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error logging fraud detection:', error);
      }
    }
  }

  /**
   * Update user behavior patterns
   */
  async updateBehaviorPatterns(
    userId: string,
    paymentData: PaymentData
  ): Promise<void> {
    try {
      await this.supabase.from('user_behavior_patterns').upsert({
        user_id: userId,
        last_payment_amount: paymentData.amount,
        last_payment_time: paymentData.timestamp,
        last_ip_address: paymentData.ip_address,
        last_user_agent: paymentData.user_agent,
        last_country: paymentData.country,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      // Only log errors in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error updating behavior patterns:', error);
      }
    }
  }

  /**
   * Calculate risk score based on factors
   */
  calculateRiskScore(factors: string[]): number {
    let score = 0;

    // High risk factors
    const highRiskFactors = [
      'Card is blacklisted',
      'Impossible travel detected',
      'Suspicious user agent detected',
      'Suspicious IP address detected',
    ];

    // Medium risk factors
    const mediumRiskFactors = [
      'Geographic anomaly detected',
      'Unusual payment time detected',
      'High payment frequency detected',
      'Unusual spending amount detected',
    ];

    // Low risk factors
    const lowRiskFactors = [
      'New user agent detected',
      'Weekend payment detected',
      'Round number transaction',
      'Micro transaction detected',
    ];

    factors.forEach(factor => {
      if (highRiskFactors.some(hrf => factor.includes(hrf))) {
        score += 30;
      } else if (mediumRiskFactors.some(mrf => factor.includes(mrf))) {
        score += 15;
      } else if (lowRiskFactors.some(lrf => factor.includes(lrf))) {
        score += 5;
      }
    });

    return Math.min(score, 100);
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Log fraud event
   */
  async logFraudEvent(fraudEvent: any): Promise<void> {
    try {
      await this.supabase.from('fraud_events').insert({
        user_id: fraudEvent.user_id,
        payment_id: fraudEvent.payment_id,
        risk_level: fraudEvent.risk_level,
        risk_score: fraudEvent.risk_score,
        factors: fraudEvent.factors,
        action: fraudEvent.action,
        ip_address: fraudEvent.ip_address,
        user_agent: fraudEvent.user_agent,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error('Failed to log fraud event');
    }
  }

  /**
   * Get fraud statistics
   */
  async getFraudStatistics(): Promise<any> {
    try {
      const { data: stats, error } = await this.supabase
        .from('fraud_events')
        .select('risk_level, risk_score, created_at');

      if (error) {
        throw new Error(
          `Failed to retrieve fraud statistics: ${error.message}`
        );
      }

      const totalEvents = stats?.length || 0;
      const highRiskEvents =
        stats?.filter(s => s.risk_level === 'high').length || 0;
      const averageRiskScore =
        stats?.length > 0
          ? stats.reduce((sum, s) => sum + s.risk_score, 0) / stats.length
          : 0;

      return {
        total_events: totalEvents,
        high_risk_events: highRiskEvents,
        average_risk_score: averageRiskScore,
        risk_distribution: {
          low: stats?.filter(s => s.risk_level === 'low').length || 0,
          medium: stats?.filter(s => s.risk_level === 'medium').length || 0,
          high: highRiskEvents,
          critical: stats?.filter(s => s.risk_level === 'critical').length || 0,
        },
      };
    } catch (error) {
      throw new Error('Failed to retrieve fraud statistics');
    }
  }

  /**
   * Update blacklist
   */
  async updateBlacklist(
    cardData: any,
    action: 'add' | 'remove' = 'add'
  ): Promise<void> {
    try {
      if (action === 'add') {
        await this.supabase.from('blacklisted_cards').insert({
          card_number: cardData.card_number,
          reason: cardData.reason || 'Fraudulent activity detected',
          added_at: new Date().toISOString(),
        });
      } else {
        await this.supabase
          .from('blacklisted_cards')
          .delete()
          .eq('card_number', cardData.card_number);
      }
    } catch (error) {
      throw new Error('Failed to update blacklist');
    }
  }
}
