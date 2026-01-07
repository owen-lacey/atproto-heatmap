import { ImageResponse } from 'next/og';
import { getProfile } from '@/lib/atproto';
import { createServerClient } from '@/lib/supabase';
import { COLLECTIONS } from '@/lib/collections';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

interface DayData {
  total: number;
  byCollection: Record<string, number>;
}

interface CollectionStat {
  collection: string;
  displayName: string;
  color: string;
  count: number;
  percentage: number;
}

// Fetch heatmap data from Supabase
async function fetchHeatmapData(handleId: string): Promise<Map<string, DayData>> {
  const supabase = createServerClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoffDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

  const allRecords: Array<{ collection: string; timestamp: string }> = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('records')
      .select('collection, timestamp')
      .eq('handle_id', handleId)
      .gte('timestamp', cutoffDate.toISOString())
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching records:', error);
      break;
    }

    if (data && data.length > 0) {
      allRecords.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    } else {
      hasMore = false;
    }
  }

  // Aggregate records by date
  const dataMap = new Map<string, DayData>();
  allRecords.forEach((record) => {
    const date = new Date(record.timestamp);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    const existing = dataMap.get(dateKey);
    if (existing) {
      existing.total += 1;
      existing.byCollection[record.collection] = (existing.byCollection[record.collection] || 0) + 1;
    } else {
      dataMap.set(dateKey, {
        total: 1,
        byCollection: { [record.collection]: 1 },
      });
    }
  });

  return dataMap;
}

// Generate heatmap grid data
function generateGridData(data: Map<string, DayData>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const startDate = new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000);

  const dayOfWeek = startDate.getDay();
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - dayOfWeek);

  const grid: Array<Array<{ count: number; isNull: boolean }>> = [];
  const maxCount = Math.max(...Array.from(data.values()).map((d) => d.total), 1);

  for (let week = 0; week < 53; week++) {
    const weekColumn: Array<{ count: number; isNull: boolean }> = [];
    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(firstSunday);
      cellDate.setDate(firstSunday.getDate() + week * 7 + day);
      const dateKey = cellDate.toISOString().split('T')[0];
      const isNull = cellDate > yesterday || cellDate < startDate;
      const dayData = isNull ? null : data.get(dateKey);
      const count = isNull ? 0 : (dayData?.total || 0);
      weekColumn.push({ count, isNull });
    }
    grid.push(weekColumn);
  }

  return { grid, maxCount };
}

// Get collection stats
function getCollectionStats(data: Map<string, DayData>): { stats: CollectionStat[]; total: number } {
  const collectionTotals = new Map<string, number>();
  let grandTotal = 0;

  data.forEach((dayData) => {
    Object.entries(dayData.byCollection).forEach(([collection, count]) => {
      collectionTotals.set(collection, (collectionTotals.get(collection) || 0) + count);
      grandTotal += count;
    });
  });

  const collectionStats: CollectionStat[] = [];
  collectionTotals.forEach((count, collection) => {
    const config = COLLECTIONS.find((c) => c.collection === collection);
    collectionStats.push({
      collection,
      displayName: config?.displayName || collection,
      color: config?.color || '#999999',
      count,
      percentage: grandTotal > 0 ? (count / grandTotal) * 100 : 0,
    });
  });

  collectionStats.sort((a, b) => b.count - a.count);
  return { stats: collectionStats, total: grandTotal };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  try {
    if (handle) {
      return await generateProfileOG(handle);
    }
    return generateDefaultOG();
  } catch (error) {
    console.error('Error generating OG image:', error);
    return generateDefaultOG();
  }
}

async function generateProfileOG(handle: string) {
  const profile = await getProfile(handle);

  // Find handle record in Supabase
  const supabase = createServerClient();
  const { data: handleRecord } = await supabase
    .from('handles')
    .select('id, status')
    .eq('handle', handle)
    .single();

  let heatmapData = new Map<string, DayData>();
  let collectionStats: { stats: CollectionStat[]; total: number } = { stats: [], total: 0 };
  let gridData: { grid: Array<Array<{ count: number; isNull: boolean }>>; maxCount: number } = { grid: [], maxCount: 1 };

  if (handleRecord?.status === 'complete') {
    heatmapData = await fetchHeatmapData(handleRecord.id);
    collectionStats = getCollectionStats(heatmapData);
    gridData = generateGridData(heatmapData);
  }

  const hasData = collectionStats.total > 0;
  const CELL_SIZE = 10;
  const CELL_GAP = 3;

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          padding: 48,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header with logo, avatar, and profile info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
            }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 39 39"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="blueGradient"
                  x1="3.88"
                  y1="37.78"
                  x2="3.88"
                  y2="10.78"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#125584" />
                  <stop offset="100%" stopColor="#5DC7F3" />
                </linearGradient>
              </defs>
              <path
                fill="url(#blueGradient)"
                d="m 35.982422,1.2539062 c 0.01559,0.025359 -0.561715,1.9946906 -1.058594,2.9199162 -1.929797,3.2135884 -4.707812,6.5185656 -8.158203,6.0585936 0,0 0.877594,-1.505097 1.183253,-3.0545475 0.306329,-1.5528497 0.14601,-3.1978433 -0.362942,-4.9884211 l -0.002,-0.00195 h -0.002 l -0.002,-0.00195 h -0.002 l -0.002,-0.00195 h -0.002 -0.002 l -0.002,0.00195 h -0.002 c 0.0036,0.012096 -0.558211,1.7710993 -2.294921,3.5078125 -2.231421,2.2314196 -5.383693,3.9142439 -8.572266,4.5800791 -0.370553,-0.02038 -0.749935,-0.0293 -1.136719,-0.0293 -1.86,0 -3.606281,0.305968 -5.238281,0.917968 -1.5971549,0.597654 -3.0548795,1.516293 -4.2832032,2.699219 -1.2240001,1.176 -2.1848594,2.627468 -2.8808594,4.355469 -0.684,1.728 -1.0253906,3.709406 -1.0253906,5.941406 0,1.872 0.3302343,3.605172 0.9902343,5.201172 0.638594,1.564886 1.5941865,2.980652 2.8066407,4.158203 1.212,1.188 2.6411565,2.105906 4.2851562,2.753906 1.644,0.648 3.444391,0.972657 5.400391,0.972657 1.034612,9.29e-4 2.066412,-0.10775 3.078125,-0.324219 1.02,-0.204 1.992015,-0.523078 2.916015,-0.955078 l -1.027343,-2.806641 c -0.696,0.336 -1.462735,0.593438 -2.302735,0.773438 -0.828,0.192 -1.661953,0.287109 -2.501953,0.287109 -1.5,0 -2.880625,-0.233172 -4.140625,-0.701172 C 10.419406,33.073934 9.3040566,32.381579 8.3648114,31.484373 7.4287992,30.57862 6.6929394,29.486807 6.2046551,28.279295 c -0.516,-1.248 -0.7977031,-2.650938 -0.8457031,-4.210938 -0.024,-1.572 0.1849063,-3.012312 0.6289062,-4.320312 0.456,-1.32 1.1276251,-2.459922 2.015625,-3.419922 0.9,-0.972 2.0044998,-1.722 3.3124998,-2.25 1.308,-0.54 2.802422,-0.810547 4.482422,-0.810547 1.188,0 2.382031,0.179063 3.582031,0.539063 1.199465,0.348273 2.318471,0.929678 3.292969,1.710937 1.008,0.78 1.806531,1.806125 2.394531,3.078125 0.588,1.272 0.864125,2.837266 0.828125,4.697266 -0.01367,0.709106 -0.09807,1.415079 -0.251953,2.107422 -0.132,0.612 -0.372703,1.097031 -0.720703,1.457031 -0.336,0.348 -0.815453,0.521484 -1.439453,0.521484 -0.708,0 -1.241563,-0.233172 -1.601563,-0.701172 -0.359999,-0.468 -0.541015,-1.16389 -0.541015,-2.08789 l 0.05469,-6.462891 h -2.412109 v 0.644531 c -0.354765,-0.26141 -0.768953,-0.482147 -1.242187,-0.662109 -0.84,-0.324 -1.649688,-0.486328 -2.429688,-0.486328 -1.176,0 -2.231969,0.25939 -3.167969,0.775391 -0.932254,0.512028 -1.70484,1.271772 -2.2324216,2.195312 -0.552,0.936 -0.828125,2.046078 -0.828125,3.330078 0,1.248 0.2649687,2.344969 0.7929687,3.292969 0.5061099,0.926217 1.2602009,1.693158 2.1777349,2.214844 0.924,0.516 1.991125,0.773437 3.203124,0.773437 0.899696,-0.0018 1.78911,-0.191385 2.611329,-0.55664 0.555666,-0.242615 1.03496,-0.60267 1.4375,-1.080079 0.33573,0.480911 0.780891,0.875197 1.298828,1.150391 0.866968,0.468999 1.838555,0.710888 2.824219,0.703125 11.186505,0 14.447286,-18.339796 14.470098,-18.358077 0,0 -1.256827,1.823643 -2.367987,2.606778 -0.799441,0.563438 -2.263515,1.134044 -3.762404,1.291883 0,0 2.245814,-3.052335 3.683537,-6.7294265 1.61122,-4.1208243 0.529922,-7.9791243 0.529922,-7.9791243 z M 15.564453,20.666016 c 0.924,0 1.638578,0.276125 2.142578,0.828125 0.516,0.54 0.773438,1.344109 0.773438,2.412109 0,1.176 -0.287281,2.009953 -0.863281,2.501953 -0.576,0.492 -1.290579,0.738281 -2.142579,0.738281 -0.996,0 -1.775843,-0.283656 -2.339843,-0.847656 -0.552,-0.564 -0.828125,-1.360578 -0.828125,-2.392578 0,-1.008 0.270547,-1.800953 0.810547,-2.376953 0.54,-0.576 1.355265,-0.863281 2.447265,-0.863281 z"
              />
            </svg>
          </div>

          {/* Avatar */}
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt=""
              width={80}
              height={80}
              style={{
                borderRadius: 40,
                border: '3px solid #333',
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                background: '#333',
                border: '3px solid #444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 'bold',
                color: '#888',
              }}
            >
              {(profile.displayName || profile.handle).charAt(0).toUpperCase()}
            </div>
          )}

          {/* Profile info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', fontSize: 36, fontWeight: 'bold', color: '#fff' }}>
              {profile.displayName || profile.handle}
            </div>
            <div style={{ display: 'flex', fontSize: 20, color: '#888' }}>
              @{profile.handle}
            </div>
          </div>

          {/* Stats */}
          {hasData && (
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 'bold', color: '#10B981' }}>
                {collectionStats.total.toLocaleString()}
              </div>
              <div style={{ display: 'flex', fontSize: 16, color: '#888' }}>
                records this year
              </div>
            </div>
          )}
        </div>

        {/* Collection Breakdown Bar */}
        {hasData && (
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
            {collectionStats.stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  width: `${stat.percentage}%`,
                  backgroundColor: stat.color,
                  height: '100%',
                }}
              />
            ))}
          </div>
        )}

        {/* Collection Labels */}
        {hasData && (
          <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
            {collectionStats.stats.slice(0, 5).map((stat, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: stat.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', fontSize: 14, color: '#ccc' }}>
                  {stat.displayName}
                </div>
                <div style={{ display: 'flex', fontSize: 14, color: '#666' }}>
                  {stat.percentage.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Heatmap Grid */}
        {hasData && gridData.grid.length > 0 ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: CELL_GAP }}>
              {gridData.grid.map((week, weekIndex) => (
                <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP }}>
                  {week.map((cell, dayIndex) => {
                    const opacity = cell.isNull ? 0 : (cell.count === 0 ? 0 : Math.min(cell.count / gridData.maxCount, 1));
                    return (
                      <div
                        key={dayIndex}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          borderRadius: 2,
                          backgroundColor: cell.isNull
                            ? 'transparent'
                            : opacity > 0
                            ? `rgba(16, 185, 129, ${Math.max(opacity, 0.15)})`
                            : '#1f2937',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', fontSize: 24, color: '#666' }}>
              {handleRecord?.status === 'hydrating' ? 'Loading activity data...' : 'No activity data yet'}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ display: 'flex', fontSize: 14, color: '#666' }}>
            ATProto Heatmap
          </div>
          {/* Legend */}
          {hasData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', fontSize: 12, color: '#666' }}>Less</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 0.25, 0.5, 0.75, 1].map((opacity, index) => (
                  <div
                    key={index}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: opacity === 0 ? '#1f2937' : `rgba(16, 185, 129, ${opacity})`,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', fontSize: 12, color: '#666' }}>More</div>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}

function generateDefaultOG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          fontFamily: 'system-ui, sans-serif',
          gap: 24,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
          }}
        >
          <svg
            width="100"
            height="100"
            viewBox="0 0 39 39"
            fill="none"
          >
            <defs>
              <linearGradient
                id="blueGradientDefault"
                x1="3.88"
                y1="37.78"
                x2="3.88"
                y2="10.78"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#125584" />
                <stop offset="100%" stopColor="#5DC7F3" />
              </linearGradient>
            </defs>
            <path
              fill="url(#blueGradientDefault)"
              d="m 35.982422,1.2539062 c 0.01559,0.025359 -0.561715,1.9946906 -1.058594,2.9199162 -1.929797,3.2135884 -4.707812,6.5185656 -8.158203,6.0585936 0,0 0.877594,-1.505097 1.183253,-3.0545475 0.306329,-1.5528497 0.14601,-3.1978433 -0.362942,-4.9884211 l -0.002,-0.00195 h -0.002 l -0.002,-0.00195 h -0.002 l -0.002,-0.00195 h -0.002 -0.002 l -0.002,0.00195 h -0.002 c 0.0036,0.012096 -0.558211,1.7710993 -2.294921,3.5078125 -2.231421,2.2314196 -5.383693,3.9142439 -8.572266,4.5800791 -0.370553,-0.02038 -0.749935,-0.0293 -1.136719,-0.0293 -1.86,0 -3.606281,0.305968 -5.238281,0.917968 -1.5971549,0.597654 -3.0548795,1.516293 -4.2832032,2.699219 -1.2240001,1.176 -2.1848594,2.627468 -2.8808594,4.355469 -0.684,1.728 -1.0253906,3.709406 -1.0253906,5.941406 0,1.872 0.3302343,3.605172 0.9902343,5.201172 0.638594,1.564886 1.5941865,2.980652 2.8066407,4.158203 1.212,1.188 2.6411565,2.105906 4.2851562,2.753906 1.644,0.648 3.444391,0.972657 5.400391,0.972657 1.034612,9.29e-4 2.066412,-0.10775 3.078125,-0.324219 1.02,-0.204 1.992015,-0.523078 2.916015,-0.955078 l -1.027343,-2.806641 c -0.696,0.336 -1.462735,0.593438 -2.302735,0.773438 -0.828,0.192 -1.661953,0.287109 -2.501953,0.287109 -1.5,0 -2.880625,-0.233172 -4.140625,-0.701172 C 10.419406,33.073934 9.3040566,32.381579 8.3648114,31.484373 7.4287992,30.57862 6.6929394,29.486807 6.2046551,28.279295 c -0.516,-1.248 -0.7977031,-2.650938 -0.8457031,-4.210938 -0.024,-1.572 0.1849063,-3.012312 0.6289062,-4.320312 0.456,-1.32 1.1276251,-2.459922 2.015625,-3.419922 0.9,-0.972 2.0044998,-1.722 3.3124998,-2.25 1.308,-0.54 2.802422,-0.810547 4.482422,-0.810547 1.188,0 2.382031,0.179063 3.582031,0.539063 1.199465,0.348273 2.318471,0.929678 3.292969,1.710937 1.008,0.78 1.806531,1.806125 2.394531,3.078125 0.588,1.272 0.864125,2.837266 0.828125,4.697266 -0.01367,0.709106 -0.09807,1.415079 -0.251953,2.107422 -0.132,0.612 -0.372703,1.097031 -0.720703,1.457031 -0.336,0.348 -0.815453,0.521484 -1.439453,0.521484 -0.708,0 -1.241563,-0.233172 -1.601563,-0.701172 -0.359999,-0.468 -0.541015,-1.16389 -0.541015,-2.08789 l 0.05469,-6.462891 h -2.412109 v 0.644531 c -0.354765,-0.26141 -0.768953,-0.482147 -1.242187,-0.662109 -0.84,-0.324 -1.649688,-0.486328 -2.429688,-0.486328 -1.176,0 -2.231969,0.25939 -3.167969,0.775391 -0.932254,0.512028 -1.70484,1.271772 -2.2324216,2.195312 -0.552,0.936 -0.828125,2.046078 -0.828125,3.330078 0,1.248 0.2649687,2.344969 0.7929687,3.292969 0.5061099,0.926217 1.2602009,1.693158 2.1777349,2.214844 0.924,0.516 1.991125,0.773437 3.203124,0.773437 0.899696,-0.0018 1.78911,-0.191385 2.611329,-0.55664 0.555666,-0.242615 1.03496,-0.60267 1.4375,-1.080079 0.33573,0.480911 0.780891,0.875197 1.298828,1.150391 0.866968,0.468999 1.838555,0.710888 2.824219,0.703125 11.186505,0 14.447286,-18.339796 14.470098,-18.358077 0,0 -1.256827,1.823643 -2.367987,2.606778 -0.799441,0.563438 -2.263515,1.134044 -3.762404,1.291883 0,0 2.245814,-3.052335 3.683537,-6.7294265 1.61122,-4.1208243 0.529922,-7.9791243 0.529922,-7.9791243 z M 15.564453,20.666016 c 0.924,0 1.638578,0.276125 2.142578,0.828125 0.516,0.54 0.773438,1.344109 0.773438,2.412109 0,1.176 -0.287281,2.009953 -0.863281,2.501953 -0.576,0.492 -1.290579,0.738281 -2.142579,0.738281 -0.996,0 -1.775843,-0.283656 -2.339843,-0.847656 -0.552,-0.564 -0.828125,-1.360578 -0.828125,-2.392578 0,-1.008 0.270547,-1.800953 0.810547,-2.376953 0.54,-0.576 1.355265,-0.863281 2.447265,-0.863281 z"
            />
          </svg>
        </div>
        <div style={{ display: 'flex', fontSize: 56, fontWeight: 'bold', color: '#fff' }}>
          ATProto Heatmap
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#888' }}>
          Visualize your AT Protocol activity
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}

