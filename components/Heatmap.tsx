'use client';

import { useMemo, useState } from 'react';
import { COLLECTIONS } from '@/lib/collections';
import type { DayData } from '@/lib/hooks/useHeatmapData';

interface HeatmapProps {
  data: Map<string, DayData>;
}

interface GridCell {
  date: Date;
  dateKey: string;
  count: number;
  dayData: DayData | null;
  isNullCell?: boolean;
}

export function Heatmap({ data }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; cell: GridCell } | null>(null);

  // Generate grid data for the last 365 days (53 weeks)
  const gridData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Yesterday is the last day we should show
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Calculate the start date (364 days ago, so we don't show dates a year ago or more)
    const startDate = new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000);

    // Find the first Sunday on or before startDate
    const dayOfWeek = startDate.getDay();
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - dayOfWeek);

    const grid: GridCell[][] = [];
    const maxCount = Math.max(...Array.from(data.values()).map((d) => d.total), 1);

    // Generate 53 weeks
    for (let week = 0; week < 53; week++) {
      const weekColumn: GridCell[] = [];

      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(firstSunday);
        cellDate.setDate(firstSunday.getDate() + week * 7 + day);

        const dateKey = cellDate.toISOString().split('T')[0];
        
        // Mark cells as null if they're after yesterday or before startDate
        const isNullCell = cellDate > yesterday || cellDate < startDate;
        
        const dayData = isNullCell ? null : (data.get(dateKey) || null);
        const count = isNullCell ? 0 : (dayData?.total || 0);

        weekColumn.push({
          date: cellDate,
          dateKey,
          count,
          dayData: isNullCell ? null : dayData,
          isNullCell,
        });
      }

      grid.push(weekColumn);
    }

    return { grid, maxCount };
  }, [data]);

  // Get month labels with spans for the top of the grid
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; startWeek: number; span: number }> = [];
    let lastMonth = -1;
    let currentLabel: { month: string; startWeek: number; span: number } | null = null;

    gridData.grid.forEach((week, weekIndex) => {
      if (week.length === 0) return;
      
      const firstDay = week[0];
      const month = firstDay.date.getMonth();

      if (month !== lastMonth) {
        // Finish previous label
        if (currentLabel) {
          labels.push(currentLabel);
        }
        
        // Start new label
        const monthName = firstDay.date.toLocaleString('default', { month: 'short' });
        currentLabel = { month: monthName, startWeek: weekIndex, span: 1 };
        lastMonth = month;
      } else if (currentLabel) {
        // Continue current label
        currentLabel.span++;
      }
    });

    // Don't forget the last label
    if (currentLabel) {
      labels.push(currentLabel);
    }

    return labels;
  }, [gridData.grid]);

  // Get collection info helper
  const getCollectionInfo = (collectionName: string) => {
    const config = COLLECTIONS.find((c) => c.collection === collectionName);
    return config || { displayName: collectionName, color: '#999999' };
  };

  // Calculate opacity based on count
  const getOpacity = (count: number): number => {
    if (count === 0) return 0;
    return Math.min(count / gridData.maxCount, 1);
  };

  // Format date for tooltip
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('default', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Activity Heatmap</h2>

      <div className="relative">
        {/* Container with CSS Grid - Scrollable on small screens */}
        <div className="overflow-x-auto pb-2 mb-2">
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', minWidth: 'fit-content' }}>
          {/* Day labels column */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground" style={{ paddingTop: '20px' }}>
            <div style={{ height: '11px' }}></div>
            <div style={{ height: '11px' }}>Mon</div>
            <div style={{ height: '11px' }}></div>
            <div style={{ height: '11px' }}>Wed</div>
            <div style={{ height: '11px' }}></div>
            <div style={{ height: '11px' }}>Fri</div>
            <div style={{ height: '11px' }}></div>
          </div>

          {/* Heatmap column */}
          <div>
            {/* Month labels using CSS Grid */}
            <div 
              className="mb-2" 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${gridData.grid.length}, 11px)`,
                gap: '4px'
              }}
            >
              {monthLabels.map((label, index) => (
                <div
                  key={index}
                  className="text-xs text-muted-foreground"
                  style={{ 
                    gridColumn: `${label.startWeek + 1} / span ${label.span}`
                  }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-1">
              {gridData.grid.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((cell, dayIndex) => {
                    const opacity = getOpacity(cell.count);

                    // Render null cells as invisible placeholders
                    if (cell.isNullCell) {
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className="w-[11px] h-[11px]"
                        />
                      );
                    }

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="relative"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            cell,
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className={`w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-all`}
                          style={{
                            backgroundColor: opacity > 0 ? `rgba(16, 185, 129, ${opacity})` : '#0D1118',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((opacity, index) => (
              <div
                key={index}
                className="w-[11px] h-[11px] rounded-[2px]"
                style={{
                  backgroundColor: opacity === 0 ? '#1f2937' : `rgba(16, 185, 129, ${opacity})`,
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>

        {/* Tooltip (Popover) */}
        {hoveredCell && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 pointer-events-none"
            style={{
              left: `${hoveredCell.x}px`,
              top: `${hoveredCell.y - 10}px`,
              transform: 'translate(-50%, -100%)',
              minWidth: '200px',
            }}
          >
            <div className="font-semibold mb-1">{formatDate(hoveredCell.cell.date)}</div>
            <div className="mb-2">
              <span className="font-medium">{hoveredCell.cell.count}</span>{' '}
              {hoveredCell.cell.count === 1 ? 'record' : 'records'}
            </div>

            {hoveredCell.cell.dayData && hoveredCell.cell.count > 0 && (
              <div className="space-y-1 pt-2 border-t border-gray-700">
                {Object.entries(hoveredCell.cell.dayData.byCollection).map(([collection, count]) => {
                  const info = getCollectionInfo(collection);
                  return (
                    <div key={collection} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: info.color }}
                        />
                        <span>{info.displayName}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
