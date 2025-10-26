import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';

export interface MFASettings {
  id: string;
  userId: string;
  totpSecret?: string;
  totpEnabled: boolean;
  smsPhone?: string;
  smsEnabled: boolean;
  backupCodes: string[];
  recoveryEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MFAAttempt {
  id: string;
  userId: string;
  attemptType: 'totp' | 'sms' | 'backup_code';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface TOTPResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class MFAService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  /**
   * Generate TOTP secret and QR code
   */
  async generateTOTPSecret(
    userId: string,
    userEmail: string
  ): Promise<TOTPResult> {
    try {
      const secret = this.generateSecret();
      const backupCodes = this.generateBackupCodes();

      // Create QR code URL
      const qrCodeUrl = this.generateQRCodeUrl(userEmail, secret);

      return {
        secret,
        qrCodeUrl,
        backupCodes,
      };
    } catch (error) {
      console.error('Error generating TOTP secret:', error);
      throw new Error('Failed to generate TOTP secret');
    }
  }

  /**
   * Enable TOTP for user
   */
  async enableTOTP(
    userId: string,
    secret: string,
    token: string,
    backupCodes: string[]
  ): Promise<void> {
    try {
      // Verify the token
      if (!this.verifyTOTPToken(secret, token)) {
        throw new Error('Invalid TOTP token');
      }

      // Store MFA settings
      const { error } = await this.supabase.from('mfa_settings').upsert({
        id: crypto.randomUUID(),
        user_id: userId,
        totp_secret: this.encryptSecret(secret),
        totp_enabled: true,
        backup_codes: backupCodes,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`Failed to enable TOTP: ${error.message}`);
      }

      // Log MFA setup
      await this.auditLogger.logEvent({
        action: 'mfa_totp_enabled',
        userId,
        resource: 'mfa_settings',
        details: { method: 'totp' },
      });
    } catch (error) {
      console.error('Error enabling TOTP:', error);
      throw error;
    }
  }

  /**
   * Enable SMS for user
   */
  async enableSMS(userId: string, phoneNumber: string): Promise<void> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Store MFA settings
      const { error } = await this.supabase.from('mfa_settings').upsert({
        id: crypto.randomUUID(),
        user_id: userId,
        sms_phone: phoneNumber,
        sms_enabled: true,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(`Failed to enable SMS: ${error.message}`);
      }

      // Log MFA setup
      await this.auditLogger.logEvent({
        action: 'mfa_sms_enabled',
        userId,
        resource: 'mfa_settings',
        details: { method: 'sms', phone: phoneNumber },
      });
    } catch (error) {
      console.error('Error enabling SMS:', error);
      throw error;
    }
  }

  /**
   * Verify TOTP token
   */
  async verifyTOTP(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      // Get user's TOTP secret
      const { data: mfaSettings, error } = await this.supabase
        .from('mfa_settings')
        .select('totp_secret, totp_enabled')
        .eq('user_id', userId)
        .eq('totp_enabled', true)
        .single();

      if (error || !mfaSettings) {
        throw new Error('TOTP not enabled for user');
      }

      const secret = this.decryptSecret(mfaSettings.totp_secret);
      const isValid = this.verifyTOTPToken(secret, token);

      // Log attempt
      await this.logMFAAttempt(userId, 'totp', isValid, ipAddress, userAgent);

      return isValid;
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      await this.logMFAAttempt(userId, 'totp', false, ipAddress, userAgent);
      return false;
    }
  }

  /**
   * Send SMS code
   */
  async sendSMSCode(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Get user's SMS settings
      const { data: mfaSettings, error } = await this.supabase
        .from('mfa_settings')
        .select('sms_phone, sms_enabled')
        .eq('user_id', userId)
        .eq('sms_enabled', true)
        .single();

      if (error || !mfaSettings) {
        throw new Error('SMS not enabled for user');
      }

      // Generate SMS code
      const code = this.generateSMSCode();

      // Store code temporarily (in production, use Redis or similar)
      const { error: storeError } = await this.supabase
        .from('mfa_attempts')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          attempt_type: 'sms',
          success: true,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
        });

      if (storeError) {
        console.error('Failed to store SMS attempt:', storeError);
      }

      // In production, send actual SMS here
      console.log(`SMS Code for ${mfaSettings.sms_phone}: ${code}`);

      // Log SMS sent
      await this.auditLogger.logEvent({
        action: 'mfa_sms_sent',
        userId,
        resource: 'mfa_settings',
        details: { phone: mfaSettings.sms_phone },
      });
    } catch (error) {
      console.error('Error sending SMS code:', error);
      throw error;
    }
  }

  /**
   * Verify SMS code
   */
  async verifySMS(
    userId: string,
    code: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      // In production, verify against stored code
      // For now, accept any 6-digit code
      const isValid = /^\d{6}$/.test(code);

      // Log attempt
      await this.logMFAAttempt(userId, 'sms', isValid, ipAddress, userAgent);

      return isValid;
    } catch (error) {
      console.error('Error verifying SMS:', error);
      await this.logMFAAttempt(userId, 'sms', false, ipAddress, userAgent);
      return false;
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(
    userId: string,
    code: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      // Get user's backup codes
      const { data: mfaSettings, error } = await this.supabase
        .from('mfa_settings')
        .select('backup_codes')
        .eq('user_id', userId)
        .single();

      if (error || !mfaSettings) {
        throw new Error('No backup codes found');
      }

      const isValid = mfaSettings.backup_codes.includes(code);

      if (isValid) {
        // Remove used backup code
        const updatedCodes = mfaSettings.backup_codes.filter(c => c !== code);
        await this.supabase
          .from('mfa_settings')
          .update({ backup_codes: updatedCodes })
          .eq('user_id', userId);
      }

      // Log attempt
      await this.logMFAAttempt(
        userId,
        'backup_code',
        isValid,
        ipAddress,
        userAgent
      );

      return isValid;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      await this.logMFAAttempt(
        userId,
        'backup_code',
        false,
        ipAddress,
        userAgent
      );
      return false;
    }
  }

  /**
   * Get user's MFA settings
   */
  async getMFASettings(userId: string): Promise<MFASettings | null> {
    try {
      const { data, error } = await this.supabase
        .from('mfa_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        totpSecret: data.totp_secret,
        totpEnabled: data.totp_enabled,
        smsPhone: data.sms_phone,
        smsEnabled: data.sms_enabled,
        backupCodes: data.backup_codes || [],
        recoveryEmail: data.recovery_email,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching MFA settings:', error);
      throw error;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(
    userId: string,
    method: 'totp' | 'sms' | 'all'
  ): Promise<void> {
    try {
      const updates: any = { updated_at: new Date().toISOString() };

      if (method === 'totp' || method === 'all') {
        updates.totp_enabled = false;
        updates.totp_secret = null;
      }

      if (method === 'sms' || method === 'all') {
        updates.sms_enabled = false;
        updates.sms_phone = null;
      }

      const { error } = await this.supabase
        .from('mfa_settings')
        .update(updates)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to disable MFA: ${error.message}`);
      }

      // Log MFA disable
      await this.auditLogger.logEvent({
        action: 'mfa_disabled',
        userId,
        resource: 'mfa_settings',
        details: { method },
      });
    } catch (error) {
      console.error('Error disabling MFA:', error);
      throw error;
    }
  }

  /**
   * Get MFA attempts for user
   */
  async getMFAAttempts(
    userId: string,
    limit: number = 50
  ): Promise<MFAAttempt[]> {
    try {
      const { data, error } = await this.supabase
        .from('mfa_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch MFA attempts: ${error.message}`);
      }

      return (
        data?.map(attempt => ({
          id: attempt.id,
          userId: attempt.user_id,
          attemptType: attempt.attempt_type,
          success: attempt.success,
          ipAddress: attempt.ip_address,
          userAgent: attempt.user_agent,
          createdAt: new Date(attempt.created_at),
        })) || []
      );
    } catch (error) {
      console.error('Error fetching MFA attempts:', error);
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string): Promise<string[]> {
    try {
      const newCodes = this.generateBackupCodes();

      const { error } = await this.supabase
        .from('mfa_settings')
        .update({
          backup_codes: newCodes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(
          `Failed to generate new backup codes: ${error.message}`
        );
      }

      // Log backup codes generation
      await this.auditLogger.logEvent({
        action: 'mfa_backup_codes_generated',
        userId,
        resource: 'mfa_settings',
        details: { count: newCodes.length },
      });

      return newCodes;
    } catch (error) {
      console.error('Error generating backup codes:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateSecret(): string {
    return crypto.randomBytes(20).toString('base32');
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateQRCodeUrl(email: string, secret: string): string {
    const issuer = 'EventProsNZ';
    const accountName = email;
    const encodedSecret = encodeURIComponent(secret);
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccountName = encodeURIComponent(accountName);

    return `otpauth://totp/${encodedAccountName}?secret=${encodedSecret}&issuer=${encodedIssuer}`;
  }

  private verifyTOTPToken(secret: string, token: string): boolean {
    // This is a simplified TOTP verification
    // In production, use a proper TOTP library like 'otplib'
    const expectedToken = this.generateTOTPToken(secret);
    return token === expectedToken;
  }

  private generateTOTPToken(secret: string): string {
    // Simplified TOTP generation
    // In production, use a proper TOTP library
    const time = Math.floor(Date.now() / 1000 / 30);
    const hash = crypto
      .createHmac('sha1', Buffer.from(secret, 'base32'))
      .update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'))
      .digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  }

  private encryptSecret(secret: string): string {
    // In production, use proper encryption
    return Buffer.from(secret).toString('base64');
  }

  private decryptSecret(encryptedSecret: string): string {
    // In production, use proper decryption
    return Buffer.from(encryptedSecret, 'base64').toString();
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  private async logMFAAttempt(
    userId: string,
    attemptType: 'totp' | 'sms' | 'backup_code',
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.supabase.from('mfa_attempts').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        attempt_type: attemptType,
        success,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log MFA attempt:', error);
    }
  }
}
