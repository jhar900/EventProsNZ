import { DataEncryptionService } from '@/lib/security/data-encryption-service';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: null })),
            })),
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({ error: null })),
        })),
      })),
    })),
  })),
}));

describe('DataEncryptionService', () => {
  let encryptionService: DataEncryptionService;

  beforeEach(() => {
    encryptionService = new DataEncryptionService();
  });

  describe('generateKey', () => {
    it('should generate a new encryption key', async () => {
      const key = await encryptionService.generateKey('data');

      expect(key).toBeDefined();
      expect(key.id).toBeDefined();
      expect(key.key_type).toBe('data');
      expect(key.key_data).toBeDefined();
      expect(key.is_active).toBe(true);
      expect(key.created_at).toBeInstanceOf(Date);
    });

    it('should generate key with custom type', async () => {
      const key = await encryptionService.generateKey('file');

      expect(key.key_type).toBe('file');
    });
  });

  describe('encrypt', () => {
    it('should encrypt data successfully', async () => {
      const testData = 'sensitive information';

      // Mock getActiveKey to return a key with valid 32-byte hex key
      jest.spyOn(encryptionService as any, 'getActiveKey').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'data',
        created_at: new Date(),
        is_active: true,
      });

      const encrypted = await encryptionService.encrypt(testData, 'data');

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.keyId).toBe('test-key-id');
    });

    it('should throw error when no active key found', async () => {
      jest
        .spyOn(encryptionService as any, 'getActiveKey')
        .mockResolvedValue(null);

      await expect(encryptionService.encrypt('test data')).rejects.toThrow(
        'No active encryption key found'
      );
    });
  });

  describe('decrypt', () => {
    it('should decrypt data successfully', async () => {
      const testData = 'sensitive information';

      // Mock getActiveKey to return a key with valid 32-byte hex key
      jest.spyOn(encryptionService as any, 'getActiveKey').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'data',
        created_at: new Date(),
        is_active: true,
      });

      // First encrypt the data
      const encryptedData = await encryptionService.encrypt(testData, 'data');

      // Mock getKeyById to return the same key
      jest.spyOn(encryptionService as any, 'getKeyById').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'data',
        created_at: new Date(),
        is_active: true,
      });

      // Now decrypt the actually encrypted data
      const decrypted = await encryptionService.decrypt(encryptedData);

      expect(decrypted).toBe(testData);
    });

    it('should throw error when key not found', async () => {
      const encryptedData = {
        encrypted: 'encrypted-data',
        iv: '0123456789abcdef0123456789abcdef', // 16-byte hex IV
        tag: '0123456789abcdef0123456789abcdef', // 16-byte hex tag
        keyId: 'non-existent-key',
      };

      jest
        .spyOn(encryptionService as any, 'getKeyById')
        .mockResolvedValue(null);

      await expect(encryptionService.decrypt(encryptedData)).rejects.toThrow(
        'Encryption key not found'
      );
    });
  });

  describe('encryptDatabaseField', () => {
    it('should encrypt database field', async () => {
      const testValue = 'sensitive database value';

      jest.spyOn(encryptionService as any, 'getActiveKey').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'data',
        created_at: new Date(),
        is_active: true,
      });

      const encrypted = await encryptionService.encryptDatabaseField(
        testValue,
        'sensitive'
      );

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      // Should be valid JSON
      const parsed = JSON.parse(encrypted);
      expect(parsed).toHaveProperty('encrypted');
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('tag');
      expect(parsed).toHaveProperty('keyId');
    });
  });

  describe('decryptDatabaseField', () => {
    it('should decrypt database field', async () => {
      const testValue = 'sensitive database value';

      // Mock getActiveKey for encryption
      jest.spyOn(encryptionService as any, 'getActiveKey').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'sensitive',
        created_at: new Date(),
        is_active: true,
      });

      // First encrypt the data
      const encryptedValue = await encryptionService.encryptDatabaseField(
        testValue,
        'sensitive'
      );

      // Mock getKeyById for decryption
      jest.spyOn(encryptionService as any, 'getKeyById').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'sensitive',
        created_at: new Date(),
        is_active: true,
      });

      // Now decrypt the actually encrypted data
      const decrypted =
        await encryptionService.decryptDatabaseField(encryptedValue);

      expect(decrypted).toBe(testValue);
    });
  });

  describe('encryptFile', () => {
    it('should encrypt file data', async () => {
      const fileBuffer = Buffer.from('test file content');

      jest.spyOn(encryptionService as any, 'getActiveKey').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'file',
        created_at: new Date(),
        is_active: true,
      });

      const encrypted = await encryptionService.encryptFile(fileBuffer, 'file');

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.keyId).toBe('test-key-id');
    });
  });

  describe('decryptFile', () => {
    it('should decrypt file data', async () => {
      const fileBuffer = Buffer.from('test file content');

      // Mock getActiveKey for encryption
      jest.spyOn(encryptionService as any, 'getActiveKey').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'file',
        created_at: new Date(),
        is_active: true,
      });

      // First encrypt the file
      const encryptedData = await encryptionService.encryptFile(
        fileBuffer,
        'file'
      );

      // Mock getKeyById for decryption
      jest.spyOn(encryptionService as any, 'getKeyById').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'file',
        created_at: new Date(),
        is_active: true,
      });

      // Now decrypt the actually encrypted data
      const decrypted = await encryptionService.decryptFile(encryptedData);

      expect(decrypted).toBeInstanceOf(Buffer);
      expect(decrypted.toString()).toBe('test file content');
    });
  });

  describe('encryptAPIData', () => {
    it('should encrypt API data', async () => {
      const apiData = { userId: '123', data: 'sensitive' };

      jest.spyOn(encryptionService as any, 'getActiveKey').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'api',
        created_at: new Date(),
        is_active: true,
      });

      const encrypted = await encryptionService.encryptAPIData(apiData, 'api');

      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
    });
  });

  describe('decryptAPIData', () => {
    it('should decrypt API data', async () => {
      const apiData = { userId: '123', data: 'sensitive' };

      // Mock getActiveKey for encryption
      jest.spyOn(encryptionService as any, 'getActiveKey').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'api',
        created_at: new Date(),
        is_active: true,
      });

      // First encrypt the API data
      const encryptedData = await encryptionService.encryptAPIData(
        apiData,
        'api'
      );

      // Mock getKeyById for decryption
      jest.spyOn(encryptionService as any, 'getKeyById').mockResolvedValue({
        id: 'test-key-id',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32-byte hex key
        key_type: 'api',
        created_at: new Date(),
        is_active: true,
      });

      // Now decrypt the actually encrypted data
      const decrypted = await encryptionService.decryptAPIData(encryptedData);

      expect(decrypted).toEqual(apiData);
    });
  });

  describe('rotateKeys', () => {
    it('should rotate encryption keys', async () => {
      // Mock the generateKey method to return a new key
      jest.spyOn(encryptionService, 'generateKey').mockResolvedValue({
        id: 'new-key-id',
        key_type: 'data',
        key_data:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        created_at: new Date(),
        is_active: true,
      });

      const newKey = await encryptionService.rotateKeys('data');

      expect(newKey).toBeDefined();
      expect(newKey.id).toBe('new-key-id');
    });
  });

  describe('logEncryptionOperation', () => {
    it('should log encryption operation', async () => {
      // This test just verifies the method doesn't throw an error
      // The actual logging is tested through integration tests
      await expect(
        encryptionService.logEncryptionOperation('encrypt', 'data', true, {
          test: 'data',
        })
      ).resolves.not.toThrow();
    });
  });
});
