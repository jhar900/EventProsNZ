import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { AuditLogger } from './audit-logger';

export interface FileSecurityScan {
  id: string;
  file_id: string;
  scan_status: 'pending' | 'scanning' | 'clean' | 'infected' | 'quarantined';
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  scan_results: any;
  created_at: Date;
  updated_at: Date;
}

export interface FileQuarantine {
  id: string;
  file_id: string;
  quarantine_reason: string;
  threat_detected: string;
  quarantined_at: Date;
  released_at?: Date;
  is_active: boolean;
}

export interface FileAccessControl {
  id: string;
  file_id: string;
  user_id: string;
  access_level: 'read' | 'write' | 'admin';
  expires_at?: Date;
  created_at: Date;
}

export class FileUploadSecurity {
  private supabase = createClient();
  private auditLogger = new AuditLogger();

  private readonly allowedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly maxFilesPerUpload = 10;

  private readonly suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  /**
   * Validate file upload
   */
  async validateFileUpload(
    file: File,
    userId: string,
    ipAddress?: string
  ): Promise<{
    valid: boolean;
    errors: string[];
    fileId: string;
  }> {
    const fileId = crypto.randomUUID();
    const errors: string[] = [];

    // File type validation
    if (!this.allowedFileTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // File size validation
    if (file.size > this.maxFileSize) {
      errors.push(
        `File size ${file.size} exceeds maximum allowed size of ${this.maxFileSize}`
      );
    }

    // File name validation
    if (!this.isValidFileName(file.name)) {
      errors.push('Invalid file name');
    }

    // Check for suspicious content
    const contentCheck = await this.checkFileContent(file);
    if (!contentCheck.safe) {
      errors.push(`Suspicious content detected: ${contentCheck.reason}`);
    }

    // Log file upload attempt
    await this.auditLogger.logEvent({
      action: 'file_upload_attempt',
      userId,
      resource: 'file_security',
      resourceId: fileId,
      details: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        valid: errors.length === 0,
      },
      ipAddress,
    });

    return {
      valid: errors.length === 0,
      errors,
      fileId,
    };
  }

  /**
   * Scan file for malware
   */
  async scanFile(
    fileId: string,
    fileBuffer: Buffer
  ): Promise<FileSecurityScan> {
    const scanId = crypto.randomUUID();

    const scan: FileSecurityScan = {
      id: scanId,
      file_id: fileId,
      scan_status: 'scanning',
      threat_level: 'low',
      scan_results: {},
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Store initial scan record
    await this.supabase.from('file_security_scans').insert({
      id: scan.id,
      file_id: scan.file_id,
      scan_status: scan.scan_status,
      threat_level: scan.threat_level,
      scan_results: scan.scan_results,
      created_at: scan.created_at.toISOString(),
      updated_at: scan.updated_at.toISOString(),
    });

    try {
      // Perform security scan
      const scanResults = await this.performSecurityScan(fileBuffer);

      scan.scan_status = scanResults.threats.length > 0 ? 'infected' : 'clean';
      scan.threat_level = this.calculateThreatLevel(scanResults.threats);
      scan.scan_results = scanResults;

      // Update scan record
      await this.supabase
        .from('file_security_scans')
        .update({
          scan_status: scan.scan_status,
          threat_level: scan.threat_level,
          scan_results: scan.scan_results,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scan.id);

      // If threats detected, quarantine file
      if (scan.scan_status === 'infected') {
        await this.quarantineFile(fileId, scanResults.threats);
      }

      // Log scan results
      await this.auditLogger.logEvent({
        action: 'file_security_scan',
        resource: 'file_security',
        resourceId: fileId,
        details: {
          scanStatus: scan.scan_status,
          threatLevel: scan.threat_level,
          threatsDetected: scanResults.threats.length,
        },
      });
    } catch (error) {
      scan.scan_status = 'infected';
      scan.threat_level = 'high';
      scan.scan_results = { error: 'Scan failed', details: error.message };

      await this.supabase
        .from('file_security_scans')
        .update({
          scan_status: scan.scan_status,
          threat_level: scan.threat_level,
          scan_results: scan.scan_results,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scan.id);
    }

    return scan;
  }

  /**
   * Quarantine file
   */
  async quarantineFile(
    fileId: string,
    threats: string[]
  ): Promise<FileQuarantine> {
    const quarantineId = crypto.randomUUID();

    const quarantine: FileQuarantine = {
      id: quarantineId,
      file_id: fileId,
      quarantine_reason: 'Security threat detected',
      threat_detected: threats.join(', '),
      quarantined_at: new Date(),
      is_active: true,
    };

    await this.supabase.from('file_quarantine').insert({
      id: quarantine.id,
      file_id: quarantine.file_id,
      quarantine_reason: quarantine.quarantine_reason,
      threat_detected: quarantine.threat_detected,
      quarantined_at: quarantine.quarantined_at.toISOString(),
      is_active: quarantine.is_active,
    });

    // Log quarantine event
    await this.auditLogger.logEvent({
      action: 'file_quarantined',
      resource: 'file_security',
      resourceId: fileId,
      details: {
        quarantineReason: quarantine.quarantine_reason,
        threatsDetected: threats,
      },
    });

    return quarantine;
  }

  /**
   * Release file from quarantine
   */
  async releaseFromQuarantine(fileId: string, reason: string): Promise<void> {
    await this.supabase
      .from('file_quarantine')
      .update({
        is_active: false,
        released_at: new Date().toISOString(),
      })
      .eq('file_id', fileId);

    // Log release event
    await this.auditLogger.logEvent({
      action: 'file_quarantine_released',
      resource: 'file_security',
      resourceId: fileId,
      details: { reason },
    });
  }

  /**
   * Set file access controls
   */
  async setFileAccessControl(
    fileId: string,
    userId: string,
    accessLevel: 'read' | 'write' | 'admin',
    expiresAt?: Date
  ): Promise<FileAccessControl> {
    const controlId = crypto.randomUUID();

    const accessControl: FileAccessControl = {
      id: controlId,
      file_id: fileId,
      user_id: userId,
      access_level: accessLevel,
      expires_at: expiresAt,
      created_at: new Date(),
    };

    await this.supabase.from('file_access_controls').insert({
      id: accessControl.id,
      file_id: accessControl.file_id,
      user_id: accessControl.user_id,
      access_level: accessControl.access_level,
      expires_at: accessControl.expires_at?.toISOString(),
      created_at: accessControl.created_at.toISOString(),
    });

    return accessControl;
  }

  /**
   * Check file access permissions
   */
  async checkFileAccess(
    fileId: string,
    userId: string
  ): Promise<{
    hasAccess: boolean;
    accessLevel?: string;
    reason?: string;
  }> {
    const { data: accessControl, error } = await this.supabase
      .from('file_access_controls')
      .select('*')
      .eq('file_id', fileId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !accessControl) {
      return { hasAccess: false, reason: 'No access control found' };
    }

    // Check if access has expired
    if (
      accessControl.expires_at &&
      new Date(accessControl.expires_at) < new Date()
    ) {
      return { hasAccess: false, reason: 'Access has expired' };
    }

    return {
      hasAccess: true,
      accessLevel: accessControl.access_level,
    };
  }

  /**
   * Check file content for suspicious patterns
   */
  private async checkFileContent(file: File): Promise<{
    safe: boolean;
    reason?: string;
  }> {
    try {
      const content = await file.text();

      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(content)) {
          return {
            safe: false,
            reason: `Suspicious pattern detected: ${pattern.source}`,
          };
        }
      }

      return { safe: true };
    } catch (error) {
      return {
        safe: false,
        reason: 'Unable to read file content',
      };
    }
  }

  /**
   * Perform security scan
   */
  private async performSecurityScan(fileBuffer: Buffer): Promise<{
    threats: string[];
    scanDetails: any;
  }> {
    const threats: string[] = [];
    const scanDetails: any = {};

    // Check for executable signatures
    const fileHeader = fileBuffer.slice(0, 4);
    const executableSignatures = [
      Buffer.from([0x4d, 0x5a]), // PE executable
      Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF executable
      Buffer.from([0xca, 0xfe, 0xba, 0xbe]), // Java class file
    ];

    for (const signature of executableSignatures) {
      if (fileHeader.includes(signature)) {
        threats.push('Executable file detected');
        break;
      }
    }

    // Check for script injection patterns
    const content = fileBuffer.toString(
      'utf8',
      0,
      Math.min(fileBuffer.length, 1024)
    );
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        threats.push(`Script injection pattern: ${pattern.source}`);
      }
    }

    // Check file size anomalies
    if (fileBuffer.length > this.maxFileSize) {
      threats.push('File size exceeds maximum allowed');
    }

    scanDetails.fileSize = fileBuffer.length;
    scanDetails.scanTimestamp = new Date().toISOString();
    scanDetails.threatsFound = threats.length;

    return { threats, scanDetails };
  }

  /**
   * Calculate threat level
   */
  private calculateThreatLevel(
    threats: string[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.length === 0) return 'low';
    if (threats.length <= 2) return 'medium';
    if (threats.length <= 5) return 'high';
    return 'critical';
  }

  /**
   * Validate file name
   */
  private isValidFileName(fileName: string): boolean {
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      return false;
    }

    // Check for reserved names
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ];
    const nameWithoutExt = fileName.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      return false;
    }

    // Check length
    if (fileName.length > 255) {
      return false;
    }

    return true;
  }

  /**
   * Get file security status
   */
  async getFileSecurityStatus(): Promise<{
    totalFiles: number;
    scannedFiles: number;
    quarantinedFiles: number;
    cleanFiles: number;
    infectedFiles: number;
  }> {
    const { data: scans } = await this.supabase
      .from('file_security_scans')
      .select('scan_status')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    const { data: quarantine } = await this.supabase
      .from('file_quarantine')
      .select('count')
      .eq('is_active', true);

    const scannedFiles = scans?.length || 0;
    const cleanFiles =
      scans?.filter(s => s.scan_status === 'clean').length || 0;
    const infectedFiles =
      scans?.filter(s => s.scan_status === 'infected').length || 0;
    const quarantinedFiles = quarantine?.count || 0;

    return {
      totalFiles: scannedFiles,
      scannedFiles,
      quarantinedFiles,
      cleanFiles,
      infectedFiles,
    };
  }

  /**
   * Clean up old scan results
   */
  async cleanupOldScans(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await this.supabase
      .from('file_security_scans')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    // Log cleanup
    await this.auditLogger.logEvent({
      action: 'file_security_cleanup',
      resource: 'file_security',
      details: { retentionDays, cutoffDate: cutoffDate.toISOString() },
    });
  }
}
