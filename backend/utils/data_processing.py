import numpy as np

def compute_features(data_points):
    """
    Processes raw sensor data into ML-ready format with aggregated statistics.
    
    Args:
        data_points: List of SensorData objects containing gsr, heart_rate, and temperature.
    
    Returns:
        dict: Aggregated features including max, min, mean, and standard deviation.
    """
    gsr_values = [dp.gsr for dp in data_points]
    hr_values = [dp.heart_rate for dp in data_points]
    temp_values = [dp.temperature for dp in data_points]
    
    return {
        "gsr_max": max(gsr_values),
        "gsr_min": min(gsr_values),
        "gsr_mean": np.mean(gsr_values),
        "gsr_sd": np.std(gsr_values),
        "hrate_mean": np.mean(hr_values),
        "temp_avg": np.mean(temp_values)
    }