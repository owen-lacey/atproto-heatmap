import { Skeleton } from "@/components/ui/skeleton";

export function ProfileCardLoading() {
  return (
    <div className="space-y-6">
      {/* Profile Header skeleton - matching ProfileHeader component */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="shrink-0">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>

            {/* Profile Info with Collection Breakdown */}
            <div className="flex-1 space-y-4">
              <div>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
              
              {/* Collection Breakdown skeleton */}
              <div>
                {/* Progress bar */}
                <Skeleton className="h-2 w-full rounded-full mb-4" />
                
                {/* Collection list */}
                <div className="space-y-3">
                  {Array.from({ length: 1 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap skeleton - matching Heatmap component */}
        <div className="bg-card rounded-lg border border-border p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          
          <div className="relative">
            <div className="overflow-x-auto pb-2 mb-2">
              <div className="flex gap-2" style={{ minWidth: 'fit-content' }}>
                {/* Day labels */}
                <div className="flex flex-col gap-1 text-xs" style={{ paddingTop: '20px' }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{ height: '11px' }}>
                      {i % 2 === 1 && <Skeleton className="h-3 w-6" />}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div>
                  {/* Month labels */}
                  <div className="mb-2 flex gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="h-3 w-8" />
                    ))}
                  </div>

                  {/* Grid cells */}
                  <div className="flex gap-1">
                    {Array.from({ length: 53 }).map((_, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, dayIndex) => (
                          <Skeleton
                            key={`${weekIndex}-${dayIndex}`}
                            className="w-[11px] h-[11px] rounded-[2px]"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4">
              <Skeleton className="h-3 w-8" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-[11px] h-[11px] rounded-[2px]" />
                ))}
              </div>
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb skeleton */}
        <nav className="flex items-center gap-2 text-sm">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </nav>

        <ProfileCardLoading />
      </div>
    </div>
  );
}

