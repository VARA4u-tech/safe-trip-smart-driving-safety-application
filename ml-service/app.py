# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
import joblib
import os
import numpy as np

app = Flask(__name__)

# Try to load the model
MODEL_PATH = 'accident_model.pkl'
model = None

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print(f"Loaded model from {MODEL_PATH}")
else:
    print(f"Warning: Model file {MODEL_PATH} not found. Please run train_model.py first.")

def encode_weather(weather_str):
    weather_str = weather_str.lower()
    if any(w in weather_str for w in ['rain', 'drizzle']): return 1
    if any(w in weather_str for w in ['fog', 'mist']): return 2
    if 'snow' in weather_str: return 3
    if 'thunderstorm' in weather_str: return 4
    return 0 # Clear/Clouds

def encode_traffic(traffic_str):
    traffic_str = traffic_str.lower()
    if 'moderate' in traffic_str: return 1
    if 'heavy' in traffic_str: return 2
    if 'severe' in traffic_str: return 3
    if 'standstill' in traffic_str: return 4
    return 0 # Light/unknown

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json
    try:
        speed = float(data.get('speedKmh', 0))
        weather = encode_weather(data.get('weatherCondition', 'Clear'))
        time_hour = int(data.get('timeHour', 12))
        traffic = encode_traffic(data.get('trafficLevel', 'unknown'))
        history = int(data.get('incidentHistoryCount', 0))

        # Prepare features for the model
        features = np.array([[speed, weather, time_hour, traffic, history]])
        
        # Predict class (0: LOW, 1: MEDIUM, 2: HIGH)
        prediction_class = model.predict(features)[0]
        
        # Predict probabilities
        probabilities = model.predict_proba(features)[0]
        risk_prob = round(probabilities[prediction_class] * 100) # Base probability of the selected class
        
        # Convert class to level and message
        if prediction_class == 2:
            level = "HIGH"
            risk_prob = max(75, risk_prob) # Ensure high class has high probability
            message = "🚨 CRITICAL RISK: ML Model detected highly unsafe driving conditions. Slow down immediately!"
        elif prediction_class == 1:
            level = "MEDIUM"
            risk_prob = max(50, risk_prob)
            message = "⚠️ CAUTION: ML Model detected elevated risk. Stay alert."
        else:
            level = "LOW"
            risk_prob = min(49, risk_prob)
            message = "✅ Safe driving detected by ML Engine."

        return jsonify({
            "probability": risk_prob,
            "level": level,
            "message": message,
            "contributingFactors": ["Determined by RandomForest Classifier"]
        })
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=5001, debug=True)
