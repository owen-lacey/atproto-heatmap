import { Agent } from '@atproto/api';
import { IdResolver, getPds } from '@atproto/identity';

export async function getPdsAgent(handle: string): Promise<{ agent: Agent; did: string }> {
  const resolver = new IdResolver();
  const did = (await resolver.handle.resolve(handle));
  if (!did) {
    throw new Error(`Unable to resolve DID for handle: ${handle}`);
  }
  
  const didDoc = (await resolver.did.resolve(did));
  if (!didDoc) {
    throw new Error(`Unable to resolve DID document for DID: ${did}`);
  }
  const pds = getPds(didDoc);
  if (!pds) {
    throw new Error(`No PDS found in DID document for DID: ${did}`);
  }
  
  const agent = new Agent(pds);
  return { agent, did };
}

// Get a profile by handle
export async function getProfile(handle: string): Promise<{
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
}> {
  const cleanHandle = handle.replace(/^@/, '');

  const resolver = new IdResolver();
  const did = await resolver.handle.resolve(cleanHandle);
  if (!did) {
    throw new Error(`Unable to resolve DID for handle: ${cleanHandle}`);
  }

  const { agent } = await getPdsAgent(cleanHandle);

  // Check for !no-unauthenticated label via app.bsky.actor.getProfile
  // This uses the public Bluesky API to check if user has opted out
  try {
    const publicAgent = new Agent('https://public.api.bsky.app');
    const profileResponse = await publicAgent.app.bsky.actor.getProfile({
      actor: cleanHandle
    });

    // Check if profile has the !no-unauthenticated label
    const labels = profileResponse.data.labels || [];
    const hasNoUnauthLabel = labels.some(
      (label: any) => label.val === '!no-unauthenticated'
    );

    if (hasNoUnauthLabel) {
      throw new Error('OPT_OUT:This user has opted out of public indexing');
    }
  } catch (error: any) {
    // If the error is our opt-out error, re-throw it
    if (error.message?.startsWith('OPT_OUT:')) {
      throw error;
    }
    // Otherwise, log but continue - we don't want API issues to block access
    console.warn('Failed to check !no-unauthenticated label:', error);
  }

  // Get the profile record directly from the repo
  const response = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: 'app.bsky.actor.profile',
    rkey: 'self'
  });

  const profile = response.data.value as any;
  
  // Construct avatar URL if avatar blob exists
  let avatarUrl: string | undefined;
  if (profile.avatar?.ref && profile.avatar?.mimeType) {
    // The avatar.ref is a CID object, convert it to string
    const cidString = profile.avatar.ref.toString();
    // Get file extension from mime type
    const mimeType = profile.avatar.mimeType;
    let extension = 'jpeg'; // default
    if (mimeType === 'image/png') {
      extension = 'png';
    } else if (mimeType === 'image/gif') {
      extension = 'gif';
    } else if (mimeType === 'image/webp') {
      extension = 'webp';
    } else if (mimeType === 'image/jpeg') {
      extension = 'jpeg';
    }
    avatarUrl = `https://cdn.bsky.app/img/avatar/plain/${did}/${cidString}@${extension}`;
  }
  
  return {
    did,
    handle: cleanHandle,
    displayName: profile.displayName,
    description: profile.description,
    avatar: avatarUrl
  };
}

// Format large numbers (e.g., 1234 -> 1.2K)
export function formatNumber(num: number | undefined): string {
  if (num === undefined) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

