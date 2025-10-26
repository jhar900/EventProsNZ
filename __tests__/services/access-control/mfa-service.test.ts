import { MFAService } from '@/lib/security/mfa-service';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock audit logger
jest.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn(),
  })),
}));

describe('MFAService', () => {
  let mfaService: MFAService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    mfaService = new MFAService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTOTPSecret', () => {
    it('should generate TOTP secret and QR code', async () => {
      const result = await mfaService.generateTOTPSecret(
        'user1',
        'user@example.com'
      );

      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toContain('otpauth://totp/');
      expect(result.backupCodes).toHaveLength(10);
      expect(result.backupCodes[0]).toMatch(/^[A-F0-9]{8}$/);
    });
  });

  describe('enableTOTP', () => {
    it('should enable TOTP for user', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({ data: {}, error: null })),
          })),
        })),
      });

      // Mock verifyTOTPToken to return true
      jest.spyOn(mfaService as any, 'verifyTOTPToken').mockReturnValue(true);

      await expect(
        mfaService.enableTOTP('user1', 'secret', '123456', [
          'backup1',
          'backup2',
        ])
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('mfa_settings');
    });

    it('should throw error for invalid TOTP token', async () => {
      // Mock verifyTOTPToken to return false
      jest.spyOn(mfaService as any, 'verifyTOTPToken').mockReturnValue(false);

      await expect(
        mfaService.enableTOTP('user1', 'secret', 'invalid', [
          'backup1',
          'backup2',
        ])
      ).rejects.toThrow('Invalid TOTP token');
    });
  });

  describe('enableSMS', () => {
    it('should enable SMS for user with valid phone number', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({ data: {}, error: null })),
          })),
        })),
      });

      await expect(
        mfaService.enableSMS('user1', '+1234567890')
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('mfa_settings');
    });

    it('should throw error for invalid phone number', async () => {
      await expect(
        mfaService.enableSMS('user1', 'invalid-phone')
      ).rejects.toThrow('Invalid phone number format');
    });
  });

  describe('verifyTOTP', () => {
    it('should verify valid TOTP token', async () => {
      const mockMfaSettings = {
        data: {
          totp_secret: 'encrypted-secret',
          totp_enabled: true,
        },
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => mockMfaSettings),
            })),
          })),
        })),
      });

      // Mock decryptSecret and verifyTOTPToken
      jest.spyOn(mfaService as any, 'decryptSecret').mockReturnValue('secret');
      jest.spyOn(mfaService as any, 'verifyTOTPToken').mockReturnValue(true);

      const result = await mfaService.verifyTOTP('user1', '123456');

      expect(result).toBe(true);
    });

    it('should return false for invalid TOTP token', async () => {
      const mockMfaSettings = {
        data: {
          totp_secret: 'encrypted-secret',
          totp_enabled: true,
        },
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => mockMfaSettings),
            })),
          })),
        })),
      });

      // Mock decryptSecret and verifyTOTPToken
      jest.spyOn(mfaService as any, 'decryptSecret').mockReturnValue('secret');
      jest.spyOn(mfaService as any, 'verifyTOTPToken').mockReturnValue(false);

      const result = await mfaService.verifyTOTP('user1', 'invalid');

      expect(result).toBe(false);
    });

    it('should return false when TOTP not enabled', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'Not found' },
              })),
            })),
          })),
        })),
      });

      const result = await mfaService.verifyTOTP('user1', '123456');

      expect(result).toBe(false);
    });
  });

  describe('verifySMS', () => {
    it('should verify valid SMS code', async () => {
      const result = await mfaService.verifySMS('user1', '123456');

      expect(result).toBe(true);
    });

    it('should return false for invalid SMS code', async () => {
      const result = await mfaService.verifySMS('user1', 'invalid');

      expect(result).toBe(false);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup code', async () => {
      const mockMfaSettings = {
        data: {
          backup_codes: ['ABCD1234', 'EFGH5678'],
        },
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => mockMfaSettings),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({ data: {}, error: null })),
        })),
      });

      const result = await mfaService.verifyBackupCode('user1', 'ABCD1234');

      expect(result).toBe(true);
    });

    it('should return false for invalid backup code', async () => {
      const mockMfaSettings = {
        data: {
          backup_codes: ['ABCD1234', 'EFGH5678'],
        },
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => mockMfaSettings),
          })),
        })),
      });

      const result = await mfaService.verifyBackupCode('user1', 'INVALID');

      expect(result).toBe(false);
    });
  });

  describe('getMFASettings', () => {
    it('should return MFA settings for user', async () => {
      const mockSettings = {
        data: {
          id: '1',
          user_id: 'user1',
          totp_secret: 'encrypted-secret',
          totp_enabled: true,
          sms_phone: '+1234567890',
          sms_enabled: true,
          backup_codes: ['ABCD1234'],
          recovery_email: 'recovery@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => mockSettings),
          })),
        })),
      });

      const result = await mfaService.getMFASettings('user1');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user1');
      expect(result?.totpEnabled).toBe(true);
      expect(result?.smsEnabled).toBe(true);
    });

    it('should return null when no settings found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Not found' },
            })),
          })),
        })),
      });

      const result = await mfaService.getMFASettings('user1');

      expect(result).toBeNull();
    });
  });

  describe('disableMFA', () => {
    it('should disable TOTP', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({ data: {}, error: null })),
        })),
      });

      await expect(
        mfaService.disableMFA('user1', 'totp')
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('mfa_settings');
    });

    it('should disable SMS', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({ data: {}, error: null })),
        })),
      });

      await expect(
        mfaService.disableMFA('user1', 'sms')
      ).resolves.not.toThrow();
    });

    it('should disable all MFA methods', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({ data: {}, error: null })),
        })),
      });

      await expect(
        mfaService.disableMFA('user1', 'all')
      ).resolves.not.toThrow();
    });
  });

  describe('generateNewBackupCodes', () => {
    it('should generate new backup codes', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({ data: {}, error: null })),
        })),
      });

      const result = await mfaService.generateNewBackupCodes('user1');

      expect(result).toHaveLength(10);
      expect(result[0]).toMatch(/^[A-F0-9]{8}$/);
    });
  });
});
