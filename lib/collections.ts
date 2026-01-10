/**
 * Configuration for AT Protocol collections
 * Defines metadata for each supported collection type
 */

export interface CollectionConfig {
  /** The full AT Proto collection identifier */
  collection: string;
  /** Human-readable display name */
  displayName: string;
  /** Property name in the record that contains the timestamp */
  timestampProperty: string;
  /** Hex color code for UI display */
  color: string;
}

/**
 * Supported AT Protocol collections with their metadata
 */
export const COLLECTIONS: CollectionConfig[] = [
  {
    collection: 'app.bsky.feed.post',
    displayName: 'Bluesky',
    timestampProperty: 'createdAt',
    color: '#1DA1F2'
  },
  {
    collection: 'pub.leaflet.document',
    displayName: 'Leaflet',
    timestampProperty: 'publishedAt',
    color: '#10B981'
  },
  {
    collection: 'com.whtwnd.blog.entry',
    displayName: 'WhiteWind',
    timestampProperty: 'createdAt',
    color: '#F3F4F6'
  },
  {
    collection: 'events.smokesignal.calendar.event',
    displayName: 'Smoke Signal',
    timestampProperty: 'createdAt',
    color: '#0AD0B2'
  },
  {
    collection: 'fyi.unravel.frontpage.post',
    displayName: 'Frontpage',
    timestampProperty: 'createdAt',
    color: '#7C85FF'
  },
  {
    collection: 'exchange.recipe.recipe',
    displayName: 'Recipe Exchange',
    timestampProperty: 'createdAt',
    color: '#F59E0B'
  },
  {
    collection: 'so.sprk.feed.post',
    displayName: 'Sprk',
    timestampProperty: 'createdAt',
    color: '#A855F7'
  },
  {
    collection: 'social.popfeed.feed.review',
    displayName: 'PopFeed',
    timestampProperty: 'createdAt',
    color: '#EAB308'
  },
  {
    collection: 'sh.tangled.repo',
    displayName: 'Tangled Repo',
    timestampProperty: 'createdAt',
    color: '#475569'
  },
  {
    collection: 'sh.tangled.string',
    displayName: 'Tangled String',
    timestampProperty: 'createdAt',
    color: '#475569'
  },
  {
    collection: 'fm.plyr.track',
    displayName: 'Plyr',
    timestampProperty: 'createdAt',
    color: '#EF4444'
  },
  {
    collection: 'app.sidetrail.trail',
    displayName: 'Sidetrail',
    timestampProperty: 'createdAt',
    color: '#22C55E'
  },
  {
    collection: 'app.sidetrail.completion',
    displayName: 'Sidetrail Completion',
    timestampProperty: 'createdAt',
    color: '#22C55E'
  },
  {
    collection: 'community.nooki.posts',
    displayName: 'Nooki',
    timestampProperty: 'createdAt',
    color: '#F97316'
  },
  {
    collection: 'social.grain.photo',
    displayName: 'Grain Photo',
    timestampProperty: 'createdAt',
    color: '#CA8A04'
  },
  {
    collection: 'social.grain.gallery',
    displayName: 'Grain Gallery',
    timestampProperty: 'createdAt',
    color: '#CA8A04'
  },
  {
    collection: 'app.dropanchor.checkin',
    displayName: 'DropAnchor',
    timestampProperty: 'createdAt',
    color: '#06B6D4'
  },
  {
    collection: 'app.beaconbits.beacon',
    displayName: 'BeaconBits',
    timestampProperty: 'createdAt',
    color: '#F59E0B'
  },
  {
    collection: 'social.kibun.status',
    displayName: 'Kibun',
    timestampProperty: 'createdAt',
    color: '#84CC16'
  },
  {
    collection: 'io.zzstoatzz.status.record',
    displayName: 'zzstoatzz',
    timestampProperty: 'createdAt',
    color: '#6366F1'
  }
];

/**
 * Get collection config by collection identifier
 */
export function getCollectionConfig(collection: string): CollectionConfig | undefined {
  return COLLECTIONS.find(c => c.collection === collection);
}

/**
 * Get all collection identifiers
 */
export function getCollectionNames(): string[] {
  return COLLECTIONS.map(c => c.collection);
}
