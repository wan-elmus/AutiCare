'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { FaHeartbeat } from 'react-icons/fa' // Minimal icon
import CircularGauge from '../../utils/CircularGauge'
import StressIndicator from '../StressIndicator/StressIndicator'
import { getHeartRateColor, getTemperatureColor, getGSRColor, getStressLevelColor } from '../../utils/colors'

export default function RealTimeMonitoring({ isExpanded = false, onExpand }) {
  const { isDark } = useTheme()
  const [heartRate, setHeartRate] = useState(null)
  const [temperature, setTemperature] = useState(null)
  const [gsr, setGsr] = useState(null)
  const [stressLevel, setStressLevel] = useState(null)
  const [alerts, setAlerts] = useState({ heartRate: false, temperature: false, gsr: false })

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/predictions')
    ws.onopen = () => console.log('WebSocket connection established')
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        setHeartRate(message.heart_rate)
        setTemperature(message.temperature)
        setGsr(message.gsr)
        setStressLevel(message.stress_level)
      } catch (error) {
        console.log('Error parsing WebSocket message:', error)
      }
    }
    ws.onerror = (error) => console.error('WebSocket error:', error)
    ws.onclose = (event) => console.log('WebSocket closed:', event.code, event.reason)
    return () => ws.close()
  }, [])

  const handleToggle = (type) => {
    setAlerts((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  if (heartRate === null || temperature === null || gsr === null || stressLevel === null) {
    return (
      <div className="flex items-center justify-center min-h-[150px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`h-8 w-8 border-4 border-t-teal-600 rounded-full ${isDark ? 'border-gray-700' : 'border-teal-200'}`}
        />
      </div>
    )
  }

  // Minimal Card View (for Landing Page)
  if (!isExpanded) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        transition={{ duration: 0.3 }}
        onClick={onExpand}
        className={`p-4 rounded-lg shadow-md cursor-pointer ${
          isDark ? 'bg-gray-800 border-teal-700' : 'bg-teal-50 border-teal-200'
        } border`}
      >
        <div className="flex items-center gap-3">
          <FaHeartbeat className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
              Real-Time Monitoring
            </h3>
            <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
              Stress Level: {stressLevel !== null ? stressLevel : 'Loading...'}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Full Expanded View (for Sidebar)
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      className={`rounded-xl shadow-xl overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-teal-950 to-gray-800' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100'
      } p-6`}
    >
      <h2 className={`text-2xl font-semibold mb-6 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
        Live Stress Indicators
      </h2>
      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          <StressIndicator level={stressLevel} color={getStressLevelColor(stressLevel)} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {/* Heart Rate */}
          <motion.div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-teal-50'} shadow-md`}>
            <div className="flex items-center gap-2 mb-2">
              <FaHeartbeat className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>Heart Rate</span>
            </div>
            <CircularGauge
              value={heartRate}
              max={150}
              label="Heart Rate"
              color={getHeartRateColor(heartRate)}
              unit="bpm"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>Alerts</span>
              <motion.label whileHover={{ scale: 1.1 }} className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={alerts.heartRate}
                  onChange={() => handleToggle('heartRate')}
                  className="sr-only peer"
                />
                <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${alerts.heartRate ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'} peer-focus:ring-2 peer-focus:ring-teal-400`}></div>
                <div className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform duration-300 ${alerts.heartRate ? 'translate-x-4 bg-white' : 'bg-gray-500'}`}></div>
              </motion.label>
            </div>
          </motion.div>

          {/* Temperature */}
          <motion.div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-teal-50'} shadow-md`}>
            <div className="flex items-center gap-2 mb-2">
              <FaThermometerHalf className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>Temperature</span>
            </div>
            <CircularGauge
              value={temperature}
              max={40}
              label="Temperature"
              color={getTemperatureColor(temperature)}
              unit="°C"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>Alerts</span>
              <motion.label whileHover={{ scale: 1.1 }} className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={alerts.temperature}
                  onChange={() => handleToggle('temperature')}
                  className="sr-only peer"
                />
                <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${alerts.temperature ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'} peer-focus:ring-2 peer-focus:ring-teal-400`}></div>
                <div className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform duration-300 ${alerts.temperature ? 'translate-x-4 bg-white' : 'bg-gray-500'}`}></div>
              </motion.label>
            </div>
          </motion.div>

          {/* GSR */}
          <motion.div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-teal-50'} shadow-md`}>
            <div className="flex items-center gap-2 mb-2">
              <FaBolt className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>GSR</span>
            </div>
            <CircularGauge
              value={gsr}
              max={10}
              label="GSR"
              color={getGSRColor(gsr)}
              unit="μS"
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>Alerts</span>
              <motion.label whileHover={{ scale: 1.1 }} className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={alerts.gsr}
                  onChange={() => handleToggle('gsr')}
                  className="sr-only peer"
                />
                <div className={`w-9 h-5 rounded-full transition-colors duration-300 ${alerts.gsr ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'} peer-focus:ring-2 peer-focus:ring-teal-400`}></div>
                <div className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform duration-300 ${alerts.gsr ? 'translate-x-4 bg-white' : 'bg-gray-500'}`}></div>
              </motion.label>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}