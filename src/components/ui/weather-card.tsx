"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, Loader2, CloudLightning, CloudSnow, CloudDrizzle, CalendarDays } from "lucide-react"

interface WeatherData {
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
}

interface WeatherCardProps {
  latitude?: number
  longitude?: number
  location?: string
}

const getWeatherIcon = (icon: string) => {
  // Map OpenWeather icons to Lucide icons
  switch (icon) {
    case "01d":
    case "01n":
      return Sun
    case "02d":
    case "02n":
    case "03d":
    case "03n":
    case "04d":
    case "04n":
      return Cloud
    case "09d":
    case "09n":
      return CloudDrizzle
    case "10d":
    case "10n":
      return CloudRain
    case "11d":
    case "11n":
      return CloudLightning
    case "13d":
    case "13n":
      return CloudSnow
    default:
      return Cloud
  }
}

export function WeatherCard({ latitude, longitude, location }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      if (!latitude || !longitude) {
        setError("Location not set")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
        if (!response.ok) throw new Error("Failed to fetch weather data")
        const data = await response.json()
        setWeather(data)
        setError(null)
      } catch (err) {
        setError("Failed to load weather data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    // Refresh weather data every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [latitude, longitude])

  if (!latitude || !longitude) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please set your location in settings to view weather information.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || "Unable to load weather data"}</p>
        </CardContent>
      </Card>
    )
  }

  const WeatherIcon = getWeatherIcon(weather.icon)

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-950 dark:to-blue-900 shadow-xl min-h-[220px] flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-blue-900 dark:text-blue-100">
          <span className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-400" /> Weather</span>
          <WeatherIcon className="h-10 w-10 text-blue-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-5xl font-extrabold text-blue-900 dark:text-blue-100">{Math.round(weather.temperature)}°F</p>
            <p className="text-lg text-blue-800 dark:text-blue-200 capitalize font-medium">{weather.description}</p>
          </div>
          <div className="text-right">
            <p className="text-md text-blue-700 dark:text-blue-200 font-semibold">{location}</p>
            <div className="text-xs text-blue-700 dark:text-blue-300">Humidity: {weather.humidity}%</div>
            <div className="text-xs text-blue-700 dark:text-blue-300">Wind: {Math.round(weather.windSpeed)} m/s</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 