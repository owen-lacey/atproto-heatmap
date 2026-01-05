'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';

export interface DayData {
  total: number;
  byCollection: Record<string, number>;
}

export function useHeatmapData(
  recordId: string | null
): Map<string, DayData> | null {
  const [heatmapData, setHeatmapData] = useState<Map<string, DayData> | null>(null);

  const supabase = createBrowserClient();

  useEffect(() => {
    if (!recordId) return;

    const fetchHeatmapData = async () => {
      try {
        // Calculate cutoff date (1 year ago from start of today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cutoffDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

        // Fetch all records from the last year
        const allRecords: Array<{ collection: string; timestamp: string }> = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('records')
            .select('collection, timestamp')
            .eq('handle_id', recordId)
            .gte('timestamp', cutoffDate.toISOString())
            .range(from, from + pageSize - 1);

          if (error) {
            console.error('Error fetching records:', error);
            break;
          }

          if (data && data.length > 0) {
            allRecords.push(...data);

            if (data.length < pageSize) {
              hasMore = false;
            } else {
              from += pageSize;
            }
          } else {
            hasMore = false;
          }
        }

        // Aggregate records by date
        const dataMap = new Map<string, DayData>();

        allRecords.forEach((record) => {
          const date = new Date(record.timestamp);
          date.setHours(0, 0, 0, 0);
          const dateKey = date.toISOString().split('T')[0];

          const existing = dataMap.get(dateKey);
          if (existing) {
            existing.total += 1;
            existing.byCollection[record.collection] = (existing.byCollection[record.collection] || 0) + 1;
          } else {
            dataMap.set(dateKey, {
              total: 1,
              byCollection: { [record.collection]: 1 },
            });
          }
        });

        setHeatmapData(dataMap);
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
      }
    };

    fetchHeatmapData();
  }, [recordId]);

  return heatmapData;
}
