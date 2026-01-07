import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { ProfileClient } from "./ProfileClient";

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
    
    // Use the deployed URL from environment variable (Netlify provides this automatically)
    const baseUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const ogUrl = `${baseUrl}/api/og?handle=${encodeURIComponent(profile.handle)}`;

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

        {/* Profile Header and Content */}
        <ProfileClient handle={decodedHandle} profile={profile} />
      </div>
    </div>
  );
}



