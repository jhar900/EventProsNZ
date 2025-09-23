import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const ServiceTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  event_type: z.string(),
  services: z.array(
    z.object({
      service_category: z.string(),
      priority: z.number().min(1).max(5),
      is_required: z.boolean(),
      estimated_cost_percentage: z.number().min(0).max(1),
      description: z.string().optional(),
    })
  ),
  is_public: z.boolean(),
  created_by: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  event_type: z.string().min(1, 'Event type is required'),
  services: z
    .array(
      z.object({
        service_category: z.string(),
        priority: z.number().min(1).max(5),
        is_required: z.boolean(),
        estimated_cost_percentage: z.number().min(0).max(1),
        description: z.string().optional(),
      })
    )
    .min(1, 'At least one service is required'),
  is_public: z.boolean().default(false),
});

// Pre-defined service templates
const PREDEFINED_TEMPLATES = {
  wedding: [
    {
      id: 'wedding_basic',
      name: 'Basic Wedding Package',
      event_type: 'wedding',
      services: [
        {
          service_category: 'Venue',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.4,
          description: 'Wedding venue with ceremony and reception space',
        },
        {
          service_category: 'Catering',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.3,
          description: 'Wedding catering service',
        },
        {
          service_category: 'Photography',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.15,
          description: 'Wedding photography and videography',
        },
        {
          service_category: 'Music/DJ',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.05,
          description: 'Wedding music and entertainment',
        },
        {
          service_category: 'Flowers',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.05,
          description: 'Wedding flowers and decorations',
        },
        {
          service_category: 'Wedding Cake',
          priority: 3,
          is_required: true,
          estimated_cost_percentage: 0.03,
          description: 'Wedding cake',
        },
        {
          service_category: 'Hair & Makeup',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.02,
          description: 'Bridal hair and makeup',
        },
      ],
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wedding_premium',
      name: 'Premium Wedding Package',
      event_type: 'wedding',
      services: [
        {
          service_category: 'Venue',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.35,
          description: 'Premium wedding venue',
        },
        {
          service_category: 'Catering',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.25,
          description: 'Premium catering service',
        },
        {
          service_category: 'Photography',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.15,
          description: 'Premium photography and videography',
        },
        {
          service_category: 'Wedding Planner',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.1,
          description: 'Full-service wedding planning',
        },
        {
          service_category: 'Music/DJ',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.05,
          description: 'Live music and DJ services',
        },
        {
          service_category: 'Flowers',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.05,
          description: 'Premium floral arrangements',
        },
        {
          service_category: 'Wedding Cake',
          priority: 3,
          is_required: true,
          estimated_cost_percentage: 0.03,
          description: 'Custom wedding cake',
        },
        {
          service_category: 'Hair & Makeup',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.02,
          description: 'Professional hair and makeup',
        },
      ],
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  corporate: [
    {
      id: 'corporate_meeting',
      name: 'Corporate Meeting Package',
      event_type: 'corporate',
      services: [
        {
          service_category: 'Venue',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.35,
          description: 'Meeting venue with conference facilities',
        },
        {
          service_category: 'Catering',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.25,
          description: 'Corporate catering',
        },
        {
          service_category: 'AV Equipment',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.15,
          description: 'Audio-visual equipment',
        },
        {
          service_category: 'Event Management',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.15,
          description: 'Event coordination',
        },
        {
          service_category: 'Photography',
          priority: 2,
          is_required: false,
          estimated_cost_percentage: 0.05,
          description: 'Event photography',
        },
        {
          service_category: 'Transportation',
          priority: 2,
          is_required: false,
          estimated_cost_percentage: 0.05,
          description: 'Transportation services',
        },
      ],
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'corporate_conference',
      name: 'Corporate Conference Package',
      event_type: 'corporate',
      services: [
        {
          service_category: 'Venue',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.3,
          description: 'Conference venue',
        },
        {
          service_category: 'AV Equipment',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.2,
          description: 'Advanced AV equipment',
        },
        {
          service_category: 'Catering',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.2,
          description: 'Conference catering',
        },
        {
          service_category: 'Event Management',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.15,
          description: 'Full event management',
        },
        {
          service_category: 'Registration',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.1,
          description: 'Registration services',
        },
        {
          service_category: 'Networking',
          priority: 3,
          is_required: false,
          estimated_cost_percentage: 0.03,
          description: 'Networking facilitation',
        },
        {
          service_category: 'Transportation',
          priority: 2,
          is_required: false,
          estimated_cost_percentage: 0.02,
          description: 'Transportation services',
        },
      ],
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  birthday: [
    {
      id: 'birthday_kids',
      name: 'Kids Birthday Party Package',
      event_type: 'birthday',
      services: [
        {
          service_category: 'Venue',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.3,
          description: 'Party venue',
        },
        {
          service_category: 'Catering',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.25,
          description: 'Kids party catering',
        },
        {
          service_category: 'Entertainment',
          priority: 5,
          is_required: true,
          estimated_cost_percentage: 0.2,
          description: 'Kids entertainment',
        },
        {
          service_category: 'Decorations',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.15,
          description: 'Party decorations',
        },
        {
          service_category: 'Cake',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.08,
          description: 'Birthday cake',
        },
        {
          service_category: 'Party Favors',
          priority: 3,
          is_required: false,
          estimated_cost_percentage: 0.02,
          description: 'Party favors',
        },
      ],
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'birthday_adult',
      name: 'Adult Birthday Party Package',
      event_type: 'birthday',
      services: [
        {
          service_category: 'Venue',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.35,
          description: 'Party venue',
        },
        {
          service_category: 'Catering',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.3,
          description: 'Adult party catering',
        },
        {
          service_category: 'Music/DJ',
          priority: 4,
          is_required: true,
          estimated_cost_percentage: 0.15,
          description: 'Music and DJ',
        },
        {
          service_category: 'Decorations',
          priority: 3,
          is_required: true,
          estimated_cost_percentage: 0.1,
          description: 'Party decorations',
        },
        {
          service_category: 'Cake',
          priority: 3,
          is_required: true,
          estimated_cost_percentage: 0.05,
          description: 'Birthday cake',
        },
        {
          service_category: 'Photography',
          priority: 2,
          is_required: false,
          estimated_cost_percentage: 0.05,
          description: 'Party photography',
        },
      ],
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event_type');
    const isPublic = searchParams.get('is_public');

    let templates = [];

    // Get predefined templates
    if (
      eventType &&
      PREDEFINED_TEMPLATES[eventType as keyof typeof PREDEFINED_TEMPLATES]
    ) {
      templates = [
        ...PREDEFINED_TEMPLATES[eventType as keyof typeof PREDEFINED_TEMPLATES],
      ];
    } else if (!eventType) {
      // Get all predefined templates
      Object.values(PREDEFINED_TEMPLATES).forEach(eventTemplates => {
        templates.push(...eventTemplates);
      });
    }

    // Get user-created templates from database
    let query = supabase
      .from('service_templates')
      .select('*')
      .eq('created_by', user.id);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    }

    const { data: userTemplates, error } = await query;

    if (error) {
      console.error('Error fetching user templates:', error);
    } else if (userTemplates) {
      templates.push(...userTemplates);
    }

    // Get public templates from other users
    if (isPublic !== 'false') {
      let publicQuery = supabase
        .from('service_templates')
        .select('*')
        .eq('is_public', true)
        .neq('created_by', user.id);

      if (eventType) {
        publicQuery = publicQuery.eq('event_type', eventType);
      }

      const { data: publicTemplates, error: publicError } = await publicQuery;

      if (publicError) {
        console.error('Error fetching public templates:', publicError);
      } else if (publicTemplates) {
        templates.push(...publicTemplates);
      }
    }

    // Sort templates by event type and name
    templates.sort((a, b) => {
      if (a.event_type !== b.event_type) {
        return a.event_type.localeCompare(b.event_type);
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      templates,
      metadata: {
        total_templates: templates.length,
        event_types: [...new Set(templates.map(t => t.event_type))],
        user_templates: templates.filter(t => t.created_by === user.id).length,
        public_templates: templates.filter(t => t.is_public).length,
      },
    });
  } catch (error) {
    console.error('Error fetching service templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = CreateTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, event_type, services, is_public } = validationResult.data;

    // Check if template name already exists for this user
    const { data: existingTemplate } = await supabase
      .from('service_templates')
      .select('id')
      .eq('name', name)
      .eq('created_by', user.id)
      .single();

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      );
    }

    // Create new template
    const templateData = {
      name,
      event_type,
      services,
      is_public,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('service_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating service template:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      template: data,
      success: true,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('Error creating service template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
