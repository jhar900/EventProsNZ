/**
 * Mock Verification Service Test
 *
 * This test verifies that the service classes are getting the correct mock
 */

import { TrialConversionService } from '../../lib/trial/conversion-service';

describe('Mock Verification Service Test', () => {
  let conversionService: TrialConversionService;

  beforeEach(() => {
    conversionService = new TrialConversionService();
  });

  it('should use the final mock for service operations', async () => {
    const conversionData = {
      userId: 'test-user-id',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      conversionStatus: 'active' as const,
    };

    // This should work with the final mock
    const result =
      await conversionService.createTrialConversion(conversionData);

    expect(result).toBeDefined();
    expect(result).toBe('test-id'); // The final mock returns 'test-id'
  });

  it('should handle method chaining correctly', async () => {
    const conversionData = {
      userId: 'test-user-id',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      conversionStatus: 'active' as const,
    };

    // This should not throw a method chaining error
    await expect(
      conversionService.createTrialConversion(conversionData)
    ).resolves.toBeDefined();
  });
});
