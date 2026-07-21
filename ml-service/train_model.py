import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

print("Generating synthetic data for training...")
# Generate synthetic dataset for accident prediction
# Features: speedKmh, weather_encoded, timeHour, traffic_encoded, incidentHistoryCount
# Target: riskLevel (0: LOW, 1: MEDIUM, 2: HIGH)

# Weather Mapping: Clear:0, Rain:1, Fog:2, Snow:3, Thunderstorm:4, Drizzle:1, Mist:2
# Traffic Mapping: light:0, moderate:1, heavy:2, severe:3, standstill:4

num_samples = 5000
np.random.seed(42)

speeds = np.random.normal(60, 25, num_samples)
speeds = np.clip(speeds, 0, 160)

weathers = np.random.choice([0, 1, 2, 3, 4], num_samples, p=[0.6, 0.2, 0.1, 0.05, 0.05])
times = np.random.randint(0, 24, num_samples)
traffics = np.random.choice([0, 1, 2, 3, 4], num_samples, p=[0.3, 0.4, 0.2, 0.08, 0.02])
history = np.random.choice([0, 1, 2, 3, 4, 5], num_samples, p=[0.7, 0.15, 0.08, 0.04, 0.02, 0.01])

# Create dataframe
df = pd.DataFrame({
    'speedKmh': speeds,
    'weather': weathers,
    'timeHour': times,
    'traffic': traffics,
    'incidentHistoryCount': history
})

# Define risk function to generate labels based on the old mock logic
def determine_risk(row):
    score = 0
    if row['speedKmh'] > 120: score += 90
    elif row['speedKmh'] > 80: score += 45
    elif row['speedKmh'] > 50: score += 15
    
    if row['weather'] in [1, 2, 3, 4]:
        score += 24
        if row['speedKmh'] > 60: score += 15
        
    if row['timeHour'] >= 23 or row['timeHour'] <= 4:
        score += 12
    elif (8 <= row['timeHour'] <= 10) or (17 <= row['timeHour'] <= 19):
        score += 5
        
    if row['traffic'] >= 2:
        score += 5
        if row['speedKmh'] < 20: score -= 5
        elif row['speedKmh'] > 40: score += 10
        
    if row['incidentHistoryCount'] > 0:
        score += row['incidentHistoryCount'] * 10
        
    # Introduce some noise to make it realistic
    score += np.random.normal(0, 5)
    
    if score >= 75: return 2 # HIGH
    elif score >= 50: return 1 # MEDIUM
    else: return 0 # LOW

df['riskLevel'] = df.apply(determine_risk, axis=1)

X = df[['speedKmh', 'weather', 'timeHour', 'traffic', 'incidentHistoryCount']]
y = df['riskLevel']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Random Forest Classifier...")
model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

score = model.score(X_test, y_test)
print(f"Model trained! Accuracy on test set: {score:.2f}")

joblib.dump(model, 'accident_model.pkl')
print("Model saved to accident_model.pkl")
