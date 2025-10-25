import { PasswordSecurityService } from '@/lib/security/password-security-service';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() => ({ data: null, error: null })),
              })),
            })),
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: null })),
            })),
          })),
        })),
      })),
      update: jest.fn(() => ({ error: null })),
      delete: jest.fn(() => ({ error: null })),
    })),
  })),
}));

// Mock AuditLogger
jest.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn(),
  })),
}));

describe('PasswordSecurityService', () => {
  let passwordService: PasswordSecurityService;

  beforeEach(() => {
    passwordService = new PasswordSecurityService();
  });

  describe('createPasswordPolicy', () => {
    it('should create a password policy', async () => {
      const policy = await passwordService.createPasswordPolicy('default', {
        minLength: 8,
        requireUppercase: true,
      });

      expect(policy).toBeDefined();
      expect(policy.id).toBeDefined();
      expect(policy.policy_type).toBe('default');
      expect(policy.requirements.minLength).toBe(8);
      expect(policy.requirements.requireUppercase).toBe(true);
      expect(policy.is_active).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should validate password against policy', async () => {
      // Mock getActivePolicy
      jest.spyOn(passwordService as any, 'getActivePolicy').mockResolvedValue({
        id: 'test-policy',
        policy_type: 'default',
        requirements: {
          minLength: 8,
          maxLength: 128,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          forbiddenPatterns: ['password', '123456'],
          maxRepeatedChars: 3,
          passwordHistory: 5,
        },
        is_active: true,
        created_at: new Date(),
      });

      const result = await passwordService.validatePassword('ValidPass123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', async () => {
      jest.spyOn(passwordService as any, 'getActivePolicy').mockResolvedValue({
        id: 'test-policy',
        policy_type: 'default',
        requirements: {
          minLength: 12,
          maxLength: 128,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          forbiddenPatterns: [],
          maxRepeatedChars: 3,
          passwordHistory: 5,
        },
        is_active: true,
        created_at: new Date(),
      });

      const result = await passwordService.validatePassword('short');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 12 characters long'
      );
    });

    it('should reject password without uppercase', async () => {
      jest.spyOn(passwordService as any, 'getActivePolicy').mockResolvedValue({
        id: 'test-policy',
        policy_type: 'default',
        requirements: {
          minLength: 8,
          maxLength: 128,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          forbiddenPatterns: [],
          maxRepeatedChars: 3,
          passwordHistory: 5,
        },
        is_active: true,
        created_at: new Date(),
      });

      const result = await passwordService.validatePassword('lowercase123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject password with forbidden patterns', async () => {
      jest.spyOn(passwordService as any, 'getActivePolicy').mockResolvedValue({
        id: 'test-policy',
        policy_type: 'default',
        requirements: {
          minLength: 8,
          maxLength: 128,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          forbiddenPatterns: ['password', '123456'],
          maxRepeatedChars: 3,
          passwordHistory: 5,
        },
        is_active: true,
        created_at: new Date(),
      });

      const result = await passwordService.validatePassword('mypassword123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password cannot contain "password"');
    });
  });

  describe('hashPassword', () => {
    it('should hash password securely', async () => {
      const password = 'testpassword123';
      const hashed = await passwordService.hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toContain(':'); // Should contain salt:hash format
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testpassword123';
      const hashed = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashed = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(
        wrongPassword,
        hashed
      );

      expect(isValid).toBe(false);
    });
  });

  describe('storePasswordInHistory', () => {
    it('should store password in history', async () => {
      const userId = 'test-user-id';
      const password = 'testpassword123';

      await passwordService.storePasswordInHistory(userId, password);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('checkPasswordBreach', () => {
    it('should detect common breached passwords', async () => {
      const userId = 'test-user-id';
      const breachedPassword = 'password';

      const isBreached = await passwordService.checkPasswordBreach(
        breachedPassword,
        userId
      );

      expect(isBreached).toBe(true);
    });

    it('should not flag secure passwords', async () => {
      const userId = 'test-user-id';
      const securePassword = 'SecurePassword123!';

      const isBreached = await passwordService.checkPasswordBreach(
        securePassword,
        userId
      );

      expect(isBreached).toBe(false);
    });
  });

  describe('isPasswordExpired', () => {
    it('should check if password is expired', async () => {
      const userId = 'test-user-id';

      // Mock getActivePolicy
      jest.spyOn(passwordService as any, 'getActivePolicy').mockResolvedValue({
        id: 'test-policy',
        policy_type: 'default',
        requirements: {
          minLength: 8,
          maxLength: 128,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          forbiddenPatterns: [],
          maxRepeatedChars: 3,
          passwordHistory: 5,
          expirationDays: 90,
        },
        is_active: true,
        created_at: new Date(),
      });

      // Mock user data
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  password_updated_at: new Date(
                    Date.now() - 100 * 24 * 60 * 60 * 1000
                  ).toISOString(),
                },
                error: null,
              })),
            })),
          })),
        })),
      };

      // Mock the database call directly
      const mockSupabase2 = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  created_at: new Date(
                    Date.now() - 100 * 24 * 60 * 60 * 1000
                  ).toISOString(),
                },
                error: null,
              })),
            })),
          })),
        })),
      };

      // Replace the supabase instance
      (passwordService as any).supabase = mockSupabase2;

      const isExpired = await passwordService.isPasswordExpired(userId);

      expect(isExpired).toBe(true);
    });
  });

  describe('getPasswordStrength', () => {
    it('should calculate password strength', () => {
      const weakPassword = 'password';
      const strongPassword = 'SecurePassword123!';

      const weakResult = passwordService.getPasswordStrength(weakPassword);
      const strongResult = passwordService.getPasswordStrength(strongPassword);

      expect(weakResult.score).toBeLessThan(strongResult.score);
      expect(weakResult.feedback.some(f => f.includes('weak'))).toBe(true);
      expect(strongResult.feedback.some(f => f.includes('strong'))).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate secure password', () => {
      const password = passwordService.generateSecurePassword(16);

      expect(password).toHaveLength(16);
      expect(password).toMatch(/[A-Z]/); // Contains uppercase
      expect(password).toMatch(/[a-z]/); // Contains lowercase
      expect(password).toMatch(/\d/); // Contains number
    });

    it('should generate password with custom length', () => {
      const password = passwordService.generateSecurePassword(20);

      expect(password).toHaveLength(20);
    });
  });

  describe('resetPassword', () => {
    it('should reset password securely', async () => {
      const userId = 'test-user-id';
      const newPassword = 'NewSecurePassword123!';

      // Mock dependencies
      jest
        .spyOn(passwordService, 'validatePassword')
        .mockResolvedValue({ valid: true, errors: [] });
      jest
        .spyOn(passwordService, 'checkPasswordBreach')
        .mockResolvedValue(false);
      jest
        .spyOn(passwordService, 'hashPassword')
        .mockResolvedValue('hashed-password');
      jest.spyOn(passwordService, 'storePasswordInHistory').mockResolvedValue();

      const mockSupabase = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({ error: null })),
          })),
        })),
      };

      // Replace the supabase instance
      (passwordService as any).supabase = mockSupabase;

      await passwordService.resetPassword(userId, newPassword);

      expect(passwordService.validatePassword).toHaveBeenCalledWith(
        newPassword,
        userId
      );
      expect(passwordService.checkPasswordBreach).toHaveBeenCalledWith(
        newPassword,
        userId
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(newPassword);
    });

    it('should reject invalid password', async () => {
      const userId = 'test-user-id';
      const invalidPassword = 'short';

      jest.spyOn(passwordService, 'validatePassword').mockResolvedValue({
        valid: false,
        errors: ['Password too short'],
      });

      await expect(
        passwordService.resetPassword(userId, invalidPassword)
      ).rejects.toThrow('Password validation failed: Password too short');
    });

    it('should reject breached password', async () => {
      const userId = 'test-user-id';
      const breachedPassword = 'password';

      jest
        .spyOn(passwordService, 'validatePassword')
        .mockResolvedValue({ valid: true, errors: [] });
      jest
        .spyOn(passwordService, 'checkPasswordBreach')
        .mockResolvedValue(true);

      await expect(
        passwordService.resetPassword(userId, breachedPassword)
      ).rejects.toThrow('Password has been found in data breaches');
    });
  });
});
