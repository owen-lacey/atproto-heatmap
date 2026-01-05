'use client';

import { useHandleStatus } from '@/lib/hooks/useHandleStatus';
import { useRecordCounts } from '@/lib/hooks/useRecordCounts';
import { useHeatmapData } from '@/lib/hooks/useHeatmapData';
import { HydrationProgress } from '@/components/HydrationProgress';
import { Heatmap } from '@/components/Heatmap';
import { ProfileHeader } from '@/components/ProfileHeader';

interface ProfileClientProps {
  handle: string;
  profile: {
    handle: string;
    displayName?: string;
    avatar?: string;
    description?: string;
  };
}

export function ProfileClient({ handle, profile }: ProfileClientProps) {
  // Fetch handle status and subscribe to updates
  const { recordId, status, error } = useHandleStatus(handle);

  // Fetch heatmap data when complete
  const heatmapData = useHeatmapData(status === 'complete' ? recordId : null);

  // Show hydration progress when not complete
  if (status !== 'complete') {
    return (
      <>
        <ProfileHeader profile={profile} />
        <HydrationProgress status={status} error={error} />
      </>
    );
  }

  // Show heatmap when complete
  if (heatmapData) {
    return (
      <div className="space-y-6">
        <ProfileHeader profile={profile} heatmapData={heatmapData} />
        <Heatmap data={heatmapData} />
      </div>
    );
  }

  // Loading state for heatmap data
  return (
    <div className="bg-card rounded-lg border border-border p-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-muted-foreground">Loading heatmap data...</span>
        </div>
      </div>
    </div>
  );
}
