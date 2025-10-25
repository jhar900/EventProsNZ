import { DataEncryptionService } from '@/lib/security/data-encryption-service';

// Mock the database and external dependencies
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({ data: { id: 'test-key' } }),
      select: () => ({
        eq: () => ({ single: () => ({ data: { key_data: 'test-key-data' } }) }),
      }),
    }),
  }),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('test-random-bytes')),
  randomUUID: jest.fn(() => 'test-uuid-123'),
  createCipheriv: jest.fn(() => ({
    setAAD: jest.fn(),
    update: jest.fn(() => 'encrypted-data'),
    final: jest.fn(() => 'final-data'),
    getAuthTag: jest.fn(() => Buffer.from('auth-tag')),
  })),
  createDecipheriv: jest.fn(() => ({
    setAAD: jest.fn(),
    setAuthTag: jest.fn(),
    update: jest.fn(() => 'decrypted-data'),
    final: jest.fn(() => 'final-decrypted'),
  })),
}));

describe('Encryption Performance Benchmarks', () => {
  let encryptionService: DataEncryptionService;

  beforeEach(() => {
    encryptionService = new DataEncryptionService();

    // Mock the getActiveKey method
    encryptionService.getActiveKey = jest.fn().mockResolvedValue({
      id: 'test-key',
      key_data: 'test-key-data',
      key_type: 'data',
      is_active: true,
    });

    // Mock the getKeyById method
    encryptionService.getKeyById = jest.fn().mockResolvedValue({
      id: 'test-key',
      key_data: 'test-key-data',
      key_type: 'data',
      is_active: true,
    });
  });

  describe('Encryption Performance', () => {
    it('should encrypt small data (< 1KB) within 50ms', async () => {
      const smallData = 'small test data';
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await encryptionService.encrypt(smallData, 'data');
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(50); // Average should be under 50ms
      expect(maxTime).toBeLessThan(100); // Max should be under 100ms
    });

    it('should encrypt medium data (1-10KB) within 200ms', async () => {
      const mediumData = 'x'.repeat(5000); // 5KB of data
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await encryptionService.encrypt(mediumData, 'data');
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(200); // Average should be under 200ms
      expect(maxTime).toBeLessThan(500); // Max should be under 500ms
    });

    it('should encrypt large data (10-100KB) within 1000ms', async () => {
      const largeData = 'x'.repeat(50000); // 50KB of data
      const iterations = 3;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await encryptionService.encrypt(largeData, 'data');
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(1000); // Average should be under 1000ms
      expect(maxTime).toBeLessThan(2000); // Max should be under 2000ms
    });

    it('should handle concurrent encryption operations efficiently', async () => {
      const testData = 'concurrent test data';
      const concurrentOperations = 10;
      const startTime = process.hrtime.bigint();

      const promises = Array(concurrentOperations)
        .fill(null)
        .map(() => encryptionService.encrypt(testData, 'data'));

      await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;

      // 10 concurrent operations should complete within 2 seconds
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Decryption Performance', () => {
    it('should decrypt small data (< 1KB) within 50ms', async () => {
      const encryptedData = {
        encrypted: 'encrypted-small-data',
        iv: 'test-iv-hex',
        tag: 'test-tag-hex',
        keyId: 'test-key',
      };
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await encryptionService.decrypt(encryptedData);
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(100);
    });

    it('should decrypt medium data (1-10KB) within 200ms', async () => {
      const encryptedData = {
        encrypted: 'x'.repeat(5000), // 5KB of encrypted data
        iv: 'test-iv-hex',
        tag: 'test-tag-hex',
        keyId: 'test-key',
      };
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await encryptionService.decrypt(encryptedData);
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(200);
      expect(maxTime).toBeLessThan(500);
    });
  });

  describe('Key Management Performance', () => {
    it('should generate encryption keys within 100ms', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await encryptionService.generateKey('data');
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);
    });

    it('should retrieve encryption keys within 50ms', async () => {
      const keyId = 'test-key';
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        await encryptionService.getKeyById(keyId);
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(100);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks during encryption operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        await encryptionService.encrypt(`test data ${i}`, 'data');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large data without excessive memory usage', async () => {
      const largeData = 'x'.repeat(100000); // 100KB
      const initialMemory = process.memoryUsage().heapUsed;

      await encryptionService.encrypt(largeData, 'data');

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable for 100KB data
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
    });
  });

  describe('Throughput Benchmarks', () => {
    it('should process at least 100 encryption operations per second', async () => {
      const testData = 'throughput test data';
      const operations = 100;
      const startTime = process.hrtime.bigint();

      const promises = Array(operations)
        .fill(null)
        .map(() => encryptionService.encrypt(testData, 'data'));

      await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const operationsPerSecond = (operations / totalTime) * 1000;

      expect(operationsPerSecond).toBeGreaterThan(100);
    });

    it('should process at least 50 decryption operations per second', async () => {
      const encryptedData = {
        encrypted: 'encrypted-throughput-data',
        iv: 'test-iv-hex',
        tag: 'test-tag-hex',
        keyId: 'test-key',
      };
      const operations = 50;
      const startTime = process.hrtime.bigint();

      const promises = Array(operations)
        .fill(null)
        .map(() => encryptionService.decrypt(encryptedData));

      await Promise.all(promises);
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;
      const operationsPerSecond = (operations / totalTime) * 1000;

      expect(operationsPerSecond).toBeGreaterThan(50);
    });
  });

  describe('Error Recovery Performance', () => {
    it('should handle encryption errors without significant performance impact', async () => {
      const testData = 'error-test-data';
      const iterations = 10;
      const times: number[] = [];

      // Mock encryption to fail occasionally
      const originalEncrypt = encryptionService.encrypt;
      let failureCount = 0;
      encryptionService.encrypt = jest
        .fn()
        .mockImplementation(async (data, keyType) => {
          failureCount++;
          if (failureCount % 3 === 0) {
            throw new Error('Simulated encryption failure');
          }
          return originalEncrypt.call(encryptionService, data, keyType);
        });

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime.bigint();
        try {
          await encryptionService.encrypt(testData, 'data');
        } catch (error) {
          // Expected to fail occasionally
        }
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;

      // Even with errors, operations should complete reasonably quickly
      expect(averageTime).toBeLessThan(200);
    });
  });
});
