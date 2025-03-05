'''
Handles single predictions for testing.
Tests predictions with sample data, ensuring the model and scaler work together.
'''
import joblib
import os
import numpy as np

MODEL_PATH = os.getenv("MODEL_PATH", "models/auticare_model.pkl")
SCALER_PATH = os.getenv("SCALER_PATH", "models/scaler.pkl")

def load_model():
    return joblib.load(MODEL_PATH)

def load_scaler():
    return joblib.load(SCALER_PATH)

def predict_stress(features):
    model = load_model()
    scaler = load_scaler()
    
    feature_list = [
        features["gsr_max"],
        features["gsr_min"],
        features["gsr_mean"],
        features["gsr_sd"],
        features["hrate_mean"],
        features["temp_avg"]
    ]
    
    normalized_features = scaler.transform([feature_list])
    prediction = model.predict(normalized_features)[0]
    return prediction

if __name__ == "__main__":
    sample_features = {
        "gsr_max": 12.8,
        "gsr_min": 4.9,
        "gsr_mean": 3.0,
        "gsr_sd": 3.5,
        "hrate_mean": 170.0,
        "temp_avg": 39.7
    }
    result = predict_stress(sample_features)
    print(f"Predicted stress level: {result}")