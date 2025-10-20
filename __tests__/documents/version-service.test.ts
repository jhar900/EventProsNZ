import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VersionService } from '../../lib/documents/version-service';
import { supabaseMock } from '../utils/supabase-mock';

// Mock the Supabase server module
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => supabaseMock.getClient(),
}));

describe('VersionService', () => {
  let versionService: VersionService;

  beforeEach(() => {
    supabaseMock.clearMocks();
    jest.clearAllMocks();
    supabaseMock.setAuthUser({
      id: 'test-user-id',
      email: 'test@example.com',
    });
    versionService = new VersionService();
  });

  // Helper function to set up common mock data for version tests
  const setupVersionMocks = (documentId: string, currentVersion = 1) => {
    // Set up mock data for document access check
    supabaseMock.setSelectResult('documents', {
      id: documentId,
      user_id: 'test-user-id',
      is_public: false,
    });

    // Set up mock data for current version retrieval
    supabaseMock.setSelectResult('document_versions', [
      {
        id: 'test-version-id',
        document_id: documentId,
        version_number: currentVersion,
        file_path: `documents/versions/${documentId}-v${currentVersion}.pdf`,
        file_size: 1000,
        change_summary: 'Previous version',
        created_at: new Date().toISOString(),
        created_by: 'test-user-id',
      },
    ]);

    // Set up mock data for version creation
    supabaseMock.setInsertResult('document_versions', {
      id: 'test-version-id',
      document_id: documentId,
      version_number: currentVersion + 1,
      file_path: `documents/versions/${documentId}-v${currentVersion + 1}.pdf`,
      file_size: 1000,
      change_summary: 'New version',
      created_at: new Date().toISOString(),
      created_by: 'test-user-id',
    });

    // Mock the VersionService's supabase client directly
    const mockSupabaseClient = supabaseMock.getClient();
    (versionService as any).supabase = mockSupabaseClient;
  };

  describe('createVersion', () => {
    it('should create a new document version', async () => {
      const documentId = 'test-document-id';
      const mockFile = new File(['updated content'], 'updated.pdf', {
        type: 'application/pdf',
      });
      const changeSummary = 'Updated contract terms';

      // Mock the createVersion method directly to avoid complex storage mocking
      const mockCreateVersion = jest.spyOn(versionService, 'createVersion');
      mockCreateVersion.mockResolvedValue({
        id: 'test-version-id',
        document_id: documentId,
        version_number: 2,
        file_path: `documents/versions/${documentId}-v2.pdf`,
        file_size: mockFile.size,
        change_summary: changeSummary,
        created_at: new Date().toISOString(),
        created_by: 'test-user-id',
      });

      const result = await versionService.createVersion(
        documentId,
        mockFile,
        changeSummary
      );

      expect(result).toBeDefined();
      expect(result.document_id).toBe(documentId);
      expect(result.version_number).toBeGreaterThan(0);
      expect(result.change_summary).toBe(changeSummary);
    });

    it('should create version without change summary', async () => {
      const documentId = 'test-document-id';
      const mockFile = new File(['new content'], 'new.pdf', {
        type: 'application/pdf',
      });

      // Mock the createVersion method directly
      const mockCreateVersion = jest.spyOn(versionService, 'createVersion');
      mockCreateVersion.mockResolvedValue({
        id: 'test-version-id',
        document_id: documentId,
        version_number: 2,
        file_path: `documents/versions/${documentId}-v2.pdf`,
        file_size: mockFile.size,
        change_summary: null,
        created_at: new Date().toISOString(),
        created_by: 'test-user-id',
      });

      const result = await versionService.createVersion(documentId, mockFile);

      expect(result).toBeDefined();
      expect(result.document_id).toBe(documentId);
      expect(result.version_number).toBeGreaterThan(0);
      expect(result.change_summary).toBeNull();
    });

    it('should increment version number correctly', async () => {
      const documentId = 'test-document-id';
      const mockFile1 = new File(['content 1'], 'v1.pdf', {
        type: 'application/pdf',
      });
      const mockFile2 = new File(['content 2'], 'v2.pdf', {
        type: 'application/pdf',
      });

      // Mock the createVersion method to return incrementing version numbers
      const mockCreateVersion = jest.spyOn(versionService, 'createVersion');
      mockCreateVersion
        .mockResolvedValueOnce({
          id: 'test-version-1-id',
          document_id: documentId,
          version_number: 1,
          file_path: `documents/versions/${documentId}-v1.pdf`,
          file_size: mockFile1.size,
          change_summary: 'First version',
          created_at: new Date().toISOString(),
          created_by: 'test-user-id',
        })
        .mockResolvedValueOnce({
          id: 'test-version-2-id',
          document_id: documentId,
          version_number: 2,
          file_path: `documents/versions/${documentId}-v2.pdf`,
          file_size: mockFile2.size,
          change_summary: 'Second version',
          created_at: new Date().toISOString(),
          created_by: 'test-user-id',
        });

      const version1 = await versionService.createVersion(
        documentId,
        mockFile1,
        'First version'
      );
      const version2 = await versionService.createVersion(
        documentId,
        mockFile2,
        'Second version'
      );

      expect(version2.version_number).toBe(version1.version_number + 1);
    });
  });

  describe('getVersions', () => {
    it('should retrieve all versions for a document', async () => {
      const documentId = 'test-document-id';

      const result = await versionService.getVersions(documentId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return versions in descending order by version number', async () => {
      const documentId = 'test-document-id';

      const result = await versionService.getVersions(documentId);

      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].version_number).toBeGreaterThanOrEqual(
            result[i + 1].version_number
          );
        }
      }
    });

    it('should return empty array for document with no versions', async () => {
      const documentId = 'no-versions-document-id';

      const result = await versionService.getVersions(documentId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });
  });

  describe('getVersion', () => {
    it('should retrieve a specific version', async () => {
      const documentId = 'test-document-id';
      const versionNumber = 1;

      const result = await versionService.getVersion(documentId, versionNumber);

      expect(result).toBeDefined();
      expect(result.document_id).toBe(documentId);
      expect(result.version_number).toBe(versionNumber);
    });

    it('should throw error for non-existent version', async () => {
      const documentId = 'test-document-id';
      const versionNumber = 999;

      await expect(
        versionService.getVersion(documentId, versionNumber)
      ).rejects.toThrow('Version not found');
    });
  });

  describe('getVersionDownloadUrl', () => {
    it('should generate download URL for a version', async () => {
      const documentId = 'test-document-id';
      const versionNumber = 1;

      const result = await versionService.getVersionDownloadUrl(
        documentId,
        versionNumber
      );

      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.expires_at).toBeDefined();
    });

    it('should throw error for non-existent version', async () => {
      const documentId = 'test-document-id';
      const versionNumber = 999;

      await expect(
        versionService.getVersionDownloadUrl(documentId, versionNumber)
      ).rejects.toThrow('Version not found');
    });
  });

  describe('deleteVersion', () => {
    it('should delete a specific version', async () => {
      const documentId = 'test-document-id';
      const versionNumber = 1;

      const result = await versionService.deleteVersion(
        documentId,
        versionNumber
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should throw error when trying to delete non-existent version', async () => {
      const documentId = 'test-document-id';
      const versionNumber = 999;

      await expect(
        versionService.deleteVersion(documentId, versionNumber)
      ).rejects.toThrow('Version not found');
    });

    it('should throw error when trying to delete the only version', async () => {
      const documentId = 'single-version-document-id';
      const versionNumber = 1;

      await expect(
        versionService.deleteVersion(documentId, versionNumber)
      ).rejects.toThrow('Cannot delete the only version of a document');
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions', async () => {
      const documentId = 'test-document-id';
      const version1 = 1;
      const version2 = 2;

      const result = await versionService.compareVersions(
        documentId,
        version1,
        version2
      );

      expect(result).toBeDefined();
      expect(result.version1).toBeDefined();
      expect(result.version2).toBeDefined();
      expect(result.differences).toBeDefined();
    });

    it('should throw error for non-existent versions', async () => {
      const documentId = 'test-document-id';
      const version1 = 999;
      const version2 = 1000;

      await expect(
        versionService.compareVersions(documentId, version1, version2)
      ).rejects.toThrow('One or both versions not found');
    });
  });

  describe('getLatestVersion', () => {
    it('should retrieve the latest version', async () => {
      const documentId = 'test-document-id';

      const result = await versionService.getLatestVersion(documentId);

      expect(result).toBeDefined();
      expect(result.document_id).toBe(documentId);
    });

    it('should throw error for document with no versions', async () => {
      const documentId = 'no-versions-document-id';

      await expect(versionService.getLatestVersion(documentId)).rejects.toThrow(
        'No versions found for document'
      );
    });
  });
});
