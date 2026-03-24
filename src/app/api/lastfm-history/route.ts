import { NextResponse } from 'next/server';

// Use Node.js runtime
export const runtime = 'nodejs';

interface LastFMTrack {
  name: string;
  artist: { '#text': string };
  album: { '#text': string };
  url: string;
  image: Array<{ size: string; '#text': string }>;
  '@attr'?: { nowplaying: string };
}

interface LastFMResponse {
  recenttracks?: { track?: LastFMTrack[] };
}

interface LastFMUserInfoResponse {
  user?: {
    playcount?: string;
    artist_count?: string;
    artistcount?: string;
  };
}

interface LastFMLovedTracksResponse {
  lovedtracks?: {
    '@attr'?: {
      total?: string;
    };
  };
}

interface LastFMImage {
  size: string;
  '#text': string;
}

interface LastFMTopTrack {
  name: string;
  artist: { name: string };
  url: string;
  image: LastFMImage[];
  playcount: string;
  '@attr'?: { rank: string };
  album?: { '#text': string };
  albumImage?: string | null;
  albumName?: string;
}

/**
 * /api/lastfm-history - Returns historical LastFM tracks and user metrics
 * Supports ?limit=100&page=1 for pagination
 * Response fields:
 *   - tracks: array of recent tracks
 *   - totalScrobbles: number
 *   - totalArtists: number
 *   - totalLovedTracks: number
 *   - error: string|null
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const user = process.env.LAST_FM_USER;
    const apiKey = process.env.LAST_FM_API_KEY;
    if (!user || !apiKey) {
      return new NextResponse(
        JSON.stringify({ tracks: [], error: 'LastFM credentials not configured' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const type = searchParams.get('type') || 'recent';
    // Fetch URLs based on type
    let tracksUrl: string;
    if (type === 'top') {
      // Top tracks for 3 months
      tracksUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${user}&api_key=${apiKey}&format=json&period=3month&limit=${limit}&page=${page}`;
    } else {
      // Recent tracks
      tracksUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`;
    }
    // Fetch user info (for scrobbles, artists)
    const infoUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${user}&api_key=${apiKey}&format=json`;
    // Fetch loved tracks (for count)
    const lovedUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getlovedtracks&user=${user}&api_key=${apiKey}&format=json&limit=1`;

    const [tracksRes, infoRes, lovedRes] = await Promise.all([
      fetch(tracksUrl),
      fetch(infoUrl),
      fetch(lovedUrl),
    ]);
    if (!tracksRes.ok || !infoRes.ok || !lovedRes.ok) {
      return new NextResponse(
        JSON.stringify({ tracks: [], error: 'Failed to fetch LastFM data' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    let tracks: LastFMTrack[] | LastFMTopTrack[] = [];
    if (type === 'top') {
      const topData = await tracksRes.json();
      tracks = topData.toptracks?.track || [];
      // For all tracks, fetch track info to get album artwork
      const updatedTracks = await Promise.all((tracks as LastFMTopTrack[]).map(async (track) => {
        const artistName = track.artist?.name;
        const trackName = track.name;
        if (artistName && trackName) {
          try {
            const trackInfoRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(trackName)}&api_key=${apiKey}&format=json`);
            if (trackInfoRes.ok) {
              const trackInfoData = await trackInfoRes.json() as {
                track?: {
                  album?: {
                    image?: LastFMImage[];
                    title?: string;
                  }
                }
              };
              const albumImage = Array.isArray(trackInfoData?.track?.album?.image)
                ? (
                    (trackInfoData.track.album.image as LastFMImage[]).find(img => img.size === 'extralarge' && img['#text'])?.['#text'] ||
                    (trackInfoData.track.album.image as LastFMImage[]).find(img => img.size === 'large' && img['#text'])?.['#text'] ||
                    (trackInfoData.track.album.image as LastFMImage[]).find(img => img.size === 'medium' && img['#text'])?.['#text'] ||
                    (trackInfoData.track.album.image as LastFMImage[]).find(img => img['#text'])?.['#text'] ||
                    null
                  )
                : null;
              const albumName = trackInfoData?.track?.album?.title || '';
              return { ...track, albumImage, albumName };
            }
          } catch {}
        }
        return { ...track, albumImage: null, albumName: track.album?.['#text'] || '' };
      }));
      // Merge updated images into tracks
      tracks = updatedTracks;
    } else {
      const tracksData = await tracksRes.json() as LastFMResponse;
      tracks = tracksData.recenttracks?.track || [];
    }
    // Normalize tracks
    const formattedTracks = tracks.map((track) => {
      if (type === 'top') {
        const t = track as LastFMTopTrack & { albumImage?: string | null; albumName?: string };
        return {
          name: t.name,
          artist: t.artist?.name,
          album: t.albumName || t.album?.['#text'] || '',
          url: t.url,
          image: t.albumImage
            ? t.albumImage
            : (Array.isArray(t.image)
                ? t.image
                    .filter((img: LastFMImage) => !!img['#text'])
                    .find((img: LastFMImage) => img.size === 'extralarge')?.['#text'] ||
                  t.image
                    .filter((img: LastFMImage) => !!img['#text'])
                    .find((img: LastFMImage) => img.size === 'large')?.['#text'] ||
                  t.image
                    .filter((img: LastFMImage) => !!img['#text'])
                    .find((img: LastFMImage) => img.size === 'medium')?.['#text'] ||
                  t.image.find((img: LastFMImage) => !!img['#text'])?.['#text']
                : null) || null,
          nowPlaying: false,
          playcount: t.playcount,
        };
      } else {
        const t = track as LastFMTrack;
        return {
          name: t.name,
          artist: t.artist['#text'],
          album: t.album['#text'],
          url: t.url,
          image: (Array.isArray(t.image)
            ? t.image
                .filter((img: LastFMImage) => !!img['#text'])
                .find((img: LastFMImage) => img.size === 'extralarge')?.['#text'] ||
              t.image
                .filter((img: LastFMImage) => !!img['#text'])
                .find((img: LastFMImage) => img.size === 'large')?.['#text'] ||
              t.image
                .filter((img: LastFMImage) => !!img['#text'])
                .find((img: LastFMImage) => img.size === 'medium')?.['#text'] ||
              t.image.find((img: LastFMImage) => !!img['#text'])?.['#text']
            : null) || null,
          nowPlaying: t['@attr']?.nowplaying === 'true',
        };
      }
    });

    // Extract metrics
    const infoData = await infoRes.json() as LastFMUserInfoResponse;
    const lovedData = await lovedRes.json() as LastFMLovedTracksResponse;

    const totalScrobbles = parseInt(infoData?.user?.playcount || '0', 10);
    const totalArtists = parseInt(infoData?.user?.artist_count || infoData?.user?.artistcount || '0', 10);
    const totalLovedTracks = parseInt(lovedData?.lovedtracks?.['@attr']?.total || '0', 10);

    return new NextResponse(
      JSON.stringify({
        tracks: formattedTracks,
        totalScrobbles,
        totalArtists,
        totalLovedTracks,
        error: null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('LastFM History API error:', error);
    return new NextResponse(
      JSON.stringify({ tracks: [], error: 'Failed to fetch music history' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 