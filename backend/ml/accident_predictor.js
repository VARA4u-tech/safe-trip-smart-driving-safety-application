/**
 * 🤖 ML ACCIDENT PREDICTION ENGINE
 * Connects to the Python ML Microservice for real predictions.
 * Falls back to basic logic if the microservice is offline.
 */

// Node 18+ has native fetch. We will assume Node 18+ as per project README.

/**
 * Predict accident probability based on real-time factors
 */
async function predictRisk({
  speedKmh,
  weatherCondition,
  timeHour,
  trafficLevel,
  incidentHistoryCount,
}) {
  const inputData = {
    speedKmh,
    weatherCondition,
    timeHour,
    trafficLevel,
    incidentHistoryCount,
  };

  try {
    const response = await fetch('http://127.0.0.1:5001/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputData),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Python ML Service returned an error:', response.statusText);
      throw new Error('ML Service Error');
    }
  } catch (error) {
    console.error('⚠️ Could not connect to Python ML Service. Falling back to default mock response.', error.message);
    
    // Simple fallback logic if Python service is down
    let riskProbability = 10;
    let level = "LOW";
    let message = "✅ Driving conditions are optimal (Fallback).";

    if (speedKmh > 100) {
      riskProbability = 70;
      level = "HIGH";
      message = "🚨 CRITICAL RISK: High speed detected (Fallback). Slow down!";
    }

    return {
      probability: riskProbability,
      level,
      message,
      contributingFactors: ["Fallback Logic Active"],
    };
  }
}

module.exports = { predictRisk };

