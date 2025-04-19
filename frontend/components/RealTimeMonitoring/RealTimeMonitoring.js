'use client'
import { useEffect, useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { UserContext } from '@/context/UserContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { FaHeartbeat, FaTemperatureHigh, FaBolt } from 'react-icons/fa'
import CircularGauge from '../../utils/CircularGauge'
import StressIndicator from '../StressIndicator/StressIndicator'
import { getHeartRateColor, getTemperatureColor, getGSRColor, getStressLevelColor } from '../../utils/colors'

export default function RealTimeMonitoring({ isExpanded = false, onExpand }) {
  const { isDark } = useTheme()
  const { user } = useContext(UserContext)
  const { wsMessages } = useWebSocket();
  const [heartRate, setHeartRate] = useState(null)
  const [temperature, setTemperature] = useState(null)
  const [gsr, setGsr] = useState(null)
  const [stressLevel, setStressLevel] = useState(null)
  const [alerts, setAlerts] = useState({ heartRate: false, temperature: false, gsr: false })
  const [isLoading, setIsLoading] = useState(true);

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  useEffect(() => {
    if (!user?.id) {
      console.log('No user ID, waiting...');
      setIsLoading(true);
      return;
    }
    if (wsMessages.length === 0) {
      console.log('No WebSocket messages yet');
      setIsLoading(true);
      return;
    }

    const latestMessage = wsMessages[wsMessages.length - 1];
    if (!latestMessage || latestMessage.type !== 'sensor_data') {
      console.log('No valid sensor_data message yet:', latestMessage);
      setIsLoading(true);
      return;
    }

    console.log('Updating real-time metrics:', latestMessage);

    setHeartRate(latestMessage.heart_rate);
    setTemperature(latestMessage.temperature);
    setGsr(latestMessage.gsr);
    setStressLevel(latestMessage.stress_level);
    setIsLoading(false)
  }, [user?.id, wsMessages]);

  const handleToggle = (type) => {
    setAlerts((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[150px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`h-8 w-8 border-4 border-t-teal-600 rounded-full ${isDark ? 'border-gray-700' : 'border-teal-200'}`}
        />
        <span className="ml-2">Waiting for real-time data...</span>
      </div>
    )
  }

  // Card view
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
        <div className="flex items-center justify-between gap-2">
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
          <FaArrowRight className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}/>
        </div>
      </motion.div>
    )
  }

  // Expanded Sidebar
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
              <FaTemperatureHigh className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
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