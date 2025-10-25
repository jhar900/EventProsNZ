import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export interface EncryptionKey {
  id: string;
  key_type: string;
  key_data: string;
  created_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  keyId: string;
}

export class DataEncryptionService {
  private supabase = createClient();
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits

  /**
   * Generate a new encryption key
   */
  async generateKey(keyType: string = 'data'): Promise<EncryptionKey> {
    const keyData = crypto.randomBytes(this.keyLength);
    const keyId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiration

    const key: EncryptionKey = {
      id: keyId,
      key_type: keyType,
      key_data: keyData.toString('hex'),
      created_at: new Date(),
      expires_at: expiresAt,
      is_active: true,
    };

    // Store key in database
    const { error } = await this.supabase.from('encryption_keys').insert({
      id: key.id,
      key_type: key.key_type,
      key_data: key.key_data,
      created_at: key.created_at.toISOString(),
      expires_at: key.expires_at?.toISOString(),
      is_active: key.is_active,
    });

    if (error) {
      throw new Error(`Failed to store encryption key: ${error.message}`);
    }

    return key;
  }

  /**
   * Get active encryption key
   */
  async getActiveKey(keyType: string = 'data'): Promise<EncryptionKey | null> {
    const { data, error } = await this.supabase
      .from('encryption_keys')
      .select('*')
      .eq('key_type', keyType)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      key_type: data.key_type,
      key_data: data.key_data,
      created_at: new Date(data.created_at),
      expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
      is_active: data.is_active,
    };
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(
    data: string,
    keyType: string = 'data'
  ): Promise<EncryptedData> {
    const key = await this.getActiveKey(keyType);
    if (!key || !key.key_data) {
      throw new Error('No active encryption key found or key data is missing');
    }

    const keyBuffer = Buffer.from(key.key_data, 'hex');
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
    cipher.setAAD(Buffer.from('eventpros', 'utf8'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      keyId: key.id,
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    const key = await this.getKeyById(encryptedData.keyId);
    if (!key || !key.key_data) {
      throw new Error('Encryption key not found or key data is missing');
    }

    const keyBuffer = Buffer.from(key.key_data, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
    decipher.setAAD(Buffer.from('eventpros', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Get encryption key by ID
   */
  private async getKeyById(keyId: string): Promise<EncryptionKey | null> {
    const { data, error } = await this.supabase
      .from('encryption_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      key_type: data.key_type,
      key_data: data.key_data,
      created_at: new Date(data.created_at),
      expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
      is_active: data.is_active,
    };
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(keyType: string = 'data'): Promise<EncryptionKey> {
    // Deactivate current keys
    await this.supabase
      .from('encryption_keys')
      .update({ is_active: false })
      .eq('key_type', keyType)
      .eq('is_active', true);

    // Generate new key
    return await this.generateKey(keyType);
  }

  /**
   * Encrypt database fields
   */
  async encryptDatabaseField(
    value: string,
    fieldType: string = 'sensitive'
  ): Promise<string> {
    const encrypted = await this.encrypt(value, fieldType);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt database fields
   */
  async decryptDatabaseField(encryptedValue: string): Promise<string> {
    const encryptedData = JSON.parse(encryptedValue) as EncryptedData;
    return await this.decrypt(encryptedData);
  }

  /**
   * Encrypt file data
   */
  async encryptFile(
    fileBuffer: Buffer,
    keyType: string = 'file'
  ): Promise<EncryptedData> {
    const fileString = fileBuffer.toString('base64');
    return await this.encrypt(fileString, keyType);
  }

  /**
   * Decrypt file data
   */
  async decryptFile(encryptedData: EncryptedData): Promise<Buffer> {
    const decryptedString = await this.decrypt(encryptedData);
    return Buffer.from(decryptedString, 'base64');
  }

  /**
   * Encrypt API data for transmission
   */
  async encryptAPIData(
    data: any,
    keyType: string = 'api'
  ): Promise<EncryptedData> {
    const jsonString = JSON.stringify(data);
    return await this.encrypt(jsonString, keyType);
  }

  /**
   * Decrypt API data
   */
  async decryptAPIData(encryptedData: EncryptedData): Promise<any> {
    const decryptedString = await this.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }

  /**
   * Monitor encryption operations
   */
  async logEncryptionOperation(
    operation: 'encrypt' | 'decrypt',
    keyType: string,
    success: boolean,
    details?: any
  ): Promise<void> {
    try {
      await this.supabase.from('security_audit').insert({
        event_type: `encryption_${operation}`,
        details: {
          key_type: keyType,
          success,
          ...details,
        },
        severity: success ? 'info' : 'error',
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log encryption operation:', error);
    }
  }
}
