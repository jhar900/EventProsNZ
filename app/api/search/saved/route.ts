import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: savedSearches, error: savedError } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (savedError) {
      console.error('Saved searches error:', savedError);
      return NextResponse.json(
        { error: 'Failed to fetch saved searches' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saved_searches: savedSearches || [],
    });
  } catch (error) {
    console.error('Saved searches API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { name, search_query, filters } = body;

    if (!name || !search_query) {
      return NextResponse.json(
        { error: 'Name and search query are required' },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: savedSearch, error: insertError } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name,
        search_query,
        filters: filters || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error('Saved search insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save search' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      saved_search: savedSearch,
    });
  } catch (error) {
    console.error('Saved searches POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Saved search delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete saved search' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Saved searches DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
