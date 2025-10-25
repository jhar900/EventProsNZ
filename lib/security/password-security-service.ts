import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';

export interface PasswordPolicy {
  id: string;
  policy_type: string;
  requirements: PasswordRequirements;
  is_active: boolean;
  created_at: Date;
}

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns: string[];
  maxRepeatedChars: number;
  passwordHistory: number; // Number of previous passwords to check
  expirationDays?: number;
}

export interface PasswordHistory {
  id: string;
  user_id: string;
  password_hash: string;
  created_at: Date;
}

export interface PasswordBreach {
  id: string;
  user_id: string;
  breach_type: string;
  details: any;
  created_at: Date;
  resolved: boolean;
}

export class PasswordSecurityService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();
  private readonly defaultPolicy: PasswordRequirements = {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenPatterns: ['password', '123456', 'qwerty', 'admin'],
    maxRepeatedChars: 3,
    passwordHistory: 5,
    expirationDays: 90,
  };

  /**
   * Create password policy
   */
  async createPasswordPolicy(
    policyType: string,
    requirements: Partial<PasswordRequirements> = {}
  ): Promise<PasswordPolicy> {
    const policyId = crypto.randomUUID();
    const policy: PasswordPolicy = {
      id: policyId,
      policy_type: policyType,
      requirements: { ...this.defaultPolicy, ...requirements },
      is_active: true,
      created_at: new Date(),
    };

    const { error } = await this.supabase.from('password_policies').insert({
      id: policy.id,
      policy_type: policy.policy_type,
      requirements: policy.requirements,
      is_active: policy.is_active,
      created_at: policy.created_at.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to create password policy: ${error.message}`);
    }

    return policy;
  }

  /**
   * Get active password policy
   */
  async getActivePolicy(
    policyType: string = 'default'
  ): Promise<PasswordPolicy | null> {
    const { data, error } = await this.supabase
      .from('password_policies')
      .select('*')
      .eq('policy_type', policyType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      policy_type: data.policy_type,
      requirements: data.requirements,
      is_active: data.is_active,
      created_at: new Date(data.created_at),
    };
  }

  /**
   * Validate password against policy
   */
  async validatePassword(
    password: string,
    userId?: string,
    policyType: string = 'default'
  ): Promise<{ valid: boolean; errors: string[] }> {
    const policy = await this.getActivePolicy(policyType);
    if (!policy) {
      throw new Error('No active password policy found');
    }

    const errors: string[] = [];
    const requirements = policy.requirements;

    // Length validation
    if (password.length < requirements.minLength) {
      errors.push(
        `Password must be at least ${requirements.minLength} characters long`
      );
    }
    if (password.length > requirements.maxLength) {
      errors.push(
        `Password must be no more than ${requirements.maxLength} characters long`
      );
    }

    // Character type validation
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (
      requirements.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    }

    // Forbidden patterns
    for (const pattern of requirements.forbiddenPatterns) {
      if (password.toLowerCase().includes(pattern.toLowerCase())) {
        errors.push(`Password cannot contain "${pattern}"`);
      }
    }

    // Repeated characters
    const maxRepeated = this.getMaxRepeatedChars(password);
    if (maxRepeated > requirements.maxRepeatedChars) {
      errors.push(
        `Password cannot have more than ${requirements.maxRepeatedChars} repeated characters in a row`
      );
    }

    // Password history check
    if (userId && requirements.passwordHistory > 0) {
      const isInHistory = await this.isPasswordInHistory(
        userId,
        password,
        requirements.passwordHistory
      );
      if (isInHistory) {
        errors.push(
          `Password cannot be one of your last ${requirements.passwordHistory} passwords`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verify password hash
   */
  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    const [saltHex, hashHex] = hashedPassword.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return hash.toString('hex') === hashHex;
  }

  /**
   * Store password in history
   */
  async storePasswordInHistory(
    userId: string,
    password: string
  ): Promise<void> {
    const hashedPassword = await this.hashPassword(password);

    await this.supabase.from('password_history').insert({
      user_id: userId,
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
    });

    // Clean up old passwords beyond history limit
    const policy = await this.getActivePolicy();
    if (policy && policy.requirements.passwordHistory > 0) {
      await this.cleanupPasswordHistory(
        userId,
        policy.requirements.passwordHistory
      );
    }
  }

  /**
   * Check if password is in history
   */
  private async isPasswordInHistory(
    userId: string,
    password: string,
    historyLimit: number
  ): Promise<boolean> {
    const { data: history } = await this.supabase
      .from('password_history')
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(historyLimit);

    if (!history) {
      return false;
    }

    for (const entry of history) {
      if (await this.verifyPassword(password, entry.password_hash)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clean up password history
   */
  private async cleanupPasswordHistory(
    userId: string,
    keepCount: number
  ): Promise<void> {
    const { data: oldPasswords } = await this.supabase
      .from('password_history')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(keepCount, Infinity);

    if (oldPasswords && oldPasswords.length > 0) {
      const idsToDelete = oldPasswords.map(p => p.id);
      await this.supabase
        .from('password_history')
        .delete()
        .in('id', idsToDelete);
    }
  }

  /**
   * Get maximum repeated characters in password
   */
  private getMaxRepeatedChars(password: string): number {
    let maxRepeated = 1;
    let currentRepeated = 1;

    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        currentRepeated++;
      } else {
        maxRepeated = Math.max(maxRepeated, currentRepeated);
        currentRepeated = 1;
      }
    }

    return Math.max(maxRepeated, currentRepeated);
  }

  /**
   * Check for password breaches
   */
  async checkPasswordBreach(
    password: string,
    userId: string
  ): Promise<boolean> {
    // This is a simplified implementation
    // In practice, you'd integrate with services like HaveIBeenPwned
    const commonBreachedPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    const isBreached = commonBreachedPasswords.includes(password.toLowerCase());

    if (isBreached) {
      await this.recordPasswordBreach(userId, 'common_password', {
        password: password.substring(0, 3) + '***', // Partial password for logging
        breach_source: 'common_passwords_list',
      });
    }

    return isBreached;
  }

  /**
   * Record password breach
   */
  private async recordPasswordBreach(
    userId: string,
    breachType: string,
    details: any
  ): Promise<void> {
    await this.supabase.from('password_breaches').insert({
      user_id: userId,
      breach_type: breachType,
      details,
      created_at: new Date().toISOString(),
      resolved: false,
    });

    // Log breach event
    await this.auditLogger.logEvent({
      action: 'password_breach_detected',
      userId,
      resource: 'password_security',
      details: { breachType, ...details },
    });
  }

  /**
   * Check password expiration
   */
  async isPasswordExpired(userId: string): Promise<boolean> {
    const policy = await this.getActivePolicy();
    if (!policy || !policy.requirements.expirationDays) {
      return false;
    }

    const { data: user } = await this.supabase
      .from('users')
      .select('password_updated_at')
      .eq('id', userId)
      .single();

    if (!user || !user.password_updated_at) {
      return true; // No password set, consider expired
    }

    const passwordAge =
      Date.now() - new Date(user.password_updated_at).getTime();
    const expirationTime =
      policy.requirements.expirationDays * 24 * 60 * 60 * 1000;

    return passwordAge > expirationTime;
  }

  /**
   * Get password strength score
   */
  getPasswordStrength(password: string): { score: number; feedback: string[] } {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    // Entropy bonus
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) score += 1;
    if (uniqueChars >= 12) score += 1;

    // Feedback based on score
    if (score < 2) {
      feedback.push('Password is very weak');
    } else if (score < 4) {
      feedback.push('Password is weak');
    } else if (score < 6) {
      feedback.push('Password is moderate');
    } else if (score < 8) {
      feedback.push('Password is strong');
    } else {
      feedback.push('Password is very strong');
    }

    return { score, feedback };
  }

  /**
   * Generate secure password
   */
  generateSecurePassword(length: number = 16): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one character from each required type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Reset password securely
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    // Validate new password
    const validation = await this.validatePassword(newPassword, userId);
    if (!validation.valid) {
      throw new Error(
        `Password validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Check for breaches
    const isBreached = await this.checkPasswordBreach(newPassword, userId);
    if (isBreached) {
      throw new Error('Password has been found in data breaches');
    }

    // Hash and store new password
    const hashedPassword = await this.hashPassword(newPassword);
    await this.supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        password_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Store in history
    await this.storePasswordInHistory(userId, newPassword);

    // Log password reset
    await this.auditLogger.logEvent({
      action: 'password_reset',
      userId,
      resource: 'password_security',
    });
  }
}
