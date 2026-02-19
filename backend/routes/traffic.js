// routes/traffic.js
// 🚗 Traffic API Route - powered by Mapbox Traffic API

const express = require("express");
const axios = require("axios");
const router = express.Router();

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

// -------------------------------------------------------
// Mapbox Congestion label → our standard risk level
// -------------------------------------------------------
const congestionMap = {
  unknown: {
    label: "Unknown",
    risk: { level: "LOW", message: "🟡 Traffic data unavailable." },
  },
  low: {
    label: "Free Flow",
    risk: { level: "LOW", message: "✅ Light traffic. Road is clear." },
  },
  moderate: {
    label: "Moderate",
    risk: { level: "LOW", message: "🟡 Moderate traffic. Stay alert." },
  },
  heavy: {
    label: "Heavy",
    risk: { level: "MEDIUM", message: "🟠 Heavy traffic. Reduce speed." },
  },
  severe: {
    label: "Standstill",
    risk: {
      level: "HIGH",
      message: "🔴 Traffic standstill. Use alternate route.",
    },
  },
};

// -------------------------------------------------------
// GET /api/traffic?lat=17.385&lon=78.4867
// Returns live traffic flow for given coordinates
// Uses Mapbox Directions API with congestion annotations
// -------------------------------------------------------
router.get("/", async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "lat and lon are required query parameters" });
  }

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes("YOUR_")) {
    console.log("⚠️ Traffic API: Using mock data (add MAPBOX_TOKEN to .env)");
    return res.json(getMockTraffic());
  }

  try {
    // Use a short segment around the current point to sample traffic
    // Mapbox Directions API: same point as origin & a nearby offset as dest
    const latF = parseFloat(lat);
    const lonF = parseFloat(lon);
    const offset = 0.005; // ~500m offset

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
      `${lonF},${latF};${lonF + offset},${latF + offset}` +
      `?annotations=congestion,speed,duration,distance` +
      `&overview=full` +
      `&geometries=geojson` +
      `&access_token=${MAPBOX_TOKEN}`;

    const response = await axios.get(url, { timeout: 6000 });
    const route = response.data.routes?.[0];

    if (!route) throw new Error("No route data from Mapbox");

    // Collect all congestion annotations across all legs
    const allCongestions = [];
    const allSpeeds = [];

    route.legs?.forEach((leg) => {
      (leg.annotation?.congestion || []).forEach((c) => allCongestions.push(c));
      (leg.annotation?.speed || []).forEach((s) => allSpeeds.push(s));
    });

    // Aggregate: pick the worst congestion in the area
    const worstCongestion = getWorstCongestion(allCongestions);
    const avgSpeed = allSpeeds.length
      ? Math.round(
          (allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length) * 3.6,
        ) // m/s → km/h
      : null;

    const result = congestionMap[worstCongestion] || congestionMap["unknown"];

    const traffic = {
      congestionLabel: result.label,
      worstSegment: worstCongestion,
      avgSpeedKmh: avgSpeed,
      drivingRisk: result.risk,
      allCongestions, // raw per-segment data
      totalDurationSec: Math.round(route.duration),
      totalDistanceKm: Math.round(route.distance / 10) / 100,
      provider: "mapbox",
    };

    console.log(`🚗 Mapbox Traffic: ${result.label} | Speed: ${avgSpeed} km/h`);
    res.json(traffic);
  } catch (error) {
    console.error("Mapbox Traffic Error:", error.message);
    res.json(getMockTraffic());
  }
});

// -------------------------------------------------------
// GET /api/traffic/route?origin=lng,lat&destination=lng,lat
// Returns congestion summary for a full route
// Perfect for showing color-coded route on the map
// -------------------------------------------------------
router.get("/route", async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res
      .status(400)
      .json({ error: "origin and destination are required (format: lng,lat)" });
  }

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes("YOUR_")) {
    return res.json(getMockRouteTraffic());
  }

  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/` +
      `${origin};${destination}` +
      `?annotations=congestion,speed,duration` +
      `&overview=full` +
      `&geometries=geojson` +
      `&access_token=${MAPBOX_TOKEN}`;

    const response = await axios.get(url, { timeout: 8000 });
    const route = response.data.routes?.[0];

    if (!route) throw new Error("No route data");

    // Per-segment congestion for the entire route
    const segments = [];
    route.legs?.forEach((leg, legIdx) => {
      const congestions = leg.annotation?.congestion || [];
      const speeds = leg.annotation?.speed || [];
      const durations = leg.annotation?.duration || [];

      congestions.forEach((cong, i) => {
        segments.push({
          leg: legIdx,
          segment: i,
          congestion: cong,
          speedMps: speeds[i] || null,
          speedKmh: speeds[i] ? Math.round(speeds[i] * 3.6) : null,
          durationSec: durations[i] || null,
          risk: (congestionMap[cong] || congestionMap["unknown"]).risk.level,
        });
      });
    });

    // Overall summary
    const worstCongestion = getWorstCongestion(
      segments.map((s) => s.congestion),
    );
    const summary = congestionMap[worstCongestion] || congestionMap["unknown"];

    res.json({
      summary: {
        congestionLabel: summary.label,
        drivingRisk: summary.risk,
        totalDurationMin: Math.round(route.duration / 60),
        totalDistanceKm: Math.round(route.distance / 10) / 100,
      },
      segments,
      geometry: route.geometry, // GeoJSON for rendering on Mapbox
    });
  } catch (error) {
    console.error("Mapbox Route Traffic Error:", error.message);
    res.json(getMockRouteTraffic());
  }
});

// -------------------------------------------------------
// GET /api/traffic/incidents?lat=...&lon=...
// Returns traffic incidents (accidents, roadworks)
// Currently uses mock data as Mapbox doesn't provide a direct Incidents API
// -------------------------------------------------------
router.get("/incidents", async (req, res) => {
  const { lat, lon } = req.query;
  // Simulate real-world incidents around the user
  // In production, you would call TomTom or Here Maps API here

  // Generate deterministic mocks based on location
  const baseLat = parseFloat(lat) || 0;
  const baseLon = parseFloat(lon) || 0;

  const incidents = [
    {
      type: "Traffic Jam",
      description: "Heavy congestion reported",
      severity: "high",
      geometry: { coordinates: [baseLon + 0.002, baseLat + 0.003] },
    },
    {
      type: "Road Works",
      description: "Lane closure due to construction",
      severity: "medium",
      geometry: { coordinates: [baseLon - 0.004, baseLat + 0.001] },
    },
    {
      type: "Accident",
      description: "Minor collision, expect delays",
      severity: "medium",
      geometry: { coordinates: [baseLon + 0.001, baseLat - 0.002] },
    },
  ];

  res.json({ incidents });
});

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
function getWorstCongestion(congestions) {
  const priority = ["severe", "heavy", "moderate", "low", "unknown"];
  for (const level of priority) {
    if (congestions.includes(level)) return level;
  }
  return "unknown";
}

function getMockTraffic() {
  return {
    congestionLabel: "Moderate",
    worstSegment: "moderate",
    avgSpeedKmh: 42,
    drivingRisk: { level: "LOW", message: "🟡 Moderate traffic. Stay alert." },
    allCongestions: ["low", "moderate", "moderate", "low"],
    totalDurationSec: 180,
    totalDistanceKm: 1.2,
    provider: "mock",
  };
}

function getMockRouteTraffic() {
  return {
    summary: {
      congestionLabel: "Moderate",
      drivingRisk: {
        level: "LOW",
        message: "🟡 Moderate traffic. Stay alert.",
      },
      totalDurationMin: 25,
      totalDistanceKm: 12.5,
    },
    segments: [
      { segment: 0, congestion: "low", speedKmh: 55, risk: "LOW" },
      { segment: 1, congestion: "moderate", speedKmh: 38, risk: "LOW" },
      { segment: 2, congestion: "heavy", speedKmh: 22, risk: "MEDIUM" },
      { segment: 3, congestion: "moderate", speedKmh: 40, risk: "LOW" },
    ],
    provider: "mock",
  };
}

module.exports = router;
