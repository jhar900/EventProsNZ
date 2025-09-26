import { createClient } from '@/lib/supabase/server';
import { AvailabilityResult, AvailabilityConflict } from '@/types/matching';

export class AvailabilityService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Check contractor availability for a specific date and duration
   */
  async checkAvailability(
    contractorId: string,
    eventDate: string,
    duration: number = 8
  ): Promise<AvailabilityResult> {
    try {
      // Check if contractor is available on the event date
      const { data: availability, error } = await this.supabase
        .from('contractor_availability')
        .select('*')
        .eq('contractor_id', contractorId)
        .eq('event_date', eventDate)
        .eq('is_available', true);

      if (error) {
        console.error('Error checking availability:', error);
        return this.createUnavailableResult(contractorId, eventDate, [
          {
            id: 'error',
            event_date: eventDate,
            start_time: '00:00',
            end_time: '23:59',
            conflict_type: 'unavailable',
            description: 'Error checking availability',
          },
        ]);
      }

      const isAvailable = availability && availability.length > 0;
      const conflicts: AvailabilityConflict[] = [];

      if (!isAvailable) {
        conflicts.push({
          id: 'unavailable',
          event_date: eventDate,
          start_time: '00:00',
          end_time: '23:59',
          conflict_type: 'unavailable',
          description: 'Contractor is not available on this date',
        });
      } else {
        // Check for time conflicts
        const timeConflicts = await this.checkTimeConflicts(
          contractorId,
          eventDate,
          duration
        );
        conflicts.push(...timeConflicts);
      }

      return {
        contractor_id: contractorId,
        available: isAvailable && conflicts.length === 0,
        conflicts,
        availability_score: isAvailable && conflicts.length === 0 ? 1.0 : 0.0,
      };
    } catch (error) {
      console.error('Error in availability check:', error);
      return this.createUnavailableResult(contractorId, eventDate, [
        {
          id: 'error',
          event_date: eventDate,
          start_time: '00:00',
          end_time: '23:59',
          conflict_type: 'unavailable',
          description: 'Error checking availability',
        },
      ]);
    }
  }

  /**
   * Check availability for multiple contractors
   */
  async checkMultipleAvailability(
    contractorIds: string[],
    eventDate: string,
    duration: number = 8
  ): Promise<AvailabilityResult[]> {
    const results = await Promise.all(
      contractorIds.map(id => this.checkAvailability(id, eventDate, duration))
    );

    return results;
  }

  /**
   * Set contractor availability
   */
  async setAvailability(
    contractorId: string,
    eventDate: string,
    startTime: string,
    endTime: string,
    isAvailable: boolean,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('contractor_availability')
        .upsert({
          contractor_id: contractorId,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          is_available: isAvailable,
          notes,
        });

      if (error) {
        console.error('Error setting availability:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setAvailability:', error);
      return false;
    }
  }

  /**
   * Get contractor availability for a date range
   */
  async getAvailabilityRange(
    contractorId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityResult[]> {
    try {
      const { data: availability, error } = await this.supabase
        .from('contractor_availability')
        .select('*')
        .eq('contractor_id', contractorId)
        .gte('event_date', startDate)
        .lte('event_date', endDate)
        .order('event_date');

      if (error) {
        console.error('Error fetching availability range:', error);
        return [];
      }

      return (availability || []).map(avail => ({
        contractor_id: contractorId,
        available: avail.is_available,
        conflicts: [],
        availability_score: avail.is_available ? 1.0 : 0.0,
      }));
    } catch (error) {
      console.error('Error in getAvailabilityRange:', error);
      return [];
    }
  }

  private async checkTimeConflicts(
    contractorId: string,
    eventDate: string,
    duration: number
  ): Promise<AvailabilityConflict[]> {
    try {
      // Check for existing bookings on the same date
      const { data: bookings, error } = await this.supabase
        .from('contractor_availability')
        .select('*')
        .eq('contractor_id', contractorId)
        .eq('event_date', eventDate)
        .eq('is_available', false);

      if (error || !bookings) {
        return [];
      }

      return bookings.map(booking => ({
        id: booking.id,
        event_date: booking.event_date,
        start_time: booking.start_time || '00:00',
        end_time: booking.end_time || '23:59',
        conflict_type: 'time_conflict',
        description: 'Contractor has existing booking at this time',
      }));
    } catch (error) {
      console.error('Error checking time conflicts:', error);
      return [];
    }
  }

  private createUnavailableResult(
    contractorId: string,
    eventDate: string,
    conflicts: AvailabilityConflict[]
  ): AvailabilityResult {
    return {
      contractor_id: contractorId,
      available: false,
      conflicts,
      availability_score: 0.0,
    };
  }
}

export const availabilityService = new AvailabilityService();
