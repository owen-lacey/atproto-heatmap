'use client';

import { useMemo } from 'react';
import { COLLECTIONS } from '@/lib/collections';
import type { DayData } from '@/lib/hooks/useHeatmapData';

interface CollectionBreakdownProps {
  data: Map<string, DayData>;
}

interface CollectionStat {
  collection: string;
  displayName: string;
  color: string;
  count: number;
  percentage: number;
}

export function CollectionBreakdown({ data }: CollectionBreakdownProps) {
  const stats = useMemo(() => {
    // Aggregate totals for each collection
    const collectionTotals = new Map<string, number>();
    let grandTotal = 0;

    // Sum up all records by collection
    data.forEach((dayData) => {
      Object.entries(dayData.byCollection).forEach(([collection, count]) => {
        const currentTotal = collectionTotals.get(collection) || 0;
        collectionTotals.set(collection, currentTotal + count);
        grandTotal += count;
      });
    });

    // Convert to stats array with metadata from COLLECTIONS
    const collectionStats: CollectionStat[] = [];
    
    collectionTotals.forEach((count, collection) => {
      const config = COLLECTIONS.find((c) => c.collection === collection);
      const displayName = config?.displayName || collection;
      const color = config?.color || '#999999';
      const percentage = grandTotal > 0 ? (count / grandTotal) * 100 : 0;

      collectionStats.push({
        collection,
        displayName,
        color,
        count,
        percentage,
      });
    });

    // Sort by count descending
    collectionStats.sort((a, b) => b.count - a.count);

    return { stats: collectionStats, total: grandTotal };
  }, [data]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <>
      {/* Progress bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-4">
        {stats.stats.map((stat) => (
          <div
            key={stat.collection}
            style={{
              width: `${stat.percentage}%`,
              backgroundColor: stat.color,
            }}
            title={`${stat.displayName}: ${stat.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Collection list */}
      <div className="space-y-3">
        {stats.stats.map((stat) => (
          <div key={stat.collection} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stat.color }}
              />
              <span className="font-medium text-foreground">{stat.displayName}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>{stat.percentage.toFixed(1)}%</span>
              <span>·</span>
              <span>{stat.count.toLocaleString()} {stat.count === 1 ? 'record' : 'records'}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
