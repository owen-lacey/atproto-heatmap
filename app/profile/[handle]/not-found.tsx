import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="space-y-6 max-w-lg">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Profile Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The profile you&apos;re looking for doesn&apos;t exist on Bluesky or couldn&apos;t be loaded.
          </p>
          <div className="text-sm text-muted-foreground space-y-2 text-left bg-secondary/30 rounded-lg p-4">
            <p className="font-medium text-foreground">Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Make sure you&apos;re using a valid Bluesky handle</li>
              <li>Handles usually end in <code className="text-primary">.bsky.social</code> or a custom domain</li>
              <li>You can also use a DID like <code className="text-primary">did:plc:...</code></li>
              <li>Try searching on <a href="https://bsky.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">bsky.app</a> first</li>
            </ul>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/profile/jay.bsky.team">
              Try an Example
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

