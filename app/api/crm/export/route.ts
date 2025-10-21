import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
import {
  withSecurity,
  crmSecurityConfig,
} from '@/lib/security/security-middleware';
import { textSanitizer } from '@/lib/security/input-sanitization';
import { crmDataCache } from '@/lib/cache/crm-cache';
import { queryOptimizer } from '@/lib/database/query-optimization';
import { CRMPagination } from '@/lib/database/pagination';

// Validation schemas
const exportContactsSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  contact_type: z
    .enum(['contractor', 'event_manager', 'client', 'vendor', 'other'])
    .optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// GET /api/crm/export - Export contact data
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

        const validationResult = exportContactsSchema.safeParse(queryParams);
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

        const { format, contact_type, date_from, date_to } =
          validationResult.data;

        // Sanitize contact_type if provided
        const sanitizedContactType = contact_type
          ? textSanitizer.sanitizeString(contact_type)
          : contact_type;

        // Build query
        let query = supabase
          .from('contacts')
          .select(
            `
        *,
        contact_user:users!contacts_contact_user_id_fkey(
          id,
          email,
          role,
          is_verified,
          last_login,
          created_at
        ),
        contact_profile:profiles!contacts_contact_user_id_fkey(
          first_name,
          last_name,
          phone,
          address,
          bio
        )
      `
          )
          .eq('user_id', user.id);

        if (sanitizedContactType) {
          query = query.eq('contact_type', sanitizedContactType);
        }

        if (date_from) {
          query = query.gte('created_at', date_from);
        }

        if (date_to) {
          query = query.lte('created_at', date_to);
        }

        // Get all contacts for export
        const { data: contacts, error } = await query.order('created_at', {
          ascending: false,
        });

        if (error) {
          throw new Error(
            `Failed to fetch contacts for export: ${error.message}`
          );
        }

        if (!contacts || contacts.length === 0) {
          return NextResponse.json(
            { success: false, message: 'No contacts found to export' },
            { status: 404 }
          );
        }

        // Format data for export
        const exportData = contacts.map(contact => ({
          id: contact.id,
          contact_type: contact.contact_type,
          relationship_status: contact.relationship_status,
          last_interaction: contact.last_interaction,
          interaction_count: contact.interaction_count,
          created_at: contact.created_at,
          updated_at: contact.updated_at,
          contact_email: contact.contact_user?.email || '',
          contact_role: contact.contact_user?.role || '',
          contact_verified: contact.contact_user?.is_verified || false,
          contact_first_name: contact.contact_profile?.first_name || '',
          contact_last_name: contact.contact_profile?.last_name || '',
          contact_phone: contact.contact_profile?.phone || '',
          contact_address: contact.contact_profile?.address || '',
          contact_bio: contact.contact_profile?.bio || '',
        }));

        if (format === 'csv') {
          // Convert to CSV
          const headers = Object.keys(exportData[0]);
          const csvContent = [
            headers.join(','),
            ...exportData.map(row =>
              headers
                .map(header => {
                  const value = row[header as keyof typeof row];
                  // Escape CSV values
                  if (
                    typeof value === 'string' &&
                    (value.includes(',') ||
                      value.includes('"') ||
                      value.includes('\n'))
                  ) {
                    return `"${value.replace(/"/g, '""')}"`;
                  }
                  return value;
                })
                .join(',')
            ),
          ].join('\n');

          return new NextResponse(csvContent, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="contacts-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
          });
        } else {
          // Return JSON
          return NextResponse.json({
            success: true,
            data: exportData,
            exported_at: new Date().toISOString(),
            total_contacts: exportData.length,
          });
        }
      } catch (error) {
        console.error('Error exporting contacts:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to export contacts' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
