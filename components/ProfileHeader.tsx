'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CollectionBreakdown } from '@/components/CollectionBreakdown';
import type { DayData } from '@/lib/hooks/useHeatmapData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProfileHeaderProps {
  profile: {
    handle: string;
    displayName?: string;
    avatar?: string;
    description?: string;
  };
  heatmapData?: Map<string, DayData> | null;
}

export function ProfileHeader({ profile, heatmapData }: ProfileHeaderProps) {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm(`Are you sure you want to reset all data for @${profile.handle}? This will delete all cached posts and require re-hydration.`)) {
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: profile.handle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset data');
      }

      router.push(`/?handle=${encodeURIComponent(profile.handle)}`);
    } catch (error) {
      console.error('Error resetting data:', error);
      alert(error instanceof Error ? error.message : 'Failed to reset data. Please try again.');
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start relative">
        {/* Context Menu - positioned absolutely in top-right */}
        <div className="absolute top-0 right-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-md hover:bg-accent transition-colors" disabled={isResetting}>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReset} disabled={isResetting} className="text-destructive focus:text-destructive">
                {isResetting ? 'Resetting...' : 'Reset Data'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Avatar */}
        <div className="shrink-0">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={`${profile.displayName || profile.handle} avatar`}
              className="w-24 h-24 rounded-full border-2 border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {(profile.displayName || profile.handle).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Profile Info with Collection Breakdown */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {profile.displayName || profile.handle}
            </h1>
            <p className="text-muted-foreground">@{profile.handle}</p>
          </div>

          {/* Inline Collection Breakdown */}
          {heatmapData && <CollectionBreakdown data={heatmapData} />}
        </div>
      </div>
    </div>
  );
}
