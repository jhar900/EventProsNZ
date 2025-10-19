import { describe, it, expect } from '@jest/globals';

describe('Mock Test', () => {
  it('should test the global mock', () => {
    const mockSupabase = global.mockSupabaseClient;

    // Test basic functionality
    expect(mockSupabase).toBeDefined();
    expect(mockSupabase.from).toBeDefined();
    expect(mockSupabase.auth).toBeDefined();

    // Test method chaining
    const query = mockSupabase.from('test');
    expect(query.select).toBeDefined();
    expect(query.eq).toBeDefined();
    expect(query.single).toBeDefined();

    // Test that methods return the query object for chaining
    const chained = query.select('*').eq('id', 'test').eq('user_id', 'user');
    expect(chained).toBe(query);
  });
});
