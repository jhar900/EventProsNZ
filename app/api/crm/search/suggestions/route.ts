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
const getSuggestionsSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long'),
});

// GET /api/crm/search/suggestions - Get search suggestions
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

        const validationResult = getSuggestionsSchema.safeParse(queryParams);
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

        const { query } = validationResult.data;

        // Sanitize search query
        const sanitizedQuery = textSanitizer.sanitizeString(query);

        // Get suggestions from contact names and emails
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select(
            `
        contact_user:users!contacts_contact_user_id_fkey(
          email
        ),
        contact_profile:profiles!contacts_contact_user_id_fkey(
          first_name,
          last_name
        )
      `
          )
          .eq('user_id', user.id)
          .or(
            `
        contact_user.email.ilike.%${sanitizedQuery}%,
        contact_profile.first_name.ilike.%${sanitizedQuery}%,
        contact_profile.last_name.ilike.%${sanitizedQuery}%
      `
          )
          .limit(10);

        if (error) {
          throw new Error(`Failed to fetch suggestions: ${error.message}`);
        }

        // Extract suggestions from the results
        const suggestions: string[] = [];

        if (contacts) {
          contacts.forEach(contact => {
            if (contact.contact_user?.email) {
              suggestions.push(contact.contact_user.email);
            }
            if (contact.contact_profile?.first_name) {
              suggestions.push(contact.contact_profile.first_name);
            }
            if (contact.contact_profile?.last_name) {
              suggestions.push(contact.contact_profile.last_name);
            }
            if (
              contact.contact_profile?.first_name &&
              contact.contact_profile?.last_name
            ) {
              suggestions.push(
                `${contact.contact_profile.first_name} ${contact.contact_profile.last_name}`
              );
            }
          });
        }

        // Remove duplicates and filter by query
        const uniqueSuggestions = [...new Set(suggestions)]
          .filter(suggestion =>
            suggestion.toLowerCase().includes(sanitizedQuery.toLowerCase())
          )
          .slice(0, 10);

        return NextResponse.json({
          success: true,
          suggestions: uniqueSuggestions,
        });
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch suggestions' },
          { status: 500 }
        );
      }
    },
    crmSecurityConfig
  );
}
