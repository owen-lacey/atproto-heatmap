'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { COLLECTIONS } from '@/lib/collections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/supabase';

type HandleStatus = Database['public']['Tables']['handles']['Row']['status'];

interface HydrationProgressProps {
  handle: string;
}

export function HydrationProgress({ handle }: HydrationProgressProps) {
  const [recordId, setRecordId] = useState<string | null>(null);
  const [status, setStatus] = useState<HandleStatus | 'idle'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});

  const supabase = createBrowserClient();

  // Fetch handle record ID and initial status
  useEffect(() => {
    const fetchHandle = async () => {
      const { data, error } = await supabase
        .from('handles')
        .select('id, status, error_message')
        .eq('handle', handle)
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
  }, [handle, supabase]);

  // Fetch record counts when recordId is available
  useEffect(() => {
    if (!recordId || (status !== 'hydrating' && status !== 'complete')) return;

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
  }, [recordId, status, supabase]);

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
  }, [recordId, status, supabase]);

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
  }, [recordId, status, supabase]);

  // Get collection display info
  const getCollectionInfo = useCallback((collectionName: string) => {
    const config = COLLECTIONS.find((c) => c.collection === collectionName);
    return config || { displayName: collectionName, color: '#999999' };
  }, []);

  // Calculate total records
  const totalRecords = Object.values(recordCounts).reduce((sum, count) => sum + count, 0);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'pending') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-blue-800">Initializing...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'hydrating') {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span className="text-blue-800 font-medium">Fetching records...</span>
              </div>
              <p className="text-sm text-blue-700">
                Collecting posts from the past year. This may take a few minutes depending on posting frequency.
              </p>
            </div>
          </CardContent>
        </Card>

        {totalRecords > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Records Found: {totalRecords.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(recordCounts).map(([collection, count]) => {
                const info = getCollectionInfo(collection);
                return (
                  <div key={collection} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="font-medium">{info.displayName}</span>
                    </div>
                    <span className="text-gray-600">{count.toLocaleString()}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800 font-medium">Data collection complete!</span>
            </div>
            {totalRecords > 0 && (
              <p className="text-sm text-green-700 mt-2">
                Collected {totalRecords.toLocaleString()} records
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
