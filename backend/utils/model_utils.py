'''
Loads pre-trained model
Makes predictions
'''
import pickle
import os

MODEL_PATH = os.getenv("MODEL_PATH")

def load_model():
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

def predict_stress(model, features):
    return model.predict([features])[0]
