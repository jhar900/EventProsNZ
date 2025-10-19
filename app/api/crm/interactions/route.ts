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
const createInteractionSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID'),
  interaction_type: z.enum([
    'inquiry',
    'response',
    'call',
    'email',
    'meeting',
    'note',
    'reminder',
    'status_change',
  ]),
  interaction_data: z.record(z.any()).optional(),
  interaction_notes: z
    .string()
    .max(1000, 'Interaction notes too long')
    .optional(),
});

const getInteractionsSchema = z.object({
  contact_id: z.string().uuid().optional(),
  interaction_type: z
    .enum([
      'inquiry',
      'response',
      'call',
      'email',
      'meeting',
      'note',
      'reminder',
      'status_change',
    ])
    .optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/crm/interactions - Get interactions
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

        const validationResult = getInteractionsSchema.safeParse(queryParams);
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

        const {
          contact_id,
          interaction_type,
          date_from,
          date_to,
          page,
          limit,
        } = validationResult.data;
        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
          .from('contact_interactions')
          .select(
            `
        *,
        contact:contacts!contact_interactions_contact_id_fkey(
          id,
          contact_type,
          relationship_status,
          contact_user:users!contacts_contact_user_id_fkey(
            id,
            email,
            role
          ),
          contact_profile:profiles!contacts_contact_user_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        )
      `
          )
          .eq('user_id', user.id);

        if (contact_id) {
          query = query.eq('contact_id', contact_id);
        }

        if (interaction_type) {
          query = query.eq('interaction_type', interaction_type);
        }

        if (date_from) {
          query = query.gte('created_at', date_from);
        }

        if (date_to) {
          query = query.lte('created_at', date_to);
        }

        // Get total count
        const { count } = await supabase
          .from('contact_interactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get interactions with pagination
        const { data: interactions, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to fetch interactions: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          interactions: interactions || [],
          total: count || 0,
          page,
          limit,
        });
      } catch (error) {
        console.error('Error fetching interactions:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch interactions' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}

// POST /api/crm/interactions - Create a new interaction
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
        const validationResult =
          createInteractionSchema.safeParse(sanitizedBody);

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

        const {
          contact_id,
          interaction_type,
          interaction_data,
          interaction_notes,
        } = validationResult.data;

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

        // Create interaction
        const { data: interaction, error } = await supabase
          .from('contact_interactions')
          .insert({
            contact_id,
            user_id: user.id,
            interaction_type,
            interaction_data,
            interaction_notes,
          })
          .select(
            `
        *,
        contact:contacts!contact_interactions_contact_id_fkey(
          id,
          contact_type,
          relationship_status,
          contact_user:users!contacts_contact_user_id_fkey(
            id,
            email,
            role
          ),
          contact_profile:profiles!contacts_contact_user_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        )
      `
          )
          .single();

        if (error) {
          throw new Error(`Failed to create interaction: ${error.message}`);
        }

        // Update contact's last_interaction and interaction_count
        await supabase
          .from('contacts')
          .update({
            last_interaction: new Date().toISOString(),
            interaction_count: supabase.sql`interaction_count + 1`,
          })
          .eq('id', contact_id)
          .eq('user_id', user.id);

        // Invalidate cache for this user
        await crmDataCache.invalidateUser(user.id);

        return NextResponse.json({
          success: true,
          interaction,
        });
      } catch (error) {
        console.error('Error creating interaction:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to create interaction' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
