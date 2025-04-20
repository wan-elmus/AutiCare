'use client'
import { useEffect, useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { UserContext } from '@/context/UserContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { FaHeartbeat, FaTemperatureHigh, FaBolt } from 'react-icons/fa'
import ConcentricGauge from '../../utils/ConcentricGauge'

export default function RealTimeMonitoring() {
  const { isDark } = useTheme()
  const { user } = useContext(UserContext)
  const { wsMessages } = useWebSocket()
  const [heartRate, setHeartRate] = useState(null)
  const [temperature, setTemperature] = useState(null)
  const [gsr, setGsr] = useState(null)
  const [stressLevel, setStressLevel] = useState(null)
  const [alerts, setAlerts] = useState({ heartRate: false, temperature: false, gsr: false })
  const [isLoading, setIsLoading] = useState(true)

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  useEffect(() => {
    if (!user?.id) {
      console.log('No user ID, waiting...')
      setIsLoading(true)
      return
    }
    if (wsMessages.length === 0) {
      console.log('No WebSocket messages yet')
      setIsLoading(true)
      return
    }

    const latestMessage = wsMessages[wsMessages.length - 1]
    if (!latestMessage || latestMessage.type !== 'sensor_data') {
      console.log('No valid sensor_data message:', latestMessage)
      setIsLoading(true)
      return
    }

    try {
      console.log('Parsed WebSocket message:', latestMessage)
      // Validate and normalize data
      const validatedHeartRate = Math.max(0, Math.min(150, latestMessage.heart_rate || 0))
      const validatedTemperature = Math.max(0, Math.min(40, latestMessage.temperature || 0))
      const validatedGsr = Math.max(0, Math.min(10, latestMessage.gsr || 0))
      const validatedStressLevel = Math.max(0, Math.min(3, latestMessage.stress_level || 0))

      setHeartRate(validatedHeartRate)
      setTemperature(validatedTemperature)
      setGsr(validatedGsr)
      setStressLevel(validatedStressLevel)
      setIsLoading(false)
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, latestMessage)
      setIsLoading(true)
    }
  }, [user?.id, wsMessages])

  const handleToggle = (type) => {
    setAlerts((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  if (isLoading || !user) {
    return (
      <motion.div
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-center min-h-[200px]"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`h-8 w-8 border-4 border-t-teal-600 rounded-full ${isDark ? 'border-gray-700' : 'border-teal-200'}`}
        />
        <span className={`ml-2 text-sm ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
          Waiting for real-time data...
        </span>
      </motion.div>
    )
  }

  const metrics = [
    {
      label: 'Heart Rate',
      value: heartRate,
      unit: 'bpm',
      icon: <FaHeartbeat className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />,
      alert: alerts.heartRate,
      toggle: () => handleToggle('heartRate'),
    },
    {
      label: 'GSR',
      value: gsr,
      unit: 'μS',
      icon: <FaBolt className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />,
      alert: alerts.gsr,
      toggle: () => handleToggle('gsr'),
    },
    {
      label: 'Temperature',
      value: temperature,
      unit: '°C',
      icon: <FaTemperatureHigh className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />,
      alert: alerts.temperature,
      toggle: () => handleToggle('temperature'),
    },
  ]

  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      className={`p-6 rounded-xl shadow-lg ${
        isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'
      } border`}
    >
      <div className="mb-6">
        <h2 className={`text-2xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
          Live Stress Indicators
        </h2>
      </div>
      <div className="flex flex-col items-center gap-8">
        {/* Single Concentric Gauge */}
        <ConcentricGauge
          heartRate={heartRate}
          gsr={gsr}
          temperature={temperature}
          isDark={isDark}
        />

        {/* Metric Icons and Values */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-md">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              variants={fadeInVariants}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-2">{metric.icon}</div>
              <span className={`text-sm font-medium ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                {metric.label}
              </span>
              <span className={`text-md font-bold ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>
                {metric.value !== null ? `${metric.value} ${metric.unit}` : 'N/A'}
              </span>
              <div className="flex items-center justify-center mt-2">
                <motion.label whileHover={{ scale: 1.1 }} className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metric.alert}
                    onChange={metric.toggle}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-9 h-5 rounded-full transition-colors duration-300 ${
                      metric.alert ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'
                    } peer-focus:ring-2 peer-focus:ring-teal-400`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform duration-300 ${
                      metric.alert ? 'translate-x-4 bg-white' : 'bg-gray-500'
                    }`}
                  ></div>
                </motion.label>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stress Level */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          className={`w-full max-w-md p-4 rounded-xl shadow-md ${
            isDark ? 'bg-gray-900 border-teal-700' : 'bg-teal-50 border-teal-200'
          } border`}
        >
          <p className={`text-lg text-align-center font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
            Stress Level: {stressLevel !== null ? stressLevel : 'N/A'}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}