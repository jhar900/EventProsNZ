// Document sharing types and interfaces

export interface Document {
  id: string;
  user_id: string;
  document_name: string;
  document_type: string;
  file_size: number;
  file_path: string;
  mime_type: string;
  document_category?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_by: string;
  shared_with: string;
  permission_level: PermissionLevel;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  file_size: number;
  change_summary?: string;
  created_by: string;
  created_at: string;
}

export interface DocumentAccess {
  id: string;
  document_id: string;
  user_id: string;
  access_type: AccessType;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface DocumentCategory {
  id: string;
  category_name: string;
  category_description?: string;
  created_by?: string;
  created_at: string;
}

export type PermissionLevel = 'view' | 'comment' | 'edit' | 'admin';
export type AccessType = 'view' | 'comment' | 'edit' | 'admin';

export interface DocumentMetadata {
  document_name: string;
  document_category?: string;
  is_public?: boolean;
}

export interface ShareData {
  shared_with: string;
  permission_level: PermissionLevel;
  expires_at?: string;
}

export interface PermissionData {
  user_id: string;
  access_type: AccessType;
  expires_at?: string;
}

export interface DocumentFilters {
  document_category?: string;
  is_public?: boolean;
  file_type?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  file_type: string;
  errors?: string[];
  security_scan: SecurityScanResult;
}

export interface SecurityScanResult {
  is_safe: boolean;
  clean: boolean;
  threats: string[];
  threats_detected: string[];
  scan_timestamp: string;
}

export interface PreviewData {
  preview_url: string;
  preview_type: string;
}

export interface DocumentUploadResponse {
  document: Document;
  success: boolean;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentDetailResponse {
  document: Document;
  versions: DocumentVersion[];
  shares: DocumentShare[];
}

export interface DocumentShareResponse {
  document_share: DocumentShare;
  success: boolean;
}

export interface DocumentVersionResponse {
  version: DocumentVersion;
  success: boolean;
}

export interface DocumentAccessResponse {
  permission: DocumentAccess;
  success: boolean;
}

export interface DocumentPreviewResponse {
  preview_url: string;
  preview_type: string;
}

export interface DocumentDownloadResponse {
  download_url: string;
  expires_at: string;
}

export interface DocumentCategoryResponse {
  category: DocumentCategory;
  success: boolean;
}

export interface DocumentSearchResponse {
  documents: Document[];
  total: number;
}

export interface DocumentValidationResponse {
  valid: boolean;
  file_type: string;
  security_scan: SecurityScanResult;
}

export interface DocumentScanResponse {
  security_scan: SecurityScanResult;
  success: boolean;
}
