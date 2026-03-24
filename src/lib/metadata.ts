import { Metadata } from '@/components/ui/metadata-editor'
import { siteSettingsRepository } from '@/lib/repositories/siteSettingsRepository'

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
    '#text': string
    size: string
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

interface WeatherResponse {
  main: {
    temp: number
  }
  weather: Array<{
    description: string
  }>
}

export async function fetchWeatherAndMusic(): Promise<Metadata[]> {
  const metadata: Metadata[] = [];
  
  try {
    // Fetch LastFM data
    const lastFmUrl = process.env.LAST_FM_API;
    
    if (lastFmUrl) {
      const response = await fetch(lastFmUrl);
      const data = await response.json() as LastFMResponse;

      if (!data?.recenttracks?.track?.length) {
        return metadata;
      }

      const mostRecentTrack = data.recenttracks.track[0];
      if (mostRecentTrack) {
        metadata.push({
          key: 'now_playing',
          value: `${mostRecentTrack.name} by ${mostRecentTrack.artist['#text']} was spinning.`,
          type: 'text'
        });
      }
    }

    // Fetch weather data
    const weatherApiKey = process.env.OPENWEATHER_API_KEY;
    
    // Get location settings from the database
    const siteSettings = await siteSettingsRepository.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: {
        location: true,
        latitude: true,
        longitude: true
      }
    });

    const lat = siteSettings?.latitude;
    const lon = siteSettings?.longitude;
    const location = siteSettings?.location;
    
    if (weatherApiKey && lat && lon && location) {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=imperial`
      );
      
      if (response.ok) {
        const data = await response.json() as WeatherResponse;
        metadata.push({
          key: 'weather',
          value: `It was ${Math.round(data.main.temp)}°F in ${location} with ${data.weather[0].description}.`,
          type: 'text'
        });
      }
    }
  } catch {
    // Silently fail on errors - non-critical feature
  }
  
  return metadata;
} 