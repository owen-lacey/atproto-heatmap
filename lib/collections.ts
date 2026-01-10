/**
 * Configuration for AT Protocol collections
 * Defines metadata for each supported collection type
 */

export interface CollectionConfig {
  /** Array of full AT Proto collection identifiers for this app */
  collections: string[];
  /** Human-readable display name (app name for grouped entries) */
  displayName: string;
  /** Property name in the record that contains the timestamp (consistent within group) */
  timestampProperty: string;
  /** Hex color code for UI display (consistent within group) */
  color: string;
}

/**
 * Supported AT Protocol collections with their metadata
 */
export const COLLECTIONS: CollectionConfig[] = [
  {
    collections: ['app.bsky.feed.post'],
    displayName: 'Bluesky',
    timestampProperty: 'createdAt',
    color: '#1DA1F2'
  },
  {
    collections: ['pub.leaflet.document'],
    displayName: 'Leaflet',
    timestampProperty: 'publishedAt',
    color: '#10B981'
  },
  {
    collections: ['com.whtwnd.blog.entry'],
    displayName: 'WhiteWind',
    timestampProperty: 'createdAt',
    color: '#F3F4F6'
  },
  {
    collections: ['events.smokesignal.calendar.event'],
    displayName: 'Smoke Signal',
    timestampProperty: 'createdAt',
    color: '#0AD0B2'
  },
  {
    collections: ['fyi.unravel.frontpage.post'],
    displayName: 'Frontpage',
    timestampProperty: 'createdAt',
    color: '#7C85FF'
  },
  {
    collections: ['exchange.recipe.recipe'],
    displayName: 'Recipe Exchange',
    timestampProperty: 'createdAt',
    color: '#F59E0B'
  },
  {
    collections: ['so.sprk.feed.post'],
    displayName: 'Sprk',
    timestampProperty: 'createdAt',
    color: '#A855F7'
  },
  {
    collections: ['social.popfeed.feed.review'],
    displayName: 'PopFeed',
    timestampProperty: 'createdAt',
    color: '#EAB308'
  },
  {
    collections: ['sh.tangled.repo', 'sh.tangled.string'],
    displayName: 'Tangled',
    timestampProperty: 'createdAt',
    color: '#475569'
  },
  {
    collections: ['fm.plyr.track'],
    displayName: 'Plyr',
    timestampProperty: 'createdAt',
    color: '#EF4444'
  },
  {
    collections: ['app.sidetrail.trail', 'app.sidetrail.completion'],
    displayName: 'Sidetrail',
    timestampProperty: 'createdAt',
    color: '#22C55E'
  },
  {
    collections: ['community.nooki.posts'],
    displayName: 'Nooki',
    timestampProperty: 'createdAt',
    color: '#F97316'
  },
  {
    collections: ['social.grain.photo', 'social.grain.gallery'],
    displayName: 'Grain',
    timestampProperty: 'createdAt',
    color: '#CA8A04'
  },
  {
    collections: ['app.dropanchor.checkin'],
    displayName: 'DropAnchor',
    timestampProperty: 'createdAt',
    color: '#06B6D4'
  },
  {
    collections: ['app.beaconbits.beacon'],
    displayName: 'BeaconBits',
    timestampProperty: 'createdAt',
    color: '#F59E0B'
  },
  {
    collections: ['social.kibun.status'],
    displayName: 'Kibun',
    timestampProperty: 'createdAt',
    color: '#84CC16'
  },
  {
    collections: ['io.zzstoatzz.status.record'],
    displayName: 'status',
    timestampProperty: 'createdAt',
    color: '#6366F1'
  }
];

/**
 * Get collection config by collection identifier
 */
export function getCollectionConfig(collection: string): CollectionConfig | undefined {
  return COLLECTIONS.find(c => c.collections.includes(collection));
}

/**
 * Get all collection identifiers
 */
export function getCollectionNames(): string[] {
  return COLLECTIONS.flatMap(c => c.collections);
}
