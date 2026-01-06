'use client';

import { useHandleStatus } from '@/lib/hooks/useHandleStatus';
import { useRecordCounts } from '@/lib/hooks/useRecordCounts';
import { useHeatmapData } from '@/lib/hooks/useHeatmapData';
import { HydrationProgress } from '@/components/HydrationProgress';
import { Heatmap } from '@/components/Heatmap';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileCardLoading } from './loading';

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
  const { recordId, status } = useHandleStatus(handle);

  // Fetch heatmap data when complete
  const heatmapData = useHeatmapData(status === 'complete' ? recordId : null);

  // Show hydration progress when not complete
  if (!heatmapData) {
    return <ProfileCardLoading />;
  }
  return (
    <div className="space-y-6">
      <ProfileHeader profile={profile} heatmapData={heatmapData} />
      <Heatmap data={heatmapData} />
    </div>
  );
}
