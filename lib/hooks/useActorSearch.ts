'use client';

import { useState, useEffect } from 'react';
import { searchActors, ActorResult } from '@/app/actions/searchActors';

export interface UseActorSearchReturn {
  actors: ActorResult[];
  isSearching: boolean;
}

export function useActorSearch(query: string): UseActorSearchReturn {
  const [actors, setActors] = useState<ActorResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Skip search for empty or very short queries
    if (!query || query.trim().length < 2) {
      setActors([]);
      setIsSearching(false);
      return;
    }

    // Debounce the search by 300ms
    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await searchActors(query);
        if (result.success) {
          setActors(result.actors);
        } else {
          setActors([]);
        }
      } catch (error) {
        console.error('Error in useActorSearch:', error);
        setActors([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    // Cleanup function to cancel the timeout if query changes
    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [query]);

  return { actors, isSearching };
}
