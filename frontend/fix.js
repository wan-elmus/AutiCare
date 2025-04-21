'use client'
import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { UserContext } from '@/context/UserContext'
import { useWebSocket } from '@/context/WebSocketContext'
import { FaHeartbeat, FaChartLine, FaArrowDown, FaArrowUp } from 'react-icons/fa'
import RealTimeMonitoring from '../RealTimeMonitoring/RealTimeMonitoring'
import TrendGraphs from '../TrendGraphs/TrendGraphs'
import Navbar from '../Navbar/Navbar'
import dynamic from 'next/dynamic'
const Plot = dynamic(() => import('../UI/Plot'), { ssr: false })

export default function LandingPageClient({ initialUserProfile }) {
  const { isDark } = useTheme()
  const { user, setUser } = useContext(UserContext)
  const [userProfile, setUserProfile] = useState(initialUserProfile)
  const { wsMessages } = useWebSocket()
  const [showTrends, setShowTrends] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [origin, setOrigin] = useState([36.825474, -1.285374])
  const [destinations, setDestinations] = useState([])
  const [mode, setMode] = useState('driving')
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    if (initialUserProfile && !user) {
      setUser(initialUserProfile)
      setUserProfile(initialUserProfile)
    }
  }, [initialUserProfile, user, setUser])

  const generatePopupData = (coords) => {
    try {
      const parsedCoords = typeof coords === 'string' ? JSON.parse(coords) : coords
      return {
        latitude: parsedCoords[1],
        longitude: parsedCoords[0],
        order: '#AZ3XO90P',
        name: 'Jane Doe',
        address: 'Railside Appartments, 7D',
      }
    } catch (error) {
      console.error('Error parsing coords:', error)
      return {
        latitude: -1.285374,
        longitude: 36.825474,
        order: '#AZ3XO90P',
        name: 'Unknown',
        address: 'Unknown',
      }
    }
  }

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) {
        try {
          const response = await fetch(`${API_URL}/users/me`, {
            method: 'GET',
            credentials: 'include',
          })
          if (!response.ok) throw new Error(`Failed to fetch user profile: ${response.status}`)
          const data = await response.json()
          setUser(data)
          setUserProfile(data)
        } catch (error) {
          console.log('Error fetching user profile:', error)
        }
      }
    }
    fetchUserProfile()
  }, [user, setUser])

  useEffect(() => {
    async function fetchSensorData() {
      try {
        const response = await fetch(`${API_URL}/sensor/data`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id,
            gsr: 0,
            heart_rate: 0,
            temperature: 0,
          }),
        })
        if (!response.ok) {
          console.error('Sensor data fetch failed:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
          })
          throw new Error(`Failed to fetch sensor data: ${response.status}`)
        }
        const data = await response.json()
        const validCoords = data
          .filter((d) => d.longitude && d.latitude)
          .map((d) => [d.longitude, d.latitude])
        setDestinations(validCoords)
      } catch (error) {
        console.error('Error fetching sensor data:', error)
      }
    }
    if (user?.id) fetchSensorData()
  }, [user?.id])

  const toggleTrends = () => {
    setShowTrends((prev) => !prev)
  }

  const componentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  useEffect(() => {
    if (userProfile?.first_name) {
      setShowWelcome(true)
      const timer = setTimeout(() => setShowWelcome(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [userProfile])

  return (
    <div
      className={`min-h-screen ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-teal-950 to-gray-800' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100'
      } pb-20`} // Added pb-20 for BottomMenu clearance
    >
      <Navbar userProfile={userProfile} />
      <div className="pt-16 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative h-16 mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`text-xl sm:text-4xl font-bold text-center ${isDark ? 'text-teal-300' : 'text-teal-700'}`}
          >
            Welcome to AutiCare
          </motion.h1>
          <AnimatePresence>
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className={`absolute inset-x-0 top-0 text-center text-sm ${
                  isDark ? 'text-teal-200' : 'text-teal-600'
                }`}
              >
                We're glad to see you back
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
          <motion.section
            variants={componentVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-xl shadow-lg p-6 ${
              isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'
            } border`}
          >
            <div className="flex items-center gap-3 mb-4">
              <FaHeartbeat className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                Real-Time Monitoring
              </h2>
            </div>
            <RealTimeMonitoring />
          </motion.section>

          <motion.section
            variants={componentVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-xl shadow-lg p-6 ${
              isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'
            } border`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <FaChartLine className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                <h2 className={`text-2xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                  Stress Trends
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTrends}
                className={`p-2 rounded-full ${
                  isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                {showTrends ? <FaArrowUp className="h-5 w-5" /> : <FaArrowDown className="h-5 w-5" />}
              </motion.button>
            </div>
            <AnimatePresence>
              {showTrends && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <TrendGraphs />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          <motion.section
            variants={componentVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-xl shadow-lg p-6 ${
              isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'
            } border`}
          >
            <div className="flex items-center gap-3 mb-4">
              <FaChartLine className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                Location Tracking
              </h2>
            </div>
            <div className="h-[500px] rounded-lg overflow-hidden">
              <Plot Origin={origin} Destinations={destinations} Mode={mode} query={generatePopupData} />
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}