import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  withSecurity,
  crmSecurityConfig,
} from '@/lib/security/security-middleware';
import { textSanitizer } from '@/lib/security/input-sanitization';
import { crmDataCache } from '@/lib/cache/crm-cache';
import { queryOptimizer } from '@/lib/database/query-optimization';
import { CRMPagination } from '@/lib/database/pagination';

// Validation schemas
const createReminderSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID'),
  reminder_type: z.enum([
    'call',
    'email',
    'meeting',
    'follow_up',
    'deadline',
    'other',
  ]),
  reminder_date: z.string().datetime('Invalid reminder date'),
  reminder_message: z.string().max(500, 'Reminder message too long').optional(),
});

const updateReminderSchema = z.object({
  is_completed: z.boolean(),
  completed_at: z.string().datetime().optional(),
});

const getRemindersSchema = z.object({
  contact_id: z.string().uuid().optional(),
  reminder_type: z
    .enum(['call', 'email', 'meeting', 'follow_up', 'deadline', 'other'])
    .optional(),
  is_completed: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/crm/reminders - Get reminders
export async function GET(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
          );
        }

        // Parse and validate query parameters
        const { searchParams } = new URL(request.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        const validationResult = getRemindersSchema.safeParse(queryParams);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: 'Invalid query parameters',
              errors:
                validationResult.error.errors?.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                })) || [],
            },
            { status: 400 }
          );
        }

        const { contact_id, reminder_type, is_completed, page, limit } =
          validationResult.data;
        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
          .from('contact_reminders')
          .select('*')
          .eq('user_id', user.id);

        if (contact_id) {
          query = query.eq('contact_id', contact_id);
        }

        if (reminder_type) {
          query = query.eq('reminder_type', reminder_type);
        }

        if (is_completed !== undefined) {
          query = query.eq('is_completed', is_completed);
        }

        // Get total count
        const { count } = await supabase
          .from('contact_reminders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get reminders with pagination
        const { data: reminders, error } = await query
          .order('reminder_date', { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to fetch reminders: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          reminders: reminders || [],
          total: count || 0,
          page,
          limit,
        });
      } catch (error) {
        console.error('Error fetching reminders:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch reminders' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}

// POST /api/crm/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    async () => {
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
          );
        }

        // Parse and validate request body
        const body = await request.json();

        // Sanitize input data
        const sanitizedBody = textSanitizer.sanitizeObject(body);
        const validationResult = createReminderSchema.safeParse(sanitizedBody);

        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              message: 'Validation failed',
              errors:
                validationResult.error.errors?.map(err => ({
                  field: err.path.join('.'),
                  message: err.message,
                })) || [],
            },
            { status: 400 }
          );
        }

        const { contact_id, reminder_type, reminder_date, reminder_message } =
          validationResult.data;

        // Verify the contact exists and belongs to user
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id, user_id')
          .eq('id', contact_id)
          .eq('user_id', user.id)
          .single();

        if (contactError || !contact) {
          return NextResponse.json(
            { success: false, message: 'Contact not found' },
            { status: 404 }
          );
        }

        // Create reminder
        const { data: reminder, error } = await supabase
          .from('contact_reminders')
          .insert({
            contact_id,
            user_id: user.id,
            reminder_type,
            reminder_date,
            reminder_message,
          })
          .select('*')
          .single();

        if (error) {
          throw new Error(`Failed to create reminder: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          reminder,
        });
      } catch (error) {
        console.error('Error creating reminder:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to create reminder' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
