import { ImageResponse } from 'next/og';
import { getProfile, formatNumber } from '@/lib/atproto';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  try {
    if (handle) {
      return await generateProfileOG(handle);
    }

    // Fallback to default OG image
    return generateDefaultOG();
  } catch (error) {
    console.error('Error generating OG image:', error);
    return generateDefaultOG();
  }
}

async function generateProfileOG(handle: string) {
  const profile = await getProfile(handle);

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
          background: 'white',
          padding: 40,
          fontFamily: 'system-ui, sans-serif',
          gap: 24,
        }}
      >
        <h1 style={{ fontSize: 64, fontWeight: 'bold', color: 'black', margin: 0 }}>
          @{profile.handle}
        </h1>
        
        {profile.displayName && (
          <h2 style={{ fontSize: 32, color: 'gray', margin: 0 }}>
            {profile.displayName}
          </h2>
        )}
        
        {profile.description && (
          <p style={{ fontSize: 20, color: 'gray', margin: 0, textAlign: 'center', maxWidth: 800 }}>
            {profile.description}
          </p>
        )}
        
        <div style={{ fontSize: 16, color: 'lightgray' }}>
          ATProto Heatmap
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
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 'bold', color: 'black' }}>
          ATProto Heatmap
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}

