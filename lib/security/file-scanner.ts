/**
 * Advanced File Security Scanner
 * Provides comprehensive file validation and malware detection
 */

import { createHash } from 'crypto';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    size: number;
    type: string;
    extension: string;
    mimeType: string;
    magicNumber: string;
    hash: string;
  };
  securityScan: {
    isClean: boolean;
    threats: string[];
    scanMethod: 'local' | 'cloud' | 'hybrid';
  };
}

export interface FileScanConfig {
  maxFileSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  enableLocalScanning: boolean;
  enableCloudScanning: boolean;
  quarantineSuspicious: boolean;
  scanTimeout: number;
}

export class FileSecurityScanner {
  private config: FileScanConfig;
  private magicNumbers: Map<string, string[]> = new Map();

  constructor(config: Partial<FileScanConfig> = {}) {
    this.config = {
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      allowedTypes: config.allowedTypes || [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      allowedExtensions: config.allowedExtensions || [
        '.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'
      ],
      enableLocalScanning: config.enableLocalScanning !== false,
      enableCloudScanning: config.enableCloudScanning !== false,
      quarantineSuspicious: config.quarantineSuspicious !== false,
      scanTimeout: config.scanTimeout || 30000, // 30 seconds
    };

    this.initializeMagicNumbers();
  }

  /**
   * Comprehensive file validation and security scan
   */
  async scanFile(file: File | Buffer, filename: string): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      fileInfo: {
        size: 0,
        type: '',
        extension: '',
        mimeType: '',
        magicNumber: '',
        hash: '',
      },
      securityScan: {
        isClean: false,
        threats: [],
        scanMethod: 'local',
      },
    };

    try {
      // Convert File to Buffer if needed
      const fileBuffer = file instanceof File ? await this.fileToBuffer(file) : file;
      
      // Basic file information
      result.fileInfo = await this.analyzeFile(fileBuffer, filename);
      
      // Size validation
      if (result.fileInfo.size > this.config.maxFileSize) {
        result.errors.push(`File size ${result.fileInfo.size} exceeds maximum allowed size ${this.config.maxFileSize}`);
        result.isValid = false;
      }

      // Type validation
      if (!this.config.allowedTypes.includes(result.fileInfo.mimeType)) {
        result.errors.push(`File type ${result.fileInfo.mimeType} is not allowed`);
        result.isValid = false;
      }

      // Extension validation
      if (!this.config.allowedExtensions.includes(result.fileInfo.extension.toLowerCase())) {
        result.errors.push(`File extension ${result.fileInfo.extension} is not allowed`);
        result.isValid = false;
      }

      // Magic number validation
      if (!this.validateMagicNumber(result.fileInfo.magicNumber, result.fileInfo.extension)) {
        result.errors.push('File content does not match file extension (possible spoofing)');
        result.isValid = false;
      }

      // Security scan
      if (result.isValid) {
        result.securityScan = await this.performSecurityScan(fileBuffer, filename);
        if (!result.securityScan.isClean) {
          result.isValid = false;
          result.errors.push(...result.securityScan.threats);
        }
      }

      // Image-specific validation
      if (result.fileInfo.mimeType.startsWith('image/')) {
        const imageValidation = await this.validateImage(fileBuffer);
        if (!imageValidation.isValid) {
          result.errors.push(...imageValidation.errors);
          result.isValid = false;
        }
      }

    } catch (error) {
      result.errors.push(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Process and optimize image files
   */
  async processImage(fileBuffer: Buffer, options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}): Promise<Buffer> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 85,
      format = 'jpeg'
    } = options;

    try {
      let processor = sharp(fileBuffer);

      // Resize if needed
      processor = processor.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality, progressive: true });
          break;
        case 'png':
          processor = processor.png({ quality, progressive: true });
          break;
        case 'webp':
          processor = processor.webp({ quality });
          break;
      }

      return await processor.toBuffer();
    } catch (error) {
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate secure filename
   */
  generateSecureFilename(originalName: string, fileHash: string): string {
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${fileHash.substring(0, 16)}_${timestamp}_${randomSuffix}.${extension}`;
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async analyzeFile(fileBuffer: Buffer, filename: string) {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const magicNumber = fileBuffer.subarray(0, 8).toString('hex');
    const hash = createHash('sha256').update(fileBuffer).digest('hex');
    
    // Detect MIME type from magic number
    const mimeType = this.detectMimeType(magicNumber);

    return {
      size: fileBuffer.length,
      type: mimeType,
      extension: `.${extension}`,
      mimeType,
      magicNumber,
      hash,
    };
  }

  private detectMimeType(magicNumber: string): string {
    const magicMap: Record<string, string> = {
      'ffd8ffe0': 'image/jpeg',
      'ffd8ffe1': 'image/jpeg',
      'ffd8ffe2': 'image/jpeg',
      '89504e47': 'image/png',
      '52494646': 'image/webp', // RIFF
      '25504446': 'application/pdf', // PDF
      'd0cf11e0': 'application/msword', // DOC
      '504b0304': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    };

    // Check for exact matches first
    if (magicMap[magicNumber]) {
      return magicMap[magicNumber];
    }

    // Check for partial matches
    for (const [magic, mimeType] of Object.entries(magicMap)) {
      if (magicNumber.startsWith(magic)) {
        return mimeType;
      }
    }

    return 'application/octet-stream';
  }

  private validateMagicNumber(magicNumber: string, extension: string): boolean {
    const expectedMagicNumbers = this.magicNumbers.get(extension.toLowerCase());
    if (!expectedMagicNumbers) return true;

    return expectedMagicNumbers.some(magic => magicNumber.startsWith(magic));
  }

  private async performSecurityScan(fileBuffer: Buffer, filename: string): Promise<{
    isClean: boolean;
    threats: string[];
    scanMethod: 'local' | 'cloud' | 'hybrid';
  }> {
    const threats: string[] = [];
    let scanMethod: 'local' | 'cloud' | 'hybrid' = 'local';

    // Local scanning
    if (this.config.enableLocalScanning) {
      const localScan = await this.performLocalScan(fileBuffer, filename);
      threats.push(...localScan.threats);
    }

    // Cloud scanning (if enabled and local scan passed)
    if (this.config.enableCloudScanning && threats.length === 0) {
      try {
        const cloudScan = await this.performCloudScan(fileBuffer, filename);
        threats.push(...cloudScan.threats);
        scanMethod = this.config.enableLocalScanning ? 'hybrid' : 'cloud';
      } catch (error) {
        console.warn('Cloud scan failed, relying on local scan:', error);
      }
    }

    return {
      isClean: threats.length === 0,
      threats,
      scanMethod,
    };
  }

  private async performLocalScan(fileBuffer: Buffer, filename: string): Promise<{ threats: string[] }> {
    const threats: string[] = [];

    try {
      // Check for suspicious patterns
      const content = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 1024));
      
      // Check for executable signatures
      const executableSignatures = [
        'MZ', // PE executable
        'ELF', // Linux executable
        '#!/', // Shell script
        '<?php', // PHP script
        '<script', // JavaScript
      ];

      for (const signature of executableSignatures) {
        if (content.includes(signature)) {
          threats.push(`Suspicious executable signature detected: ${signature}`);
        }
      }

      // Check for suspicious file extensions in content
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
      for (const ext of suspiciousExtensions) {
        if (content.toLowerCase().includes(ext)) {
          threats.push(`Suspicious file extension reference: ${ext}`);
        }
      }

      // Check file size vs content ratio (potential steganography)
      if (fileBuffer.length > 1024 * 1024) { // > 1MB
        const textContent = fileBuffer.toString('utf8');
        const textRatio = textContent.length / fileBuffer.length;
        if (textRatio > 0.1) { // More than 10% text content
          threats.push('Suspicious file: high text content ratio in binary file');
        }
      }

    } catch (error) {
      console.warn('Local scan error:', error);
    }

    return { threats };
  }

  private async performCloudScan(fileBuffer: Buffer, filename: string): Promise<{ threats: string[] }> {
    const threats: string[] = [];

    try {
      // This would integrate with a cloud security service
      // For now, we'll simulate a cloud scan
      const response = await fetch('https://www.virustotal.com/vtapi/v2/file/scan', {
        method: 'POST',
        headers: {
          'apikey': process.env.VIRUSTOTAL_API_KEY || '',
        },
        body: fileBuffer,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.response_code === 1 && result.positives > 0) {
          threats.push(`Cloud scan detected ${result.positives} threats`);
        }
      }
    } catch (error) {
      console.warn('Cloud scan failed:', error);
    }

    return { threats };
  }

  private async validateImage(fileBuffer: Buffer): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const metadata = await sharp(fileBuffer).metadata();
      
      // Check image dimensions
      if (metadata.width && metadata.height) {
        if (metadata.width > 8000 || metadata.height > 8000) {
          errors.push('Image dimensions too large');
        }
        if (metadata.width < 10 || metadata.height < 10) {
          errors.push('Image dimensions too small');
        }
      }

      // Check for suspicious metadata
      if (metadata.exif) {
        // Check for GPS data (potential privacy concern)
        if (metadata.exif.GPS) {
          errors.push('Image contains GPS metadata (privacy concern)');
        }
      }

    } catch (error) {
      errors.push(`Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private initializeMagicNumbers(): void {
    this.magicNumbers.set('.jpg', ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2']);
    this.magicNumbers.set('.jpeg', ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2']);
    this.magicNumbers.set('.png', ['89504e47']);
    this.magicNumbers.set('.webp', ['52494646']);
    this.magicNumbers.set('.pdf', ['25504446']);
    this.magicNumbers.set('.doc', ['d0cf11e0']);
    this.magicNumbers.set('.docx', ['504b0304']);
  }
}

// Singleton instance
let fileScanner: FileSecurityScanner | null = null;

export function getFileScanner(): FileSecurityScanner {
  if (!fileScanner) {
    fileScanner = new FileSecurityScanner();
  }
  return fileScanner;
}
