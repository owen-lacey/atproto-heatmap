'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type HandleStatus = Database['public']['Tables']['handles']['Row']['status'];

interface UseHandleStatusReturn {
  recordId: string | null;
  status: HandleStatus | 'idle';
  error: string | null;
}

export function useHandleStatus(handle: string): UseHandleStatusReturn {
  const [recordId, setRecordId] = useState<string | null>(null);
  const [status, setStatus] = useState<HandleStatus | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // Fetch handle record ID and initial status
  useEffect(() => {
    const fetchHandle = async () => {
      const { data, error } = await supabase
        .from('handles')
        .select('id, status, error_message')
        .eq('handle', handle.toLowerCase())
        .single();

      if (error) {
        console.error('Error fetching handle:', error);
        setError('Failed to load handle data');
        return;
      }

      if (data) {
        setRecordId(data.id);
        setStatus(data.status);
        if (data.error_message) {
          setError(data.error_message);
        }
      }
    };

    fetchHandle();
  }, [handle]);

  // Subscribe to handle status updates
  useEffect(() => {
    if (!recordId || status === 'complete' || status === 'error') {
      return;
    }

    const channel = supabase
      .channel(`handle-updates-${recordId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'handles',
          filter: `id=eq.${recordId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as HandleStatus;
          setStatus(newStatus);

          if (payload.new.error_message) {
            setError(payload.new.error_message);
          }

          // Unsubscribe when complete or error
          if (newStatus === 'complete' || newStatus === 'error') {
            channel.unsubscribe();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [recordId, status]);

  return { recordId, status, error };
}
