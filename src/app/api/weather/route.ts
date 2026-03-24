import { NextResponse } from "next/server"
import { auth } from "@/auth/auth"

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    if (!lat || !lon) {
      return new NextResponse("Missing latitude or longitude", { status: 400 })
    }

    if (!OPENWEATHER_API_KEY) {
      return new NextResponse("Weather API not configured", { status: 500 })
    }

    // Fetch current weather data from OpenWeather API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    )

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenWeather error:", response.status, errorText);
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json()

    // Transform the data to match our WeatherData interface
    const weatherData = {
      temperature: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed
    }

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error("[WEATHER_API_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 