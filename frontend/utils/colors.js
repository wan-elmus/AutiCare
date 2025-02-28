// utils/colors.js

export function getHeartRateColor(heartRate) {
    // Returns a color based on heart rate values
    if (heartRate < 60) return '#4CAF50'  // green for low rate
    if (heartRate < 100) return '#FFC107' // amber for moderate rate
    return '#F44336'                     // red for high rate
  }
  
  export function getTemperatureColor(temperature) {
    // Returns a color based on body temperature
    if (temperature < 36) return '#4CAF50'
    if (temperature < 38) return '#FFC107'
    return '#F44336'
  }
  
  export function getGSRColor(gsr) {
    // Returns a color based on Galvanic Skin Response
    if (gsr < 2) return '#4CAF50'
    if (gsr < 5) return '#FFC107'
    return '#F44336'
  }
  
  export function getStressLevelColor(stressLevel) {
    // Returns a color based on overall stress level
    if (stressLevel < 50) return '#4CAF50'
    if (stressLevel < 80) return '#FFC107'
    return '#F44336'
  }
  
  // Optional: a color map for quick lookup
  export const colorMap = {
    heartRate: getHeartRateColor,
    temperature: getTemperatureColor,
    gsr: getGSRColor,
    stressLevel: getStressLevelColor
  }
  