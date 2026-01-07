'use server';

import { Agent } from '@atproto/api';

export interface ActorResult {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface SearchActorsResult {
  success: boolean;
  actors: ActorResult[];
  error?: string;
}

export async function searchActors(query: string): Promise<SearchActorsResult> {
  try {
    // Validate input
    const cleanQuery = query.trim();
    if (!cleanQuery || cleanQuery.length < 2) {
      return { success: true, actors: [] };
    }

    // Create agent with public Bluesky API
    const agent = new Agent('https://public.api.bsky.app');

    // Search for actors with limit of 5
    const response = await agent.app.bsky.actor.searchActors({
      q: cleanQuery,
      limit: 5,
    });

    // Map response to our interface
    const actors: ActorResult[] = response.data.actors.map((actor) => ({
      did: actor.did,
      handle: actor.handle,
      displayName: actor.displayName,
      avatar: actor.avatar,
    }));

    return {
      success: true,
      actors,
    };
  } catch (error) {
    console.error('Error searching actors:', error);
    return {
      success: false,
      actors: [],
      error: 'Failed to search actors',
    };
  }
}
