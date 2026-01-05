'use client';

import { useCallback } from 'react';
import { COLLECTIONS } from '@/lib/collections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/supabase';

type HandleStatus = Database['public']['Tables']['handles']['Row']['status'];

interface HydrationProgressProps {
  status: HandleStatus | 'idle';
  error: string | null;
}

export function HydrationProgress({ status, error }: HydrationProgressProps) {

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'pending') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-blue-800">Initializing...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'hydrating') {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span className="text-blue-800 font-medium">Fetching records...</span>
              </div>
              <p className="text-sm text-blue-700">
                Collecting data from the past year. This may take a few minutes depending on your activity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
