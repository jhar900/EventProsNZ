import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentPerformanceService } from '@/lib/payments/performance/payment-performance-service';
import { LoadTester } from '@/lib/payments/performance/load-tester';

export class PaymentPerformanceAPI {
  private performanceService: PaymentPerformanceService;
  private loadTester: LoadTester;

  constructor() {
    this.performanceService = new PaymentPerformanceService();
    this.loadTester = new LoadTester();
  }

  async getPerformanceMetrics(timeRange: string = '24h') {
    try {
      const metrics =
        await this.performanceService.getPerformanceMetrics(timeRange);
      return NextResponse.json(metrics);
    } catch (error) {
      console.error('Performance metrics error:', error);
      return NextResponse.json(
        { error: 'Failed to get performance metrics' },
        { status: 500 }
      );
    }
  }

  async getPaymentLatency(paymentId: string) {
    try {
      const latency =
        await this.performanceService.getPaymentLatency(paymentId);
      return NextResponse.json(latency);
    } catch (error) {
      console.error('Payment latency error:', error);
      return NextResponse.json(
        { error: 'Failed to get payment latency' },
        { status: 500 }
      );
    }
  }

  async getThroughputMetrics(timeRange: string = '1h') {
    try {
      const throughput =
        await this.performanceService.getThroughputMetrics(timeRange);
      return NextResponse.json(throughput);
    } catch (error) {
      console.error('Throughput metrics error:', error);
      return NextResponse.json(
        { error: 'Failed to get throughput metrics' },
        { status: 500 }
      );
    }
  }

  async runLoadTest(testConfig: any) {
    try {
      const results = await this.loadTester.runLoadTest(testConfig);
      return NextResponse.json(results);
    } catch (error) {
      console.error('Load test error:', error);
      return NextResponse.json(
        { error: 'Failed to run load test' },
        { status: 500 }
      );
    }
  }

  async getSystemHealth() {
    try {
      const health = await this.performanceService.getSystemHealth();
      return NextResponse.json(health);
    } catch (error) {
      console.error('System health error:', error);
      return NextResponse.json(
        { error: 'Failed to get system health' },
        { status: 500 }
      );
    }
  }

  async optimizePerformance() {
    try {
      const optimization = await this.performanceService.optimizePerformance();
      return NextResponse.json(optimization);
    } catch (error) {
      console.error('Performance optimization error:', error);
      return NextResponse.json(
        { error: 'Failed to optimize performance' },
        { status: 500 }
      );
    }
  }
}

// API Route Handlers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeRange = searchParams.get('timeRange') || '24h';
    const paymentId = searchParams.get('paymentId');

    const performanceAPI = new PaymentPerformanceAPI();

    switch (action) {
      case 'metrics':
        return await performanceAPI.getPerformanceMetrics(timeRange);

      case 'latency':
        if (!paymentId) {
          return NextResponse.json(
            { error: 'Payment ID is required for latency check' },
            { status: 400 }
          );
        }
        return await performanceAPI.getPaymentLatency(paymentId);

      case 'throughput':
        return await performanceAPI.getThroughputMetrics(timeRange);

      case 'health':
        return await performanceAPI.getSystemHealth();

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment performance API error:', error);
    return NextResponse.json(
      { error: 'Payment performance operation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();
    const performanceAPI = new PaymentPerformanceAPI();

    switch (action) {
      case 'load_test':
        return await performanceAPI.runLoadTest(data);

      case 'optimize':
        return await performanceAPI.optimizePerformance();

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment performance API error:', error);
    return NextResponse.json(
      { error: 'Payment performance operation failed' },
      { status: 500 }
    );
  }
}
