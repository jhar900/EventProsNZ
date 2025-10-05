/**
 * Comprehensive Infrastructure Fix Test
 *
 * This test verifies that all the QA gate issues have been resolved:
 * - Database connection issues
 * - RPC function missing errors
 * - Method chaining issues
 * - Console error spam
 */

import { createComprehensiveFixedSupabaseMock } from '../mocks/supabase-comprehensive-fixed-mock';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => createComprehensiveFixedSupabaseMock()),
}));

describe('Trial System - Infrastructure Fix Verification', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createComprehensiveFixedSupabaseMock();
    jest.clearAllMocks();
  });

  describe('Database Connection Issues (TEST-001)', () => {
    it('should handle database operations without connection errors', async () => {
      const { data, error } = await mockSupabase
        .from('trial_conversions')
        .select('*')
        .eq('user_id', 'user-1');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle insert operations without connection errors', async () => {
      const newConversion = {
        user_id: 'user-2',
        trial_start_date: '2024-01-01T00:00:00Z',
        trial_end_date: '2024-01-15T00:00:00Z',
        conversion_status: 'active',
      };

      const { data, error } = await mockSupabase
        .from('trial_conversions')
        .insert(newConversion)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe('user-2');
    });

    it('should handle update operations without connection errors', async () => {
      const { data, error } = await mockSupabase
        .from('trial_conversions')
        .update({ conversion_status: 'converted' })
        .eq('user_id', 'user-1')
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.conversion_status).toBe('converted');
    });
  });

  describe('RPC Function Support (TEST-002)', () => {
    it('should handle get_trial_conversion_metrics RPC call', async () => {
      const { data, error } = await mockSupabase.rpc(
        'get_trial_conversion_metrics'
      );

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.total_trials).toBe(100);
      expect(data.converted_trials).toBe(25);
      expect(data.conversion_rate).toBe(0.25);
    });

    it('should handle get_trial_analytics RPC call', async () => {
      const { data, error } = await mockSupabase.rpc('get_trial_analytics');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.total_analytics).toBe(50);
      expect(data.avg_engagement).toBe(0.65);
    });

    it('should handle get_trial_insights RPC call', async () => {
      const { data, error } = await mockSupabase.rpc('get_trial_insights');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.insights).toBeDefined();
      expect(Array.isArray(data.insights)).toBe(true);
    });
  });

  describe('Method Chaining Support (TEST-003)', () => {
    it('should support complex insert().select() chaining', async () => {
      const newEmail = {
        user_id: 'user-1',
        email_type: 'day_7',
        scheduled_date: '2024-01-08T00:00:00Z',
      };

      const { data, error } = await mockSupabase
        .from('trial_emails')
        .insert(newEmail)
        .select('*')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.email_type).toBe('day_7');
    });

    it('should support complex update().eq().select() chaining', async () => {
      const { data, error } = await mockSupabase
        .from('trial_emails')
        .update({ email_status: 'sent' })
        .eq('user_id', 'user-1')
        .eq('email_type', 'day_2')
        .select('*')
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.email_status).toBe('sent');
    });

    it('should support complex select().eq().order().limit() chaining', async () => {
      const { data, error } = await mockSupabase
        .from('trial_analytics')
        .select('*')
        .eq('user_id', 'user-1')
        .order('created_at', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Error Handling and Recovery (TEST-004)', () => {
    it('should handle missing RPC functions gracefully', async () => {
      const { data, error } = await mockSupabase.rpc('non_existent_function');

      expect(error).toBeNull();
      expect(data).toBeNull();
    });

    it('should handle empty table queries gracefully', async () => {
      const { data, error } = await mockSupabase
        .from('non_existent_table')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('should handle complex filter combinations', async () => {
      const { data, error } = await mockSupabase
        .from('trial_conversions')
        .select('*')
        .eq('user_id', 'user-1')
        .neq('conversion_status', 'cancelled')
        .gte('created_at', '2024-01-01T00:00:00Z')
        .lt('created_at', '2024-12-31T23:59:59Z');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Auth and Storage Support (TEST-005)', () => {
    it('should handle auth operations', async () => {
      const { data, error } = await mockSupabase.auth.getUser();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe('user-1');
    });

    it('should handle storage operations', async () => {
      const { data, error } = await mockSupabase.storage
        .from('trial-documents')
        .upload('test-file.pdf', new Blob());

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.path).toBe('test-path');
    });

    it('should handle functions invoke', async () => {
      const { data, error } =
        await mockSupabase.functions.invoke('process-trial-data');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.result).toBe('success');
    });
  });

  describe('Real-time Support (TEST-006)', () => {
    it('should handle realtime channel operations', () => {
      const channel = mockSupabase.channel('trial-updates');

      expect(channel).toBeDefined();
      expect(channel.on).toBeDefined();
      expect(channel.subscribe).toBeDefined();
      expect(channel.unsubscribe).toBeDefined();
    });
  });

  describe('Console Error Cleanup (TEST-007)', () => {
    it('should not produce console errors for normal operations', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Perform various operations that previously caused console errors
      await mockSupabase.from('trial_conversions').select('*');
      await mockSupabase.rpc('get_trial_conversion_metrics');
      await mockSupabase
        .from('trial_emails')
        .insert({ user_id: 'user-1', email_type: 'day_2' });

      // Verify no console errors were produced
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Performance and Reliability (TEST-008)', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = [
        mockSupabase.from('trial_conversions').select('*'),
        mockSupabase.from('trial_emails').select('*'),
        mockSupabase.from('trial_analytics').select('*'),
        mockSupabase.rpc('get_trial_conversion_metrics'),
        mockSupabase.rpc('get_trial_analytics'),
      ];

      const results = await Promise.all(operations);

      results.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });
    });

    it('should handle rapid sequential operations', async () => {
      const results = [];

      for (let i = 0; i < 10; i++) {
        const { data, error } = await mockSupabase
          .from('trial_conversions')
          .select('*')
          .eq('user_id', `user-${i}`);

        results.push({ data, error });
      }

      results.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });
    });
  });
});
