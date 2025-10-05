import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { INQUIRY_TYPES, INQUIRY_PRIORITY } from '@/types/inquiries';

// Validation schemas
const validateInquirySchema = z.object({
  contractor_id: z.string().uuid('Invalid contractor ID'),
  event_id: z.string().uuid('Invalid event ID').optional(),
  inquiry_type: z.enum(Object.values(INQUIRY_TYPES) as [string, ...string[]]),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long'),
  event_details: z
    .object({
      event_type: z.string(),
      title: z.string(),
      description: z.string().optional(),
      event_date: z.string().datetime(),
      duration_hours: z.number().min(0).max(168).optional(),
      attendee_count: z.number().min(1).max(10000).optional(),
      location: z.object({
        address: z.string(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
        placeId: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
      }),
      budget_total: z.number().min(0).optional(),
      special_requirements: z.string().optional(),
      service_requirements: z
        .array(
          z.object({
            category: z.string(),
            type: z.string(),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high']),
            estimated_budget: z.number().min(0).optional(),
            is_required: z.boolean(),
          })
        )
        .optional(),
    })
    .optional(),
  priority: z
    .enum(Object.values(INQUIRY_PRIORITY) as [string, ...string[]])
    .optional(),
});

// POST /api/inquiries/validation - Validate inquiry data
export async function POST(request: NextRequest) {
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
    const validationResult = validateInquirySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const inquiryData = validationResult.data;
    const validationErrors: Array<{ field: string; message: string }> = [];

    // Additional business logic validation
    try {
      // Validate contractor exists and is verified
      const { data: contractor, error: contractorError } = await supabase
        .from('users')
        .select('id, role, is_verified')
        .eq('id', inquiryData.contractor_id)
        .eq('role', 'contractor')
        .single();

      if (contractorError || !contractor) {
        validationErrors.push({
          field: 'contractor_id',
          message: 'Contractor not found',
        });
      } else if (!contractor.is_verified) {
        validationErrors.push({
          field: 'contractor_id',
          message: 'Contractor is not verified',
        });
      }

      // Validate event exists if provided
      if (inquiryData.event_id) {
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id, event_manager_id')
          .eq('id', inquiryData.event_id)
          .eq('event_manager_id', user.id)
          .single();

        if (eventError || !event) {
          validationErrors.push({
            field: 'event_id',
            message: 'Event not found or access denied',
          });
        }
      }

      // Validate event date is in the future
      if (inquiryData.event_details?.event_date) {
        const eventDate = new Date(inquiryData.event_details.event_date);
        const now = new Date();

        if (eventDate <= now) {
          validationErrors.push({
            field: 'event_details.event_date',
            message: 'Event date must be in the future',
          });
        }
      }

      // Validate budget is reasonable
      if (inquiryData.event_details?.budget_total) {
        const budget = inquiryData.event_details.budget_total;

        if (budget < 100) {
          validationErrors.push({
            field: 'event_details.budget_total',
            message: 'Budget must be at least $100',
          });
        }

        if (budget > 1000000) {
          validationErrors.push({
            field: 'event_details.budget_total',
            message: 'Budget cannot exceed $1,000,000',
          });
        }
      }

      // Validate attendee count is reasonable
      if (inquiryData.event_details?.attendee_count) {
        const attendeeCount = inquiryData.event_details.attendee_count;

        if (attendeeCount < 1) {
          validationErrors.push({
            field: 'event_details.attendee_count',
            message: 'Attendee count must be at least 1',
          });
        }

        if (attendeeCount > 10000) {
          validationErrors.push({
            field: 'event_details.attendee_count',
            message: 'Attendee count cannot exceed 10,000',
          });
        }
      }

      // Validate service requirements
      if (inquiryData.event_details?.service_requirements) {
        const serviceRequirements =
          inquiryData.event_details.service_requirements;

        if (serviceRequirements.length === 0) {
          validationErrors.push({
            field: 'event_details.service_requirements',
            message: 'At least one service requirement is recommended',
          });
        }

        // Check for duplicate service categories
        const categories = serviceRequirements.map(req => req.category);
        const uniqueCategories = new Set(categories);

        if (categories.length !== uniqueCategories.size) {
          validationErrors.push({
            field: 'event_details.service_requirements',
            message: 'Duplicate service categories are not allowed',
          });
        }

        // Validate individual service requirements
        serviceRequirements.forEach((req, index) => {
          if (!req.category || req.category.trim().length === 0) {
            validationErrors.push({
              field: `event_details.service_requirements[${index}].category`,
              message: 'Service category is required',
            });
          }

          if (!req.type || req.type.trim().length === 0) {
            validationErrors.push({
              field: `event_details.service_requirements[${index}].type`,
              message: 'Service type is required',
            });
          }

          if (req.estimated_budget && req.estimated_budget < 0) {
            validationErrors.push({
              field: `event_details.service_requirements[${index}].estimated_budget`,
              message: 'Estimated budget cannot be negative',
            });
          }
        });
      }

      // Validate message content (basic spam detection)
      const message = inquiryData.message.toLowerCase();
      const spamKeywords = ['spam', 'scam', 'fake', 'test', 'dummy'];
      const hasSpamKeywords = spamKeywords.some(keyword =>
        message.includes(keyword)
      );

      if (hasSpamKeywords) {
        validationErrors.push({
          field: 'message',
          message: 'Message contains potentially inappropriate content',
        });
      }

      // Validate subject line
      const subject = inquiryData.subject.toLowerCase();
      if (subject.includes('urgent') && inquiryData.priority !== 'urgent') {
        validationErrors.push({
          field: 'priority',
          message: 'Consider setting priority to urgent for urgent requests',
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      validationErrors.push({
        field: 'general',
        message: 'Validation failed due to server error',
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry data is valid',
      validated_data: inquiryData,
    });
  } catch (error) {
    console.error('Inquiry validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
