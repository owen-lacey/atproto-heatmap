'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { lookupHandle } from '@/app/actions/lookupHandle';

export function HandleForm({
  searchParams,
}: {
  searchParams?: Promise<{ handle?: string }>;
}) {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Prepopulate from query param
  useEffect(() => {
    if (searchParams) {
      searchParams.then((params) => {
        if (params.handle) {
          setHandle(decodeURIComponent(params.handle));
        }
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await lookupHandle(handle);

      if (!result.success) {
        setError(result.error || 'Failed to lookup handle');
        return;
      }

      // Redirect to profile page to show real-time progress
      const cleanHandle = handle.trim().replace(/^@/, '');
      router.push(`/profile/${encodeURIComponent(cleanHandle)}`);
    } catch (err) {
      console.error('Error submitting handle:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-md">
      <div className="flex-1 space-y-2">
        <Input
          type="text"
          placeholder="handle.bsky.social"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="h-12 text-base bg-card border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
          disabled={isSubmitting}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || !handle.trim()}
        className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Looking up...
          </span>
        ) : (
          "Browse"
        )}
      </Button>
    </form>
  );
}
