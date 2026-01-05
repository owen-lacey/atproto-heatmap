'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { COLLECTIONS } from '@/lib/collections';
import type { Database } from '@/lib/supabase';

type HandleStatus = Database['public']['Tables']['handles']['Row']['status'];

export function useRecordCounts(
  recordId: string | null,
  status: HandleStatus | 'idle'
): Record<string, number> {
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});

  const supabase = createBrowserClient();

  // Fetch record counts when recordId is available and complete
  useEffect(() => {
    if (!recordId || status !== 'complete') return;

    const fetchRecordCounts = async () => {
      try {
        // Use RPC function if available
        const { data: totals, error } = await supabase
          .rpc('get_collection_totals', { p_handle_id: recordId });

        if (!error && totals) {
          const counts: Record<string, number> = {};
          totals.forEach((row: { collection: string; total: number }) => {
            counts[row.collection] = row.total;
          });
          setRecordCounts(counts);
        } else {
          // Fallback: count records with pagination
          const counts: Record<string, number> = {};

          for (const collection of COLLECTIONS) {
            let total = 0;
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
              const { data, error } = await supabase
                .from('records')
                .select('id', { count: 'exact', head: true })
                .eq('handle_id', recordId)
                .eq('collection', collection.collection)
                .range(from, from + pageSize - 1);

              if (error) {
                console.error(`Error counting ${collection.collection}:`, error);
                break;
              }

              const count = (data as any)?.length || 0;
              total += count;

              if (count < pageSize) {
                hasMore = false;
              } else {
                from += pageSize;
              }
            }

            if (total > 0) {
              counts[collection.collection] = total;
            }
          }

          setRecordCounts(counts);
        }
      } catch (err) {
        console.error('Error fetching record counts:', err);
      }
    };

    fetchRecordCounts();
  }, [recordId, status]);

  // Subscribe to record inserts for real-time count updates
  useEffect(() => {
    if (!recordId || status === 'complete' || status === 'error') {
      return;
    }

    const channel = supabase
      .channel(`record-inserts-${recordId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'records',
          filter: `handle_id=eq.${recordId}`,
        },
        (payload) => {
          const collection = payload.new.collection;
          setRecordCounts((prev) => ({
            ...prev,
            [collection]: (prev[collection] || 0) + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [recordId, status]);

  return recordCounts;
}
