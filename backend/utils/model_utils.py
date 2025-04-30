# utils/model_utils.py
import pickle
import os
import joblib
from fastapi import HTTPException, status

MODEL_PATH = os.getenv("MODEL_PATH", "models/auticare_model.pkl")

def load_model():
    """
    Loads the pre-trained machine learning model from the specified path.
    
    Returns:
        model: Loaded Random Forest Classifier model.
    
    Raises:
        HTTPException: If model loading fails.
    """
    try:
        with open(MODEL_PATH, "rb") as f:
            return joblib.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Model file not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error loading model: {str(e)}")

def predict_stress(model, features):
    """
    Makes a stress level prediction using the loaded model.
    
    Args:
        model: Trained Random Forest Classifier.
        features: Dictionary of features (gsr_max, gsr_min, etc.).
    
    Returns:
        int: Predicted stress level (0, 1, 2, or 3).
    """
    try:
        feature_list = [
            features["gsr_max"],
            features["gsr_min"],
            features["gsr_mean"],
            features["gsr_sd"],
            features["hrate_mean"],
            features["temp_avg"]
        ]
        return model.predict([feature_list])[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error predicting stress: {str(e)}")