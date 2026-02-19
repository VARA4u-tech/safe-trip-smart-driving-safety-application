// routes/weather.js
// ☁️ Weather API Route - powered by OpenWeatherMap

const express = require("express");
const axios = require("axios");
const router = express.Router();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

/**
 * GET /api/weather?lat=17.385&lon=78.4867
 * Returns current weather conditions for a given location
 */
router.get("/", async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "lat and lon are required query parameters" });
  }

  // No API key configured - return mock data
  if (!WEATHER_API_KEY || WEATHER_API_KEY.includes("YOUR_")) {
    console.log("⚠️ Weather API: Using mock data (no API key configured)");
    return res.json(getMockWeather(lat, lon));
  }

  try {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: "metric", // Celsius
        },
        timeout: 5000,
      },
    );

    const data = response.data;
    const weather = {
      condition: data.weather[0]?.main || "Clear", // Clear, Clouds, Rain, Fog
      description: data.weather[0]?.description || "clear sky",
      temp: Math.round(data.main?.temp || 25),
      feelsLike: Math.round(data.main?.feels_like || 25),
      humidity: data.main?.humidity || 0,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
      visibility: Math.round((data.visibility || 10000) / 1000), // meters to km
      city: data.name || "Unknown",
      // 🚨 Driving Risk Level based on weather
      drivingRisk: getDrivingRisk(
        data.weather[0]?.main,
        data.wind?.speed,
        data.visibility,
      ),
    };

    console.log(
      `☁️ Weather fetched for [${lat}, ${lon}]: ${weather.condition} | Risk: ${weather.drivingRisk.level}`,
    );
    res.json(weather);
  } catch (error) {
    console.error("Weather API Error:", error.message);
    // Fallback to mock on API error
    res.json(getMockWeather(lat, lon));
  }
});

/**
 * Calculate driving risk based on weather conditions
 */
function getDrivingRisk(condition, windSpeedMs = 0, visibilityM = 10000) {
  const windKmh = windSpeedMs * 3.6;
  const visibilityKm = visibilityM / 1000;

  if (condition === "Thunderstorm" || condition === "Tornado") {
    return { level: "EXTREME", message: "🌩️ Thunderstorm! Avoid driving." };
  }
  if (condition === "Snow" || condition === "Sleet") {
    return { level: "HIGH", message: "❄️ Snow/Ice on road. Drive slowly." };
  }
  if (condition === "Fog" || visibilityKm < 0.5) {
    return { level: "HIGH", message: "🌫️ Dense fog. Use fog lights." };
  }
  if (condition === "Rain" || condition === "Drizzle") {
    return { level: "MEDIUM", message: "🌧️ Wet roads. Reduce speed." };
  }
  if (windKmh > 60) {
    return {
      level: "MEDIUM",
      message: "💨 Strong winds. Hold steering firmly.",
    };
  }
  return { level: "LOW", message: "✅ Clear weather. Safe to drive." };
}

/**
 * Mock weather data for when API key is not configured
 */
function getMockWeather(lat, lon) {
  return {
    condition: "Clear",
    description: "clear sky",
    temp: 28,
    feelsLike: 30,
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    city: "Mock City",
    drivingRisk: { level: "LOW", message: "✅ Clear weather. Safe to drive." },
    isMock: true,
  };
}

module.exports = router;
