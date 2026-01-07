'use server';

import { createServerClient } from '@/lib/supabase';
import { getProfile } from '@/lib/atproto';

interface LookupResult {
  success: boolean;
  recordId?: string;
  error?: string;
}

/**
 * Server action to lookup an AT Protocol handle and trigger hydration
 */
export async function lookupHandle(handle: string): Promise<LookupResult> {
  try {
    // Validate input
    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
    if (!cleanHandle) {
      return { success: false, error: 'Please enter a valid handle' };
    }

    // Validate handle exists via AT Proto API
    let profile;
    try {
      profile = await getProfile(cleanHandle);
    } catch (error: any) {
      console.error('Failed to fetch AT Proto profile:', error);

      // Check if this is an opt-out error
      if (error.message?.startsWith('OPT_OUT:')) {
        const message = error.message.substring(8); // Remove "OPT_OUT:" prefix
        return {
          success: false,
          error: message,
        };
      }

      return {
        success: false,
        error: 'Handle not found. Please check the handle and try again.',
      };
    }

    // Create Supabase client with service role
    const supabase = createServerClient();

    // Check if handle already exists (case-insensitive)
    const { data: existingHandle } = await supabase
      .from('handles')
      .select('id, status, updated_at')
      .ilike('handle', cleanHandle)
      .single();

    // If exists and complete, check if data is stale
    if (existingHandle && existingHandle.status === 'complete') {
      // Check if updated_at is older than today
      const updatedAt = new Date(existingHandle.updated_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (updatedAt < today) {
        console.log(`Data is stale for ${cleanHandle}, triggering delta update`);
        // Trigger delta update
        try {
          const netlifyUrl = process.env.NETLIFY_URL || 'http://localhost:8888';
          const functionUrl = `${netlifyUrl}/.netlify/functions/hydrate-handle-background`;

          fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recordId: existingHandle.id,
              deltaMode: true,
            }),
          }).catch((error) => {
            console.error('Failed to trigger delta update:', error);
          });
        } catch (error) {
          console.error('Failed to trigger delta update:', error);
        }
      }

      return {
        success: true,
        recordId: existingHandle.id,
      };
    }

    // If exists but not complete, return existing record for status tracking
    if (existingHandle) {
      return {
        success: true,
        recordId: existingHandle.id,
      };
    }

    // Insert new handle record with pending status
    const { data: newHandle, error: insertError } = await supabase
      .from('handles')
      .insert({
        handle: cleanHandle,
        status: 'pending',
        at_proto_data: {
          did: profile.did,
          handle: profile.handle,
          displayName: profile.displayName,
          description: profile.description,
          avatar: profile.avatar,
        },
      })
      .select('id')
      .single();

    if (insertError || !newHandle) {
      console.error('Failed to insert handle record:', insertError);
      return {
        success: false,
        error: 'Failed to save handle. Please try again.',
      };
    }

    // Trigger background function
    try {
      const netlifyUrl = process.env.NETLIFY_URL || 'http://localhost:8888';
      const functionUrl = `${netlifyUrl}/.netlify/functions/hydrate-handle-background`;

      // Fire and forget - background function handles the rest
      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: newHandle.id,
        }),
      }).catch((error) => {
        console.error('Failed to trigger background function:', error);
        // Don't fail the request - update status to error in database
        supabase
          .from('handles')
          .update({
            status: 'error',
            error_message: 'Failed to start hydration process',
          })
          .eq('id', newHandle.id)
          .then();
      });
    } catch (error) {
      console.error('Failed to trigger background function:', error);
      // Update status to error
      await supabase
        .from('handles')
        .update({
          status: 'error',
          error_message: 'Failed to start hydration process',
        })
        .eq('id', newHandle.id);

      return {
        success: false,
        error: 'Failed to start data collection. Please try again.',
      };
    }

    return {
      success: true,
      recordId: newHandle.id,
    };
  } catch (error) {
    console.error('Unexpected error in lookupHandle:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
