import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { HydrationProgress } from "@/components/HydrationProgress";

interface ProfilePageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { handle } = await params;
  const decodedHandle = decodeURIComponent(handle);

  const supabase = createServerClient();
  const { data } = await supabase
    .from('handles')
    .select('at_proto_data')
    .eq('handle', decodedHandle)
    .maybeSingle();

  if (data?.at_proto_data) {
    const profile = data.at_proto_data as any;
    const title = profile.displayName
      ? `${profile.displayName} (@${profile.handle}) - ATProto Heatmap`
      : `@${profile.handle} - ATProto Heatmap`;
    const description = profile.description || `View ${profile.handle}'s activity heatmap`;
    const ogUrl = `/api/og?handle=${encodeURIComponent(profile.handle)}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
        images: [
          {
            url: ogUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogUrl],
      },
    };
  }

  return {
    title: "Profile Not Found",
    description: "The requested profile could not be found.",
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const decodedHandle = decodeURIComponent(handle);

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('handles')
    .select('at_proto_data, handle')
    .ilike('handle', decodedHandle)
    .maybeSingle();


  if (error || !data?.at_proto_data) {
    console.error("Error fetching profile:", error);
    notFound();
  }

  const profile = data.at_proto_data as any;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-foreground">@{profile.handle}</span>
        </nav>

        {/* Profile Header */}
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

            {/* Profile Info */}
            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.displayName || profile.handle}
                </h1>
                <p className="text-muted-foreground">@{profile.handle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hydration Progress */}
        <HydrationProgress handle={decodedHandle} />

        {/* Heatmap Placeholder */}
        <div className="bg-card rounded-lg border border-border p-8">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Activity Heatmap</h2>
            <p className="text-muted-foreground">
              Heatmap visualization will be implemented here to show {profile.displayName || profile.handle}'s AT Protocol activity over time.
            </p>
            <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">📊 Heatmap coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



