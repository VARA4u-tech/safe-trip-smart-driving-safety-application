/**
 * 🤖 ML ACCIDENT PREDICTION ENGINE
 * Simulates a trained Logistic Regression / Decision Tree model
 * Inputs: Speed, Weather, Time, Traffic, Historical Data
 * Outputs: Probability (0-100%), Risk Level, Actionable Advice
 */

const RISK_THRESHOLDS = {
  SAFE: 20,
  CAUTION: 50,
  DANGER: 75,
};

// Coefficient Weights (Trained Model Simulation)
const WEIGHTS = {
  SPEED: 1.5, // Speed is the primary factor
  WEATHER: 1.2, // Rain/Fog multiplier
  TIME: 0.8, // Night driving risk
  TRAFFIC: 0.5, // Congestion factor
  HISTORY: 2.0, // Past accidents at location
};

/**
 * Predict accident probability based on real-time factors
 */
function predictRisk({
  speedKmh,
  weatherCondition,
  timeHour,
  trafficLevel,
  incidentHistoryCount,
}) {
  let score = 0;
  let factors = [];

  // 1. 🏎️ Speed Analysis (Non-linear risk curve)
  if (speedKmh > 120) {
    score += 60 * WEIGHTS.SPEED;
    factors.push("Extremely High Speed");
  } else if (speedKmh > 80) {
    score += 30 * WEIGHTS.SPEED;
    factors.push("Speeding (>80km/h)");
  } else if (speedKmh > 50) {
    score += 10 * WEIGHTS.SPEED;
  }

  // 2. 🌧️ Weather Analysis
  const badWeather = ["Rain", "Drizzle", "Thunderstorm", "Snow", "Fog", "Mist"];
  if (badWeather.some((c) => weatherCondition.includes(c))) {
    score += 20 * WEIGHTS.WEATHER;
    if (speedKmh > 60) {
      score += 15; // Penalty for speed + rain (Hydroplaning risk)
      factors.push(`Creating hydroplaning risk in ${weatherCondition}`);
    } else {
      factors.push(`Reduced visibility due to ${weatherCondition}`);
    }
  }

  // 3. 🌙 Time of Day Analysis (Fatigue / Visibility)
  // Late night: 11 PM - 4 AM
  if (timeHour >= 23 || timeHour <= 4) {
    score += 15 * WEIGHTS.TIME;
    factors.push("Late night driving (Fatigue Risk)");
  }
  // Rush hour: 8-10 AM, 5-7 PM
  else if (
    (timeHour >= 8 && timeHour <= 10) ||
    (timeHour >= 17 && timeHour <= 19)
  ) {
    score += 10 * WEIGHTS.TRAFFIC;
    factors.push("Rush hour traffic intensity");
  }

  // 4. 🚦 Traffic Congestion
  if (
    ["heavy", "severe", "standstill"].some((t) =>
      trafficLevel.toLowerCase().includes(t),
    )
  ) {
    score += 10 * WEIGHTS.TRAFFIC;
    // High congestion usually LOWERS high-speed crash risk but INCREASES fender-bender risk
    // Adjust score slightly down if speed is low, up if speed is high in traffic
    if (speedKmh < 20) score -= 5;
    else if (speedKmh > 40) {
      score += 10;
      factors.push("Fast driving in heavy traffic");
    }
  }

  // 5. ⚠️ Historical Data (Blackspots)
  if (incidentHistoryCount > 0) {
    score += incidentHistoryCount * 5 * WEIGHTS.HISTORY;
    factors.push(`High-accident zone (${incidentHistoryCount} past incidents)`);
  }

  // Normalize Score (0 - 100%)
  let riskProbability = Math.min(Math.round(score), 100);
  // Ensure minimum randomness for "AI" feel (simulate micro-factors)
  riskProbability = Math.max(riskProbability, 5);

  // Risk Classification
  let level = "LOW";
  let message = "✅ Driving conditions are optimal.";

  if (riskProbability >= RISK_THRESHOLDS.DANGER) {
    level = "HIGH";
    message = `🚨 CRITICAL RISK: ${factors[0] || "Unsafe driving conditions"}. Slow down immediately!`;
  } else if (riskProbability >= RISK_THRESHOLDS.CAUTION) {
    level = "MEDIUM";
    message = `⚠️ CAUTION: ${factors[0] || "Elevated risk detected"}. Stay alert.`;
  } else {
    message =
      factors.length > 0
        ? `ℹ️ Safe, but note: ${factors[0]}`
        : "✅ Safe driving detected.";
  }

  return {
    probability: riskProbability,
    level,
    message,
    contributingFactors: factors,
  };
}

module.exports = { predictRisk };
