import { NextResponse } from 'next/server'

// Use Node.js runtime
export const runtime = 'nodejs'

interface LastFMTrack {
  name: string
  artist: {
    '#text': string
  }
  album: {
    '#text': string
  }
  url: string
  image: Array<{
    size: string
    '#text': string
  }>
  '@attr'?: {
    nowplaying: string
  }
}

interface LastFMResponse {
  recenttracks?: {
    track?: LastFMTrack[]
  }
}

export async function GET() {
  try {
    const lastFmUrl = process.env.LAST_FM_API
    if (!lastFmUrl) {
      return new NextResponse(
        JSON.stringify({ tracks: [], error: 'LastFM API URL not configured' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Last.fm returns XML by default; request JSON
    let fetchUrl = lastFmUrl
    try {
      const url = new URL(lastFmUrl)
      if (!url.searchParams.has('format')) {
        url.searchParams.set('format', 'json')
      }
      fetchUrl = url.toString()
    } catch {
      // URL may be relative or malformed; use as-is
    }
    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'RLineCMS/1.0' },
    })
    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({ tracks: [], error: 'Failed to fetch LastFM data' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const contentType = response.headers.get('Content-Type') ?? ''
    let data: LastFMResponse
    if (contentType.includes('application/json')) {
      data = (await response.json()) as LastFMResponse
    } else {
      // API returned XML or other (e.g. error page); avoid .json() parse error
      const text = await response.text()
      if (text.trimStart().startsWith('{')) {
        data = JSON.parse(text) as LastFMResponse
      } else {
        console.error('LastFM API returned non-JSON:', contentType, text.slice(0, 100))
        return new NextResponse(
          JSON.stringify({ tracks: [], error: 'LastFM returned invalid response' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const tracks = data.recenttracks?.track?.slice(0, 12) || []

    // Format the tracks data
    const formattedTracks = tracks.map((track) => ({
      name: track.name,
      artist: track.artist['#text'],
      album: track.album['#text'],
      url: track.url,
      // Try to get the largest image available, fallback to medium or first available
      image: track.image?.find((img) => img.size === 'large')?.['#text'] ||
             track.image?.find((img) => img.size === 'medium')?.['#text'] ||
             track.image?.[0]?.['#text'] ||
             null,
      nowPlaying: track['@attr']?.nowplaying === 'true'
    }))

    return new NextResponse(
      JSON.stringify({ tracks: formattedTracks, error: null }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('LastFM API error:', error)
    return new NextResponse(
      JSON.stringify({ tracks: [], error: 'Failed to fetch music data' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 