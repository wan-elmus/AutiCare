'use client'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import CircularGauge from '../../utils/CircularGauge'
import StressIndicator from '../StressIndicator/StressIndicator'
import { getHeartRateColor, getTemperatureColor, getGSRColor, getStressLevelColor } from '../../utils/colors'

export default function RealTimeMonitoring() {
  const [heartRate, setHeartRate] = useState(null)
  const [temperature, setTemperature] = useState(null)
  const [gsr, setGsr] = useState(null)
  const [stressLevel, setStressLevel] = useState(null)

  useEffect(() => {
    // Get the token using js-cookie for robust, client-side cookie management
    const token = Cookies.get('token')
    if (!token) {
      console.error("No token found")
      return
    }

    // Establish a WebSocket connection with the backend
    const ws = new WebSocket(`ws://localhost:8000/ws?token=${encodeURIComponent(token)}`)

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        setHeartRate(message.heart_rate)
        setTemperature(message.temperature)
        setGsr(message.gsr)
        setStressLevel(message.stress_level)
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    // Clean up the connection when the component unmounts
    return () => {
      ws.close()
    }
  }, [])

  // Show a loading message until all values are available
  if (heartRate === null || temperature === null || gsr === null || stressLevel === null) {
    return <div className="text-white text-center">Loading...</div>
  }

  return (
    <div className="bg-blue-700 text-white p-6 rounded-lg shadow-lg">
      <h2 className="text-green-400 text-2xl mb-4">Live Stress Indicators</h2>
      <div className="flex flex-col items-center gap-6">
        <StressIndicator level={stressLevel} color={getStressLevelColor(stressLevel)} />
        <div className="flex flex-col gap-6 w-full">
          <div className="flex flex-col items-center gap-2">
            <CircularGauge
              value={heartRate}
              max={150}
              label="Heart Rate"
              color={getHeartRateColor(heartRate)}
              unit="bpm"
            />
            <div className="flex items-center justify-between w-full">
              <span className="text-white">Heart Rate Alerts</span>
              <input type="checkbox" className="toggle toggle-success" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CircularGauge
              value={temperature}
              max={40}
              label="Temperature"
              color={getTemperatureColor(temperature)}
              unit="°C"
            />
            <div className="flex items-center justify-between w-full">
              <span className="text-white">Temperature Alerts</span>
              <input type="checkbox" className="toggle toggle-success" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CircularGauge
              value={gsr}
              max={10}
              label="GSR"
              color={getGSRColor(gsr)}
              unit="μS"
            />
            <div className="flex items-center justify-between w-full">
              <span className="text-white">GSR Alerts</span>
              <input type="checkbox" className="toggle toggle-success" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
