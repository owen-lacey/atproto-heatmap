import { CollectionBreakdown } from '@/components/CollectionBreakdown';
import type { DayData } from '@/lib/hooks/useHeatmapData';

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
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
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
