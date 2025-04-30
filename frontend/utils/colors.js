export function getHeartRateColor(heartRate) {
  if (heartRate < 110) return '#4CAF50' // Green for low
  if (heartRate < 130) return '#FFC107' // Amber for moderate
  return '#F44336' // Red for high
}

export function getTemperatureColor(temperature) {
  if (temperature < 35) return '#4CAF50' // Green for low
  if (temperature < 36) return '#FFC107' // Amber for normal
  return '#F44336' // Red for high
}

export function getGSRColor(gsr) {
  if (gsr < 5) return '#4CAF50' // Green for low
  if (gsr < 300) return '#FFC107' // Amber for moderate
  return '#F44336' // Red for high
}

export function getStressLevelColor(stressLevel) {
  if (stressLevel < 50) return '#4CAF50' // Green for low
  if (stressLevel < 80) return '#FFC107' // Amber for moderate
  return '#F44336' // Red for high
}

export const colorMap = {
  heartRate: getHeartRateColor,
  temperature: getTemperatureColor,
  gsr: getGSRColor,
  stressLevel: getStressLevelColor,
}