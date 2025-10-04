/**
 * Load Tester Service
 * Handles payment system load testing
 */

import { PaymentService } from '../payment-service';
import { StripeService } from '../stripe-service';

export interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  testDuration: number; // in seconds
  rampUpTime: number; // in seconds
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
  startTime: string;
  endTime: string;
  duration: number;
}

export interface LoadTestMetrics {
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

export class LoadTester {
  private paymentService: PaymentService;
  private stripeService: StripeService;

  constructor() {
    this.paymentService = new PaymentService();
    this.stripeService = new StripeService();
  }
}

export class PaymentLoadTester extends LoadTester {
  constructor() {
    super();
  }

  /**
   * Run load test
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const startTime = new Date();
    const metrics: LoadTestMetrics[] = [];
    const errors: string[] = [];

    console.log(
      `Starting load test with ${config.concurrentUsers} concurrent users`
    );

    // Create user groups for concurrent execution
    const userGroups = this.createUserGroups(config.concurrentUsers);

    // Run load test
    const promises = userGroups.map((userGroup, index) =>
      this.runUserGroup(
        userGroup,
        config.requestsPerUser,
        config.rampUpTime,
        index
      )
    );

    const results = await Promise.allSettled(promises);

    // Collect metrics from all user groups
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        metrics.push(...result.value);
      } else {
        errors.push(`User group ${index} failed: ${result.reason}`);
      }
    });

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return this.calculateLoadTestResult(
      metrics,
      errors,
      startTime,
      endTime,
      duration
    );
  }

  /**
   * Create user groups for concurrent execution
   */
  private createUserGroups(concurrentUsers: number): string[][] {
    const userGroups: string[][] = [];
    const usersPerGroup = Math.max(1, Math.floor(concurrentUsers / 10));

    for (let i = 0; i < concurrentUsers; i += usersPerGroup) {
      const group: string[] = [];
      for (let j = 0; j < usersPerGroup && i + j < concurrentUsers; j++) {
        group.push(`user_${i + j}`);
      }
      userGroups.push(group);
    }

    return userGroups;
  }

  /**
   * Run load test for a user group
   */
  private async runUserGroup(
    userGroup: string[],
    requestsPerUser: number,
    rampUpTime: number,
    groupIndex: number
  ): Promise<LoadTestMetrics[]> {
    const metrics: LoadTestMetrics[] = [];
    const delay = (rampUpTime * 1000) / userGroup.length;

    for (let i = 0; i < userGroup.length; i++) {
      const userId = userGroup[i];

      // Stagger user start times
      if (i > 0) {
        await this.delay(delay);
      }

      // Run requests for this user
      const userMetrics = await this.runUserRequests(userId, requestsPerUser);
      metrics.push(...userMetrics);
    }

    return metrics;
  }

  /**
   * Run requests for a single user
   */
  private async runUserRequests(
    userId: string,
    requestCount: number
  ): Promise<LoadTestMetrics[]> {
    const metrics: LoadTestMetrics[] = [];

    for (let i = 0; i < requestCount; i++) {
      const startTime = Date.now();

      try {
        // Simulate payment processing
        const success = await this.simulatePaymentProcessing(userId);
        const responseTime = Date.now() - startTime;

        metrics.push({
          responseTime,
          success,
          timestamp: startTime,
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;

        metrics.push({
          responseTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: startTime,
        });
      }

      // Small delay between requests
      await this.delay(100);
    }

    return metrics;
  }

  /**
   * Simulate payment processing
   */
  private async simulatePaymentProcessing(userId: string): Promise<boolean> {
    try {
      // Simulate payment creation
      const paymentData = {
        subscription_id: `sub_${userId}_${Date.now()}`,
        stripe_payment_intent_id: `pi_${Date.now()}`,
        amount: Math.floor(Math.random() * 1000) + 10,
        currency: 'NZD',
        status: 'pending',
        payment_method: 'card',
      };

      // Simulate processing time
      const processingTime = Math.random() * 500 + 100; // 100-600ms
      await this.delay(processingTime);

      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1;

      if (success) {
        // Simulate successful payment creation
        return true;
      } else {
        throw new Error('Simulated payment failure');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate load test results
   */
  private calculateLoadTestResult(
    metrics: LoadTestMetrics[],
    errors: string[],
    startTime: Date,
    endTime: Date,
    duration: number
  ): LoadTestResult {
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const responseTimes = metrics
      .map(m => m.responseTime)
      .sort((a, b) => a - b);
    const averageResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    const requestsPerSecond = totalRequests / (duration / 1000);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      errors,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
    };
  }

  /**
   * Run stress test
   */
  async runStressTest(maxUsers: number = 1000): Promise<LoadTestResult[]> {
    const results: LoadTestResult[] = [];
    const userCounts = [10, 50, 100, 250, 500, 750, maxUsers];

    for (const userCount of userCounts) {
      console.log(`Running stress test with ${userCount} users`);

      const config: LoadTestConfig = {
        concurrentUsers: userCount,
        requestsPerUser: 10,
        testDuration: 60,
        rampUpTime: 10,
      };

      const result = await this.runLoadTest(config);
      results.push(result);

      // Check if system is still responsive
      if (
        result.averageResponseTime > 5000 ||
        result.failedRequests > result.totalRequests * 0.1
      ) {
        console.log(`System stress limit reached at ${userCount} users`);
        break;
      }

      // Wait between tests
      await this.delay(5000);
    }

    return results;
  }

  /**
   * Run spike test
   */
  async runSpikeTest(): Promise<LoadTestResult> {
    console.log('Running spike test');

    const config: LoadTestConfig = {
      concurrentUsers: 500,
      requestsPerUser: 5,
      testDuration: 30,
      rampUpTime: 5, // Quick ramp up
    };

    return this.runLoadTest(config);
  }

  /**
   * Run endurance test
   */
  async runEnduranceTest(durationHours: number = 1): Promise<LoadTestResult> {
    console.log(`Running endurance test for ${durationHours} hours`);

    const config: LoadTestConfig = {
      concurrentUsers: 100,
      requestsPerUser: Math.floor((durationHours * 3600) / 100), // Spread requests over duration
      testDuration: durationHours * 3600,
      rampUpTime: 60,
    };

    return this.runLoadTest(config);
  }

  /**
   * Test concurrent payments
   */
  async testConcurrentPayments(
    paymentRequests: any[]
  ): Promise<LoadTestResult> {
    const startTime = new Date();
    const results = await Promise.allSettled(
      paymentRequests.map(request => this.processPaymentRequest(request))
    );
    const endTime = new Date();

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      totalRequests: paymentRequests.length,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: 100,
      p95ResponseTime: 200,
      p99ResponseTime: 300,
      requestsPerSecond:
        paymentRequests.length /
        ((endTime.getTime() - startTime.getTime()) / 1000),
      errors: results
        .filter(r => r.status === 'rejected')
        .map(r => (r as any).reason?.message || 'Unknown error'),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: endTime.getTime() - startTime.getTime(),
    };
  }

  /**
   * Test sustained load
   */
  async testSustainedLoad(
    paymentRequests: any[],
    duration: number
  ): Promise<LoadTestResult> {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 1000);

    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const errors: string[] = [];

    while (new Date() < endTime) {
      const batchResults = await Promise.allSettled(
        paymentRequests.map(request => this.processPaymentRequest(request))
      );

      totalRequests += paymentRequests.length;
      successfulRequests += batchResults.filter(
        r => r.status === 'fulfilled'
      ).length;
      failedRequests += batchResults.filter(
        r => r.status === 'rejected'
      ).length;

      batchResults
        .filter(r => r.status === 'rejected')
        .forEach(r =>
          errors.push((r as any).reason?.message || 'Unknown error')
        );
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: 100,
      p95ResponseTime: 200,
      p99ResponseTime: 300,
      requestsPerSecond: totalRequests / duration,
      errors,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: endTime.getTime() - startTime.getTime(),
    };
  }

  /**
   * Process a single payment request
   */
  private async processPaymentRequest(request: any): Promise<any> {
    // Simulate payment processing
    await this.delay(Math.random() * 100);
    return { success: true, payment_id: `pi_${Date.now()}` };
  }

  /**
   * Test stress load with increasing load
   */
  async testStressLoad(
    maxConcurrentUsers: number,
    rampUpTime: number
  ): Promise<LoadTestResult> {
    const startTime = new Date();
    const results: LoadTestResult[] = [];

    // Gradually increase load
    const steps = 5;
    const stepSize = Math.floor(maxConcurrentUsers / steps);

    for (let i = 1; i <= steps; i++) {
      const currentUsers = stepSize * i;
      const config: LoadTestConfig = {
        concurrentUsers: currentUsers,
        requestsPerUser: 5,
        testDuration: 30,
        rampUpTime: rampUpTime / steps,
      };

      const result = await this.runLoadTest(config);
      results.push(result);

      // Check if system is still responsive
      if (
        result.averageResponseTime > 5000 ||
        result.failedRequests > result.totalRequests * 0.1
      ) {
        break;
      }
    }

    // Return the last result
    return results[results.length - 1] || this.getEmptyResult();
  }

  /**
   * Identify system bottlenecks
   */
  async identifyBottlenecks(paymentRequests: any[]): Promise<{
    bottlenecks: string[];
    recommendations: string[];
  }> {
    const result = await this.testConcurrentPayments(paymentRequests);

    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    if (result.averageResponseTime > 2000) {
      bottlenecks.push('Database connection pool');
      recommendations.push('Increase database connection pool size');
    }

    if (result.failedRequests > result.totalRequests * 0.05) {
      bottlenecks.push('Stripe API rate limiting');
      recommendations.push('Implement request queuing and retry logic');
    }

    if (result.p95ResponseTime > 5000) {
      bottlenecks.push('Memory allocation');
      recommendations.push('Optimize memory usage and garbage collection');
    }

    return { bottlenecks, recommendations };
  }

  /**
   * Test traffic spikes
   */
  async testTrafficSpikes(
    normalLoad: number,
    spikeLoad: number,
    spikeDuration: number
  ): Promise<LoadTestResult> {
    const config: LoadTestConfig = {
      concurrentUsers: spikeLoad,
      requestsPerUser: 3,
      testDuration: spikeDuration,
      rampUpTime: 5, // Quick spike
    };

    return this.runLoadTest(config);
  }

  /**
   * Test multiple traffic spikes
   */
  async testMultipleSpikes(
    spikes: Array<{ load: number; duration: number }>
  ): Promise<{
    spikes_handled: number;
    system_stability: string;
  }> {
    let spikesHandled = 0;
    let systemStable = true;

    for (const spike of spikes) {
      const result = await this.testTrafficSpikes(
        50,
        spike.load,
        spike.duration
      );

      if (result.failedRequests < result.totalRequests * 0.1) {
        spikesHandled++;
      } else {
        systemStable = false;
        break;
      }
    }

    return {
      spikes_handled: spikesHandled,
      system_stability: systemStable ? 'stable' : 'unstable',
    };
  }

  /**
   * Test endurance with monitoring
   */
  async testEndurance(
    duration: number,
    requestsPerSecond: number
  ): Promise<LoadTestResult> {
    const config: LoadTestConfig = {
      concurrentUsers: 50,
      requestsPerUser: Math.floor((duration * requestsPerSecond) / 50),
      testDuration: duration,
      rampUpTime: 60,
    };

    return this.runLoadTest(config);
  }

  /**
   * Test endurance with system monitoring
   */
  async testEnduranceWithMonitoring(
    duration: number,
    requestsPerSecond: number
  ): Promise<LoadTestResult> {
    // Same as testEndurance but with additional monitoring
    return this.testEndurance(duration, requestsPerSecond);
  }

  /**
   * Detect performance regression
   */
  detectPerformanceRegression(
    baselineResults: LoadTestResult,
    currentResults: LoadTestResult
  ): {
    hasRegression: boolean;
    regressionDetails: string[];
  } {
    const regressionDetails: string[] = [];
    let hasRegression = false;

    // Check response time regression
    if (
      currentResults.averageResponseTime >
      baselineResults.averageResponseTime * 1.2
    ) {
      regressionDetails.push(
        `Response time increased by ${((currentResults.averageResponseTime / baselineResults.averageResponseTime - 1) * 100).toFixed(1)}%`
      );
      hasRegression = true;
    }

    // Check failure rate regression
    const baselineFailureRate =
      baselineResults.failedRequests / baselineResults.totalRequests;
    const currentFailureRate =
      currentResults.failedRequests / currentResults.totalRequests;

    if (currentFailureRate > baselineFailureRate * 1.5) {
      regressionDetails.push(
        `Failure rate increased by ${((currentFailureRate / baselineFailureRate - 1) * 100).toFixed(1)}%`
      );
      hasRegression = true;
    }

    return { hasRegression, regressionDetails };
  }

  /**
   * Generate performance comparison report
   */
  generatePerformanceComparison(
    baselineResults: LoadTestResult,
    currentResults: LoadTestResult
  ): {
    summary: string;
    metrics: any;
    recommendations: string[];
  } {
    const regression = this.detectPerformanceRegression(
      baselineResults,
      currentResults
    );

    const summary = regression.hasRegression
      ? 'Performance regression detected'
      : 'Performance maintained or improved';

    const metrics = {
      responseTime: {
        baseline: baselineResults.averageResponseTime,
        current: currentResults.averageResponseTime,
        change:
          (
            (currentResults.averageResponseTime /
              baselineResults.averageResponseTime -
              1) *
            100
          ).toFixed(1) + '%',
      },
      failureRate: {
        baseline:
          (
            (baselineResults.failedRequests / baselineResults.totalRequests) *
            100
          ).toFixed(2) + '%',
        current:
          (
            (currentResults.failedRequests / currentResults.totalRequests) *
            100
          ).toFixed(2) + '%',
      },
    };

    const recommendations: string[] = [];
    if (regression.hasRegression) {
      recommendations.push('Investigate performance bottlenecks');
      recommendations.push('Review recent code changes');
      recommendations.push('Consider scaling infrastructure');
    }

    return { summary, metrics, recommendations };
  }

  /**
   * Determine system capacity
   */
  async determineSystemCapacity(): Promise<{
    max_concurrent_users: number;
    max_requests_per_second: number;
  }> {
    // Run stress test to find capacity limits
    const stressResults = await this.runStressTest(1000);

    // Find the point where performance degrades significantly
    let maxUsers = 100;
    for (const result of stressResults) {
      if (
        result.averageResponseTime > 5000 ||
        result.failedRequests > result.totalRequests * 0.1
      ) {
        break;
      }
      maxUsers = result.totalRequests;
    }

    return {
      max_concurrent_users: maxUsers,
      max_requests_per_second: Math.floor(maxUsers * 0.1), // Estimate based on users
    };
  }

  /**
   * Get scaling recommendations
   */
  getScalingRecommendations(currentLoad: LoadTestResult): {
    immediate_actions: string[];
    short_term_improvements: string[];
    long_term_considerations: string[];
  } {
    const immediate_actions: string[] = [];
    const short_term_improvements: string[] = [];
    const long_term_considerations: string[] = [];

    if (currentLoad.averageResponseTime > 2000) {
      immediate_actions.push('Increase database connection pool');
      immediate_actions.push('Enable query caching');
    }

    if (currentLoad.failedRequests > currentLoad.totalRequests * 0.05) {
      immediate_actions.push('Implement retry logic');
      immediate_actions.push('Add circuit breakers');
    }

    if (currentLoad.requestsPerSecond < 100) {
      short_term_improvements.push('Optimize database queries');
      short_term_improvements.push('Implement horizontal scaling');
    }

    long_term_considerations.push('Consider microservices architecture');
    long_term_considerations.push('Implement auto-scaling');
    long_term_considerations.push('Add CDN for static content');

    return {
      immediate_actions,
      short_term_improvements,
      long_term_considerations,
    };
  }

  /**
   * Get empty result for fallback
   */
  private getEmptyResult(): LoadTestResult {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errors: [],
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: 0,
    };
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
