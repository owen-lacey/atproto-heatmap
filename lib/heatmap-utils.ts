import type { DayData } from './hooks/useHeatmapData';

export interface GridCell {
  date: Date;
  dateKey: string;
  count: number;
  dayData: DayData | null;
  isNull: boolean;
}

export interface HeatmapGridData {
  grid: GridCell[][];
  maxCount: number;
}

/**
 * Generates a 53-week heatmap grid for the last 365 days
 * @param data - Map of date keys to day data
 * @returns Grid data with cells organized by week/day and the maximum count
 */
export function generateHeatmapGrid(data: Map<string, DayData>): HeatmapGridData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Yesterday is the last day we should show
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Calculate the start date (364 days ago)
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
      const isNull = cellDate > yesterday || cellDate < startDate;
      
      const dayData = isNull ? null : (data.get(dateKey) || null);
      const count = isNull ? 0 : (dayData?.total || 0);

      weekColumn.push({
        date: cellDate,
        dateKey,
        count,
        dayData: isNull ? null : dayData,
        isNull,
      });
    }

    grid.push(weekColumn);
  }

  return { grid, maxCount };
}

/**
 * Generates month labels with their position and span for display above the heatmap
 * @param grid - The heatmap grid data
 * @returns Array of month labels with their start position and span
 */
export function generateMonthLabels(grid: GridCell[][]): Array<{ month: string; startWeek: number; span: number }> {
  const labels: Array<{ month: string; startWeek: number; span: number }> = [];
  let lastMonth = -1;
  let currentLabel: { month: string; startWeek: number; span: number } | null = null;

  grid.forEach((week, weekIndex) => {
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
}
