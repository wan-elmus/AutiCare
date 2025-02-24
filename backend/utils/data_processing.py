'''
Processes raw sensor data into ML-ready format
'''
import numpy as np

def compute_features(data_points):
    gsr_values = [dp.gsr for dp in data_points]
    hr_values = [dp.heart_rate for dp in data_points]
    temp_values = [dp.temperature for dp in data_points]

    return [
        max(gsr_values),
        min(gsr_values),
        np.mean(gsr_values),
        np.std(gsr_values),
        np.mean(hr_values),
        np.mean(temp_values)
    ]
