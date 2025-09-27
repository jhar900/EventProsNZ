import { createClient } from '@/lib/supabase/server';

/**
 * Version cleanup service to manage event version history growth
 * Prevents performance issues from unlimited version accumulation
 */
export class VersionCleanupService {
  private static readonly MAX_VERSIONS_PER_EVENT = 50;
  private static readonly ARCHIVE_THRESHOLD = 20;
  private static readonly CLEANUP_BATCH_SIZE = 100;

  /**
   * Clean up old versions for a specific event
   * @param eventId - The event ID to clean up
   * @param keepLatest - Number of latest versions to keep (default: 10)
   * @returns Cleanup result
   */
  static async cleanupEventVersions(
    eventId: string,
    keepLatest: number = 10
  ): Promise<{
    deleted: number;
    archived: number;
    remaining: number;
  }> {
    try {
      const supabase = await createClient();

      // Get all versions for the event, ordered by creation date
      const { data: versions, error: fetchError } = await supabase
        .from('event_versions')
        .select('id, version_number, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error('Failed to fetch versions');
      }

      if (!versions || versions.length <= keepLatest) {
        return { deleted: 0, archived: 0, remaining: versions?.length || 0 };
      }

      const versionsToDelete = versions.slice(keepLatest);
      const versionIdsToDelete = versionsToDelete.map(v => v.id);

      // Delete old versions
      const { error: deleteError } = await supabase
        .from('event_versions')
        .delete()
        .in('id', versionIdsToDelete);

      if (deleteError) {
        throw new Error('Failed to delete versions');
      }

      return {
        deleted: versionIdsToDelete.length,
        archived: 0,
        remaining: keepLatest,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clean up old versions across all events
   * @param batchSize - Number of events to process at once
   * @returns Cleanup summary
   */
  static async cleanupAllEventVersions(
    batchSize: number = this.CLEANUP_BATCH_SIZE
  ): Promise<{
    eventsProcessed: number;
    totalDeleted: number;
    totalArchived: number;
    errors: string[];
  }> {
    try {
      const supabase = await createClient();
      const errors: string[] = [];
      let eventsProcessed = 0;
      let totalDeleted = 0;
      let totalArchived = 0;

      // Get events with version counts
      const { data: eventsWithVersions, error: fetchError } = await supabase
        .from('events')
        .select(
          `
          id,
          event_versions!inner(count)
        `
        )
        .limit(batchSize);

      if (fetchError) {
        throw new Error('Failed to fetch events');
      }

      if (!eventsWithVersions) {
        return {
          eventsProcessed: 0,
          totalDeleted: 0,
          totalArchived: 0,
          errors: [],
        };
      }

      // Process each event
      for (const event of eventsWithVersions) {
        try {
          const result = await this.cleanupEventVersions(event.id);
          totalDeleted += result.deleted;
          totalArchived += result.archived;
          eventsProcessed++;
        } catch (error) {
          const errorMessage = `Failed to cleanup event ${event.id}: ${error.message}`;
          errors.push(errorMessage);
        }
      }

      return {
        eventsProcessed,
        totalDeleted,
        totalArchived,
        errors,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Archive old versions to cold storage
   * @param eventId - The event ID to archive versions for
   * @param archiveThreshold - Number of versions to keep before archiving
   * @returns Archive result
   */
  static async archiveOldVersions(
    eventId: string,
    archiveThreshold: number = this.ARCHIVE_THRESHOLD
  ): Promise<{
    archived: number;
    remaining: number;
  }> {
    try {
      const supabase = await createClient();

      // Get versions beyond the archive threshold
      const { data: versionsToArchive, error: fetchError } = await supabase
        .from('event_versions')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .range(archiveThreshold, this.MAX_VERSIONS_PER_EVENT);

      if (fetchError) {
        throw new Error('Failed to fetch versions to archive');
      }

      if (!versionsToArchive || versionsToArchive.length === 0) {
        return { archived: 0, remaining: 0 };
      }

      // In a real implementation, you would:
      // 1. Upload to cold storage (S3, etc.)
      // 2. Update database with archive location
      // 3. Delete from active storage

      // For now, we'll just mark them as archived
      const { error: archiveError } = await supabase
        .from('event_versions')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
        })
        .in(
          'id',
          versionsToArchive.map(v => v.id)
        );

      if (archiveError) {
        throw new Error('Failed to archive versions');
      }

      return {
        archived: versionsToArchive.length,
        remaining: archiveThreshold,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get version statistics for monitoring
   * @returns Version statistics
   */
  static async getVersionStatistics(): Promise<{
    totalVersions: number;
    eventsWithManyVersions: number;
    averageVersionsPerEvent: number;
    oldestVersion: string | null;
    newestVersion: string | null;
  }> {
    try {
      const supabase = await createClient();

      // Get total version count
      const { count: totalVersions, error: countError } = await supabase
        .from('event_versions')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error('Failed to get version count');
      }

      // Get events with many versions
      const { data: eventsWithManyVersions, error: eventsError } =
        await supabase
          .from('event_versions')
          .select('event_id')
          .gte('version_number', this.MAX_VERSIONS_PER_EVENT);

      if (eventsError) {
        throw new Error('Failed to get events with many versions');
      }

      // Get version date range
      const { data: dateRange, error: dateError } = await supabase
        .from('event_versions')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);

      const { data: newestDate, error: newestError } = await supabase
        .from('event_versions')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (dateError || newestError) {
        throw new Error('Failed to get version date range');
      }

      return {
        totalVersions: totalVersions || 0,
        eventsWithManyVersions: eventsWithManyVersions?.length || 0,
        averageVersionsPerEvent: 0, // Would need additional query to calculate
        oldestVersion: dateRange?.[0]?.created_at || null,
        newestVersion: newestDate?.[0]?.created_at || null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Schedule automatic cleanup (to be called by cron job)
   * @returns Cleanup result
   */
  static async scheduleCleanup(): Promise<{
    success: boolean;
    message: string;
    statistics: any;
  }> {
    try {
      // Get current statistics
      const statistics = await this.getVersionStatistics();
      // Only run cleanup if there are many versions
      if (statistics.totalVersions < 1000) {
        return {
          success: true,
          message: 'No cleanup needed - version count is within limits',
          statistics,
        };
      }

      // Run cleanup
      const cleanupResult = await this.cleanupAllEventVersions();
      return {
        success: true,
        message: `Cleanup completed: ${cleanupResult.totalDeleted} versions deleted`,
        statistics: {
          ...statistics,
          ...cleanupResult,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Cleanup failed: ${error.message}`,
        statistics: null,
      };
    }
  }
}
