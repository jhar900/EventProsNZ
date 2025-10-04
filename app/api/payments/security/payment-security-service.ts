import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FraudDetectionService } from '@/lib/payments/security/fraud-detection-service';
import { AuditLogService } from '@/lib/payments/security/audit-log-service';

export class PaymentSecurityService {
  private fraudDetectionService: FraudDetectionService;
  private auditLogService: AuditLogService;

  constructor() {
    this.fraudDetectionService = new FraudDetectionService();
    this.auditLogService = new AuditLogService();
  }

  async validatePaymentSecurity(paymentData: any) {
    try {
      // Perform fraud detection analysis
      const riskAnalysis =
        await this.fraudDetectionService.analyzePaymentRisk(paymentData);

      // Log security validation
      await this.auditLogService.logSecurityEvent({
        event_type: 'payment_validation',
        user_id: paymentData.user_id,
        payment_id: paymentData.payment_id,
        risk_score: riskAnalysis.score,
        risk_level: riskAnalysis.riskLevel,
        factors: riskAnalysis.factors,
        ip_address: paymentData.ip_address,
        user_agent: paymentData.user_agent,
      });

      // Return validation result
      return {
        isSecure:
          riskAnalysis.riskLevel === 'low' ||
          riskAnalysis.riskLevel === 'medium',
        riskLevel: riskAnalysis.riskLevel,
        riskScore: riskAnalysis.score,
        factors: riskAnalysis.factors,
        requiresReview:
          riskAnalysis.riskLevel === 'high' ||
          riskAnalysis.riskLevel === 'critical',
      };
    } catch (error) {
      console.error('Payment security validation error:', error);
      throw new Error('Failed to validate payment security');
    }
  }

  async checkBlacklist(cardNumber: string) {
    try {
      return await this.fraudDetectionService.checkBlacklist(cardNumber);
    } catch (error) {
      console.error('Blacklist check error:', error);
      throw new Error('Failed to check blacklist');
    }
  }

  async logFraudEvent(fraudEvent: any) {
    try {
      return await this.fraudDetectionService.logFraudEvent(fraudEvent);
    } catch (error) {
      console.error('Fraud event logging error:', error);
      throw new Error('Failed to log fraud event');
    }
  }

  async getSecurityStatistics() {
    try {
      const fraudStats = await this.fraudDetectionService.getFraudStatistics();
      const auditStats = await this.auditLogService.getAuditStatistics();

      return {
        fraud: fraudStats,
        audit: auditStats,
        security_score: this.calculateSecurityScore(fraudStats, auditStats),
      };
    } catch (error) {
      console.error('Security statistics error:', error);
      throw new Error('Failed to get security statistics');
    }
  }

  private calculateSecurityScore(fraudStats: any, auditStats: any): number {
    // Calculate overall security score based on fraud and audit metrics
    const fraudRate = fraudStats.fraud_rate || 0;
    const blockedPayments = fraudStats.blocked_payments || 0;
    const totalEvents = fraudStats.total_fraud_events || 1;

    // Higher score is better (0-100)
    const fraudScore = Math.max(0, 100 - fraudRate * 1000);
    const detectionScore = Math.min(100, (blockedPayments / totalEvents) * 100);

    return Math.round((fraudScore + detectionScore) / 2);
  }
}

// API Route Handlers
export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();
    const securityService = new PaymentSecurityService();

    switch (action) {
      case 'validate':
        const validationResult =
          await securityService.validatePaymentSecurity(data);
        return NextResponse.json(validationResult);

      case 'check_blacklist':
        const isBlacklisted = await securityService.checkBlacklist(
          data.cardNumber
        );
        return NextResponse.json({ isBlacklisted });

      case 'log_fraud':
        const fraudLog = await securityService.logFraudEvent(data);
        return NextResponse.json(fraudLog);

      case 'get_statistics':
        const stats = await securityService.getSecurityStatistics();
        return NextResponse.json(stats);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment security API error:', error);
    return NextResponse.json(
      { error: 'Payment security operation failed' },
      { status: 500 }
    );
  }
}
