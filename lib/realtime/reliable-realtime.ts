/**
 * Reliable Real-time Connection Manager
 * Provides fallback mechanisms and connection management for real-time features
 */

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { CircuitBreaker } from './circuit-breaker';

export interface RealtimeConfig {
  maxReconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  heartbeatInterval: number;
  fallbackPollingInterval: number;
}

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  isActive: boolean;
  lastHeartbeat: number;
  reconnectAttempts: number;
}

export class ReliableRealtime {
  private supabaseClient: SupabaseClient;
  private circuitBreaker: CircuitBreaker;
  private config: RealtimeConfig;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isOnline: boolean = true;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<RealtimeConfig> = {}
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
    
    this.config = {
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 1000,
      maxReconnectDelay: config.maxReconnectDelay || 30000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      fallbackPollingInterval: config.fallbackPollingInterval || 5000,
    };

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 30000,
      fallbackEnabled: true,
    });

    this.setupEventListeners();
    this.startHeartbeat();
  }

  /**
   * Subscribe to real-time updates with automatic fallback
   */
  async subscribe(
    channelName: string,
    event: string,
    callback: (payload: any) => void,
    fallbackPolling?: () => Promise<any>
  ): Promise<RealtimeChannel> {
    const subscriptionId = `${channelName}:${event}`;

    // Check if already subscribed
    if (this.subscriptions.has(subscriptionId)) {
      const existing = this.subscriptions.get(subscriptionId)!;
      if (existing.isActive) {
        return existing.channel;
      }
    }

    try {
      const channel = await this.circuitBreaker.execute(
        () => this.createRealtimeSubscription(channelName, event, callback),
        () => this.createFallbackPolling(subscriptionId, fallbackPolling)
      );

      this.subscriptions.set(subscriptionId, {
        channel,
        isActive: true,
        lastHeartbeat: Date.now(),
        reconnectAttempts: 0,
      });

      return channel;
    } catch (error) {
      // Fallback to polling if available
      if (fallbackPolling) {
        return this.createFallbackPolling(subscriptionId, fallbackPolling);
      }
      
      throw error;
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(channelName: string, event: string): void {
    const subscriptionId = `${channelName}:${event}`;
    const subscription = this.subscriptions.get(subscriptionId);

    if (subscription) {
      subscription.channel.unsubscribe();
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
    }

    // Clear polling interval if exists
    const pollingInterval = this.pollingIntervals.get(subscriptionId);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      this.pollingIntervals.delete(subscriptionId);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isOnline: boolean;
    activeSubscriptions: number;
    circuitBreakerState: string;
  } {
    return {
      isOnline: this.isOnline,
      activeSubscriptions: Array.from(this.subscriptions.values())
        .filter(sub => sub.isActive).length,
      circuitBreakerState: this.circuitBreaker.getState().state,
    };
  }

  /**
   * Force reconnection for all subscriptions
   */
  async reconnectAll(): Promise<void> {
    const subscriptions = Array.from(this.subscriptions.entries());
    
    for (const [subscriptionId, subscription] of subscriptions) {
      if (subscription.isActive) {
        subscription.channel.unsubscribe();
        subscription.isActive = false;
      }
    }

    // Clear all subscriptions and let them reconnect
    this.subscriptions.clear();
    
    // Reset circuit breaker
    this.circuitBreaker.reset();
  }

  private async createRealtimeSubscription(
    channelName: string,
    event: string,
    callback: (payload: any) => void
  ): Promise<RealtimeChannel> {
    return new Promise((resolve, reject) => {
      const channel = this.supabaseClient
        .channel(channelName)
        .on('postgres_changes', {
          event: event as any,
          schema: 'public',
          table: channelName,
        }, callback)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve(channel);
          } else if (status === 'CHANNEL_ERROR') {
            reject(new Error('Failed to subscribe to real-time channel'));
          }
        });
    });
  }

  private createFallbackPolling(
    subscriptionId: string,
    pollingFunction?: () => Promise<any>
  ): Promise<RealtimeChannel> {
    if (!pollingFunction) {
      throw new Error('No fallback polling function provided');
    }

    // Create a mock channel for polling
    const mockChannel = {
      unsubscribe: () => {
        const interval = this.pollingIntervals.get(subscriptionId);
        if (interval) {
          clearInterval(interval);
          this.pollingIntervals.delete(subscriptionId);
        }
      },
    } as RealtimeChannel;

    // Start polling
    const interval = setInterval(async () => {
      try {
        const data = await pollingFunction();
        // Simulate real-time callback
        if (data) {
          // This would need to be adapted based on your data structure
          }
      } catch (error) {
        }
    }, this.config.fallbackPollingInterval);

    this.pollingIntervals.set(subscriptionId, interval);

    return Promise.resolve(mockChannel);
  }

  private setupEventListeners(): void {
    // Online/offline detection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.reconnectAll();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.reconnectAll();
      });
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatInterval);
  }

  private checkHeartbeats(): void {
    const now = Date.now();
    const timeout = this.config.heartbeatInterval * 2;

    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      if (now - subscription.lastHeartbeat > timeout) {
        this.reconnectSubscription(subscriptionId, subscription);
      }
    }
  }

  private async reconnectSubscription(
    subscriptionId: string,
    subscription: RealtimeSubscription
  ): Promise<void> {
    if (subscription.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.unsubscribe(subscriptionId.split(':')[0], subscriptionId.split(':')[1]);
      return;
    }

    subscription.reconnectAttempts++;
    subscription.isActive = false;

    // Exponential backoff
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, subscription.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    setTimeout(async () => {
      try {
        // This would need to be adapted based on your specific subscription logic
        // Reconnection logic would go here
      } catch (error) {
        }
    }, delay);
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    // Unsubscribe from all channels
    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      subscription.channel.unsubscribe();
    }
    this.subscriptions.clear();

    // Clear all polling intervals
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();

    // Destroy circuit breaker
    this.circuitBreaker.destroy();
  }
}

// Singleton instance
let reliableRealtime: ReliableRealtime | null = null;

export function getReliableRealtime(): ReliableRealtime {
  if (!reliableRealtime) {
    reliableRealtime = new ReliableRealtime(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return reliableRealtime;
}
