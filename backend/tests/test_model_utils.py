import unittest
from utils.model_utils import load_model, predict_stress
import joblib
import os
from fastapi import HTTPException, status

class DummyModel:
    def predict(self, X):
        return [1] * len(X)  # Return an array of 1s for all inputs

class TestModelUtils(unittest.TestCase):
    def setUp(self):
        self.dummy_model = DummyModel()
        joblib.dump(self.dummy_model, "dummy_model.pkl")  # Save as a valid joblib model
        os.environ["MODEL_PATH"] = "dummy_model.pkl"
        os.environ["SCALER_PATH"] = "dummy_scaler.pkl"  # Assuming scaler exists for testing


    def tearDown(self):
        if os.path.exists("dummy_model.pkl"):
            os.remove("dummy_model.pkl")
        if os.path.exists("dummy_scaler.pkl"):
            os.remove("dummy_scaler.pkl")

    def test_load_model(self):
        model = load_model()
        self.assertIsNotNone(model)

    def test_predict_stress(self):
        model = load_model()
        features = {
            "gsr_max": 5.0,
            "gsr_min": 1.0,
            "gsr_mean": 3.0,
            "gsr_sd": 1.5,
            "hrate_mean": 80.0,
            "temp_avg": 37.0
        }
        prediction = predict_stress(model, features)
        self.assertIsInstance(prediction, int)
        self.assertIn(prediction, [0, 1, 2, 3])  # Assuming stress levels are 0-3