import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { handle } = await request.json();

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // First, get the handle record to find its ID
    const { data: handleData, error: handleError } = await supabase
      .from('handles')
      .select('id')
      .ilike('handle', handle)
      .maybeSingle();

    if (handleError) {
      console.error('Error finding handle:', handleError);
      return NextResponse.json(
        { error: 'Failed to find handle' },
        { status: 500 }
      );
    }

    if (!handleData) {
      return NextResponse.json(
        { error: 'Handle not found' },
        { status: 404 }
      );
    }

    // Delete all records associated with this handle
    const { error: recordsError } = await supabase
      .from('records')
      .delete()
      .eq('handle_id', handleData.id);

    if (recordsError) {
      console.error('Error deleting records:', recordsError);
      return NextResponse.json(
        { error: 'Failed to delete records' },
        { status: 500 }
      );
    }

    // Delete the handle entry
    const { error: deleteError } = await supabase
      .from('handles')
      .delete()
      .eq('id', handleData.id);

    if (deleteError) {
      console.error('Error deleting handle:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete handle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in reset handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
