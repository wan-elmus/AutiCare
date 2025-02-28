import unittest
from utils.data_processing import compute_features
from unittest.mock import Mock
import numpy as np

class TestDataProcessing(unittest.TestCase):
    def test_compute_features(self):
        # Mock SensorData objects
        data_points = [
            Mock(gsr=2.32, heart_rate=84.93, temperature=38.8),
            Mock(gsr=1.93, heart_rate=79.54, temperature=38.7),
            Mock(gsr=2.81, heart_rate=98.91, temperature=37.9)
        ]
        features = compute_features(data_points)
        self.assertAlmostEqual(features["gsr_max"], 2.81)
        self.assertAlmostEqual(features["gsr_min"], 1.93)
        self.assertAlmostEqual(features["gsr_mean"], (2.32 + 1.93 + 2.81) / 3)
        self.assertAlmostEqual(features["gsr_sd"], np.std([2.32, 1.93, 2.81], ddof=1))
        self.assertAlmostEqual(features["hrate_mean"], (84.93 + 79.54 + 98.91) / 3)
        self.assertAlmostEqual(features["temp_avg"], (38.8 + 38.7 + 37.9) / 3)