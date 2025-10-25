import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';

export interface SecureSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface SessionConfig {
  sessionTimeout: number; // in milliseconds
  maxSessions: number;
  requireReauth: boolean;
  allowedOrigins: string[];
}

export class SecureAuthService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();
  private readonly sessionConfig: SessionConfig = {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxSessions: 5,
    requireReauth: true,
    allowedOrigins: ['http://localhost:3000', 'https://eventpros.co.nz'],
  };

  /**
   * Create a secure session
   */
  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SecureSession> {
    // Check existing sessions
    await this.cleanupExpiredSessions(userId);
    await this.enforceMaxSessions(userId);

    const sessionId = crypto.randomUUID();
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + this.sessionConfig.sessionTimeout);

    const session: SecureSession = {
      id: sessionId,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      isActive: true,
    };

    // Store session in database
    const { error } = await this.supabase.from('secure_sessions').insert({
      id: session.id,
      user_id: session.userId,
      token: session.token,
      expires_at: session.expiresAt.toISOString(),
      created_at: session.createdAt.toISOString(),
      last_activity: session.lastActivity.toISOString(),
      ip_address: session.ipAddress,
      user_agent: session.userAgent,
      is_active: session.isActive,
    });

    if (error) {
      throw new Error(`Failed to create secure session: ${error.message}`);
    }

    // Log session creation
    await this.auditLogger.logEvent({
      action: 'session_created',
      userId,
      resource: 'secure_session',
      resourceId: sessionId,
      details: { ipAddress, userAgent },
      ipAddress,
      userAgent,
    });

    return session;
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<SecureSession | null> {
    const { data, error } = await this.supabase
      .from('secure_sessions')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    const session: SecureSession = {
      id: data.id,
      userId: data.user_id,
      token: data.token,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      lastActivity: new Date(data.last_activity),
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      isActive: data.is_active,
    };

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.invalidateSession(session.id);
      return null;
    }

    // Update last activity
    await this.updateLastActivity(session.id);

    return session;
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await this.supabase
      .from('secure_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    // Log session invalidation
    await this.auditLogger.logEvent({
      action: 'session_invalidated',
      resource: 'secure_session',
      resourceId: sessionId,
    });
  }

  /**
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.supabase
      .from('secure_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Log session invalidation
    await this.auditLogger.logEvent({
      action: 'all_sessions_invalidated',
      userId,
      resource: 'secure_session',
    });
  }

  /**
   * Update session last activity
   */
  private async updateLastActivity(sessionId: string): Promise<void> {
    await this.supabase
      .from('secure_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId);
  }

  /**
   * Clean up expired sessions
   */
  private async cleanupExpiredSessions(userId: string): Promise<void> {
    await this.supabase
      .from('secure_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString());
  }

  /**
   * Enforce maximum sessions per user
   */
  private async enforceMaxSessions(userId: string): Promise<void> {
    const { data: activeSessions } = await this.supabase
      .from('secure_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (
      activeSessions &&
      activeSessions.length >= this.sessionConfig.maxSessions
    ) {
      // Invalidate oldest sessions
      const sessionsToInvalidate = activeSessions.slice(
        0,
        activeSessions.length - this.sessionConfig.maxSessions + 1
      );
      for (const session of sessionsToInvalidate) {
        await this.invalidateSession(session.id);
      }
    }
  }

  /**
   * Generate secure token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate secure token for specific purpose
   */
  generateSecureTokenForPurpose(purpose: string, userId: string): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const data = `${purpose}:${userId}:${timestamp}:${randomBytes}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate secure token for specific purpose
   */
  async validateSecureTokenForPurpose(
    token: string,
    purpose: string,
    userId: string,
    maxAge: number = 3600000 // 1 hour
  ): Promise<boolean> {
    try {
      // This is a simplified validation - in practice, you'd store and validate tokens
      const now = Date.now();
      const tokenData = token.split(':');

      if (tokenData.length !== 4) {
        return false;
      }

      const [tokenPurpose, tokenUserId, timestamp, randomBytes] = tokenData;

      if (tokenPurpose !== purpose || tokenUserId !== userId) {
        return false;
      }

      const tokenTime = parseInt(timestamp);
      if (now - tokenTime > maxAge) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Monitor session activity
   */
  async monitorSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSessionById(sessionId);
    if (!session) {
      return;
    }

    const now = new Date();
    const timeSinceLastActivity =
      now.getTime() - session.lastActivity.getTime();
    const sessionAge = now.getTime() - session.createdAt.getTime();

    // Log suspicious activity
    if (timeSinceLastActivity > 2 * 60 * 60 * 1000) {
      // 2 hours
      await this.auditLogger.logEvent({
        action: 'suspicious_session_activity',
        userId: session.userId,
        resource: 'secure_session',
        resourceId: sessionId,
        details: {
          timeSinceLastActivity,
          sessionAge,
        },
      });
    }
  }

  /**
   * Get session by ID
   */
  private async getSessionById(
    sessionId: string
  ): Promise<SecureSession | null> {
    const { data, error } = await this.supabase
      .from('secure_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      token: data.token,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      lastActivity: new Date(data.last_activity),
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      isActive: data.is_active,
    };
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<SecureSession[]> {
    const { data, error } = await this.supabase
      .from('secure_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(session => ({
      id: session.id,
      userId: session.user_id,
      token: session.token,
      expiresAt: new Date(session.expires_at),
      createdAt: new Date(session.created_at),
      lastActivity: new Date(session.last_activity),
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      isActive: session.is_active,
    }));
  }

  /**
   * Force session timeout
   */
  async forceSessionTimeout(sessionId: string): Promise<void> {
    await this.supabase
      .from('secure_sessions')
      .update({
        is_active: false,
        expires_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // Log forced timeout
    await this.auditLogger.logEvent({
      action: 'session_forced_timeout',
      resource: 'secure_session',
      resourceId: sessionId,
    });
  }
}
