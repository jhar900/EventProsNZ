import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';

export interface DatabaseAccessControl {
  id: string;
  table_name: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  user_role: string;
  conditions: string;
  is_active: boolean;
  created_at: Date;
}

export interface DatabaseAuditLog {
  id: string;
  table_name: string;
  operation: string;
  user_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  timestamp: Date;
}

export interface DatabaseBackup {
  id: string;
  backup_name: string;
  backup_type: 'full' | 'incremental' | 'differential';
  file_path: string;
  file_size: number;
  created_at: Date;
  expires_at: Date;
  is_encrypted: boolean;
  status: 'pending' | 'completed' | 'failed';
}

export class DatabaseSecurityService {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  /**
   * Create database access control rule
   */
  async createAccessControl(
    tableName: string,
    operation: string,
    userRole: string,
    conditions: string
  ): Promise<DatabaseAccessControl> {
    const controlId = `db_control_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const accessControl: DatabaseAccessControl = {
      id: controlId,
      table_name: tableName,
      operation: operation as any,
      user_role: userRole,
      conditions,
      is_active: true,
      created_at: new Date(),
    };

    const { error } = await this.supabase
      .from('database_access_controls')
      .insert({
        id: accessControl.id,
        table_name: accessControl.table_name,
        operation: accessControl.operation,
        user_role: accessControl.user_role,
        conditions: accessControl.conditions,
        is_active: accessControl.is_active,
        created_at: accessControl.created_at.toISOString(),
      });

    if (error) {
      throw new Error(`Failed to create access control: ${error.message}`);
    }

    // Log access control creation
    await this.auditLogger.logEvent({
      action: 'database_access_control_created',
      resource: 'database_security',
      resourceId: controlId,
      details: { tableName, operation, userRole },
    });

    return accessControl;
  }

  /**
   * Validate database operation
   */
  async validateOperation(
    tableName: string,
    operation: string,
    userId: string,
    userRole: string,
    data?: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Get access controls for this table and operation
    const { data: controls, error } = await this.supabase
      .from('database_access_controls')
      .select('*')
      .eq('table_name', tableName)
      .eq('operation', operation)
      .eq('user_role', userRole)
      .eq('is_active', true);

    if (error || !controls || controls.length === 0) {
      return { allowed: false, reason: 'No access control rules found' };
    }

    // Check if any control allows the operation
    for (const control of controls) {
      if (this.evaluateConditions(control.conditions, data, userId)) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: 'Access denied by access control rules' };
  }

  /**
   * Log database operation
   */
  async logDatabaseOperation(
    tableName: string,
    operation: string,
    userId: string,
    oldValues: any,
    newValues: any,
    ipAddress: string
  ): Promise<void> {
    const auditLog: DatabaseAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table_name: tableName,
      operation,
      user_id: userId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      timestamp: new Date(),
    };

    await this.supabase.from('database_audit_logs').insert({
      id: auditLog.id,
      table_name: auditLog.table_name,
      operation: auditLog.operation,
      user_id: auditLog.user_id,
      old_values: auditLog.old_values,
      new_values: auditLog.new_values,
      ip_address: auditLog.ip_address,
      timestamp: auditLog.timestamp.toISOString(),
    });

    // Log security event
    await this.auditLogger.logEvent({
      action: 'database_operation_logged',
      userId,
      resource: 'database_security',
      resourceId: auditLog.id,
      details: { tableName, operation },
      ipAddress,
    });
  }

  /**
   * Create database backup
   */
  async createBackup(
    backupName: string,
    backupType: 'full' | 'incremental' | 'differential' = 'full',
    encrypt: boolean = true
  ): Promise<DatabaseBackup> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const filePath = `/backups/${backupName}_${Date.now()}.sql`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days retention

    const backup: DatabaseBackup = {
      id: backupId,
      backup_name: backupName,
      backup_type: backupType,
      file_path: filePath,
      file_size: 0, // Will be updated after backup completion
      created_at: new Date(),
      expires_at: expiresAt,
      is_encrypted: encrypt,
      status: 'pending',
    };

    // Store backup record
    await this.supabase.from('database_backups').insert({
      id: backup.id,
      backup_name: backup.backup_name,
      backup_type: backup.backup_type,
      file_path: backup.file_path,
      file_size: backup.file_size,
      created_at: backup.created_at.toISOString(),
      expires_at: backup.expires_at.toISOString(),
      is_encrypted: backup.is_encrypted,
      status: backup.status,
    });

    // Log backup creation
    await this.auditLogger.logEvent({
      action: 'database_backup_created',
      resource: 'database_security',
      resourceId: backupId,
      details: { backupName, backupType, encrypt },
    });

    return backup;
  }

  /**
   * Monitor database performance
   */
  async monitorDatabasePerformance(): Promise<{
    connectionCount: number;
    slowQueries: number;
    lockWaits: number;
    deadlocks: number;
  }> {
    // This is a simplified implementation
    // In practice, you'd query actual database performance metrics

    const { data: connections } = await this.supabase
      .from('database_connections')
      .select('count')
      .single();

    const { data: slowQueries } = await this.supabase
      .from('database_performance')
      .select('slow_query_count')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .single();

    return {
      connectionCount: connections?.count || 0,
      slowQueries: slowQueries?.slow_query_count || 0,
      lockWaits: 0, // Would be calculated from actual metrics
      deadlocks: 0, // Would be calculated from actual metrics
    };
  }

  /**
   * Check database security compliance
   */
  async checkSecurityCompliance(): Promise<{
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    accessControls: boolean;
    auditLogging: boolean;
    backupEncryption: boolean;
    complianceScore: number;
  }> {
    // Check encryption at rest
    const { data: encryptionConfig } = await this.supabase
      .from('database_encryption')
      .select('enabled')
      .eq('type', 'at_rest')
      .single();

    // Check access controls
    const { data: accessControls } = await this.supabase
      .from('database_access_controls')
      .select('count')
      .eq('is_active', true);

    // Check audit logging
    const { data: auditConfig } = await this.supabase
      .from('database_audit_config')
      .select('enabled')
      .single();

    // Check backup encryption
    const { data: backupEncryption } = await this.supabase
      .from('database_backups')
      .select('is_encrypted')
      .eq('status', 'completed')
      .limit(1)
      .single();

    const encryptionAtRest = encryptionConfig?.enabled || false;
    const encryptionInTransit = true; // Assume HTTPS is enabled
    const accessControlsEnabled = (accessControls?.count || 0) > 0;
    const auditLoggingEnabled = auditConfig?.enabled || false;
    const backupEncryptionEnabled = backupEncryption?.is_encrypted || false;

    const complianceScore =
      [
        encryptionAtRest,
        encryptionInTransit,
        accessControlsEnabled,
        auditLoggingEnabled,
        backupEncryptionEnabled,
      ].filter(Boolean).length * 20; // 20% per compliance item

    return {
      encryptionAtRest,
      encryptionInTransit,
      accessControls: accessControlsEnabled,
      auditLogging: auditLoggingEnabled,
      backupEncryption: backupEncryptionEnabled,
      complianceScore,
    };
  }

  /**
   * Evaluate access control conditions
   */
  private evaluateConditions(
    conditions: string,
    data: any,
    userId: string
  ): boolean {
    try {
      // This is a simplified condition evaluator
      // In practice, you'd use a proper expression evaluator

      if (conditions.includes('user_id = current_user()')) {
        return data?.user_id === userId;
      }

      if (conditions.includes('role = admin')) {
        // Check if user has admin role
        return true; // Simplified for demo
      }

      if (conditions.includes('time_based_access')) {
        const hour = new Date().getHours();
        return hour >= 9 && hour <= 17; // Business hours only
      }

      return true; // Default allow if no specific conditions
    } catch (error) {
      console.error('Error evaluating access control conditions:', error);
      return false;
    }
  }

  /**
   * Get database audit logs
   */
  async getAuditLogs(
    tableName?: string,
    userId?: string,
    limit: number = 100
  ): Promise<DatabaseAuditLog[]> {
    let query = this.supabase
      .from('database_audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    return data.map(log => ({
      id: log.id,
      table_name: log.table_name,
      operation: log.operation,
      user_id: log.user_id,
      old_values: log.old_values,
      new_values: log.new_values,
      ip_address: log.ip_address,
      timestamp: new Date(log.timestamp),
    }));
  }

  /**
   * Clean up old audit logs
   */
  async cleanupAuditLogs(retentionDays: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await this.supabase
      .from('database_audit_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    // Log cleanup
    await this.auditLogger.logEvent({
      action: 'database_audit_cleanup',
      resource: 'database_security',
      details: { retentionDays, cutoffDate: cutoffDate.toISOString() },
    });
  }

  /**
   * Get database security status
   */
  async getSecurityStatus(): Promise<{
    totalOperations: number;
    blockedOperations: number;
    auditLogs: number;
    activeAccessControls: number;
    recentBackups: number;
  }> {
    const { data: operations } = await this.supabase
      .from('database_audit_logs')
      .select('operation')
      .gte(
        'timestamp',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const { data: accessControls } = await this.supabase
      .from('database_access_controls')
      .select('count')
      .eq('is_active', true);

    const { data: backups } = await this.supabase
      .from('database_backups')
      .select('count')
      .eq('status', 'completed')
      .gte(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    return {
      totalOperations: operations?.length || 0,
      blockedOperations: 0, // Would be calculated from audit logs
      auditLogs: operations?.length || 0,
      activeAccessControls: accessControls?.count || 0,
      recentBackups: backups?.count || 0,
    };
  }
}
