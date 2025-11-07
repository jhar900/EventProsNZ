import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

// PUT /api/inquiries/[id]/messages/[messageId] - Update a message
export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; messageId: string }>
      | { id: string; messageId: string };
  }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const inquiryId = resolvedParams.id;
    const messageId = resolvedParams.messageId;

    const { supabase } = createClient(request);

    // Get current user
    let user: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (getUserUser) {
        user = getUserUser;
      }
    }

    // Fallback to x-user-id header
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        const adminSupabaseForAuth = createServerClient();
        const { data: userData } = await adminSupabaseForAuth
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (userData) {
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { message } = validationResult.data;

    // Use admin client to bypass RLS
    const adminSupabase = createServerClient();

    // Get the message to verify ownership
    const { data: messageData, error: messageError } = await adminSupabase
      .from('enquiry_messages')
      .select('sender_id, enquiry_id')
      .eq('id', messageId)
      .single();

    if (messageError || !messageData) {
      return NextResponse.json(
        { success: false, message: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify the message belongs to the user
    if (messageData.sender_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'You can only edit your own messages' },
        { status: 403 }
      );
    }

    // Verify the message belongs to the correct inquiry
    if (messageData.enquiry_id !== inquiryId) {
      return NextResponse.json(
        { success: false, message: 'Message does not belong to this inquiry' },
        { status: 400 }
      );
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await adminSupabase
      .from('enquiry_messages')
      .update({
        message: message,
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating message:', updateError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update message',
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error(
      'Error in PUT /api/inquiries/[id]/messages/[messageId]:',
      error
    );
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/inquiries/[id]/messages/[messageId] - Delete a message
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; messageId: string }>
      | { id: string; messageId: string };
  }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const inquiryId = resolvedParams.id;
    const messageId = resolvedParams.messageId;

    const { supabase } = createClient(request);

    // Get current user
    let user: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (getUserUser) {
        user = getUserUser;
      }
    }

    // Fallback to x-user-id header
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        const adminSupabaseForAuth = createServerClient();
        const { data: userData } = await adminSupabaseForAuth
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (userData) {
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = createServerClient();

    // Get the message to verify ownership
    const { data: messageData, error: messageError } = await adminSupabase
      .from('enquiry_messages')
      .select('sender_id, enquiry_id')
      .eq('id', messageId)
      .single();

    if (messageError || !messageData) {
      return NextResponse.json(
        { success: false, message: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify the message belongs to the user
    if (messageData.sender_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own messages' },
        { status: 403 }
      );
    }

    // Verify the message belongs to the correct inquiry
    if (messageData.enquiry_id !== inquiryId) {
      return NextResponse.json(
        { success: false, message: 'Message does not belong to this inquiry' },
        { status: 400 }
      );
    }

    // Delete the message
    const { error: deleteError } = await adminSupabase
      .from('enquiry_messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      console.error('Error deleting message:', deleteError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to delete message',
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error(
      'Error in DELETE /api/inquiries/[id]/messages/[messageId]:',
      error
    );
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
