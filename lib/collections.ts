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
