'use client'

import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useWebSocket } from '../../context/WebSocketContext'
import { FaHeartbeat, FaUserCircle, FaChartLine, FaTimes } from 'react-icons/fa'
import RealTimeMonitoring from '../RealTimeMonitoring/RealTimeMonitoring'
import ChildProfile from '../ChildProfile/ChildProfile'
import TrendGraphs from '../TrendGraphs/TrendGraphs'
import Navbar from '../Navbar/Navbar'
import BottomMenu from '../Navbar/BottomMenu'
import dynamic from 'next/dynamic'
const Plot = dynamic(() => import('../UI/Plot'), { ssr: false })

export default function LandingPageClient({ initialUserProfile }) {
  const { isDark } = useTheme()
  const { user, setUser } = useContext(UserContext)
  const [userProfile, setUserProfile] = useState(initialUserProfile)
  const { wsMessages } = useWebSocket()
  const [notifications, setNotifications] = useState([])
  const [notificationError, setNotificationError] = useState('')

  const [origin, setOrigin] = useState([36.825474, -1.285374])
  const [destinations, setDestinations] = useState([])
  const [mode, setMode] = useState('driving')

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
          const response = await fetch('http://195.7.7.15:8002/users/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
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
    async function fetchNotifications() {
      try {
        const response = await fetch('http://195.7.7.15:8002/api/notifications/', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (!response.ok) throw new Error(`Failed to fetch notifications: ${response.status}`)
        const data = await response.json()
        setNotifications(data.notifications || [])
        setNotificationError('')
      } catch (error) {
        console.log('Error fetching notifications:', error.message)
        setNotifications([])
        setNotificationError('Unable to load notifications. Please try again later.')
      }
    }
    fetchNotifications()
  }, [])

  useEffect(() => {
    const latestMessage = wsMessages[wsMessages.length - 1]
    if (!latestMessage) return

    if (latestMessage.type === 'dismiss_notification') {
      setNotifications((prev) => prev.filter((n) => n.id !== latestMessage.id))
    } else if (latestMessage.type === 'dismiss_all_notifications') {
      setNotifications([])
    }
  }, [wsMessages])

  const dismissNotification = async (id) => {
    try {
      const response = await fetch(`http://195.7.7.15:8002/api/notifications/${id}/dismiss`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to dismiss notification')
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.log('Error dismissing notification:', error)
    }
  }

  const dismissAllNotifications = async () => {
    try {
      const response = await fetch('http://195.7.7.15:8002/api/notifications/dismiss-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to dismiss all notifications')
      setNotifications([])
    } catch (error) {
      console.error('Error dismissing all notifications:', error)
    }
  }

  const componentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  return (
    <div
      className={`min-h-screen ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-teal-950 to-gray-800' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100'
      }`}
    >
      <Navbar userProfile={userProfile} />
      <div className="pt-16 px-4 sm:px-6 lg:px-8 pb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`text-3xl sm:text-4xl font-bold text-center mb-8 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}
        >
          AutiCare Dashboard
        </motion.h1>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Real-Time Monitoring */}
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
            <RealTimeMonitoring isExpanded={true} />
          </motion.section>

          {/* Child Profile */}
          <motion.section
            variants={componentVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-xl shadow-lg p-6 ${
              isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'
            } border`}
          >
            <div className="flex items-center gap-3 mb-4">
              <FaUserCircle className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                Child Profile
              </h2>
            </div>
            <ChildProfile isExpanded={true} initialData={userProfile} />
          </motion.section>

          {/* Stress Trends */}
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
                Stress Trends
              </h2>
            </div>
            <TrendGraphs isExpanded={true} />
          </motion.section>

          {/* Map */}
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

          {/* Notifications */}
          <motion.aside
            variants={componentVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-xl shadow-lg p-6 ${
              isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'
            } border max-h-[400px] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                Notifications
              </h2>
              {notifications.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={dismissAllNotifications}
                  className={`text-sm px-3 py-1 rounded-md ${
                    isDark ? 'bg-teal-600 text-teal-100 hover:bg-teal-700' : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  Dismiss All
                </motion.button>
              )}
            </div>
            {notificationError && (
              <p className={`text-sm text-red-500 mb-4`}>{notificationError}</p>
            )}
            <div className="space-y-4">
              <AnimatePresence>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4 }}
                      className={`relative p-4 rounded-lg shadow-md border ${
                        notification.level === 'high'
                          ? 'bg-gradient-to-r from-red-300 to-red-400 border-red-600'
                          : notification.level === 'slight'
                          ? 'bg-gradient-to-r from-yellow-200 to-yellow-300 border-yellow-600'
                          : 'bg-gradient-to-r from-green-200 to-green-300 border-green-600'
                      }`}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => dismissNotification(notification.id)}
                        className="absolute top-2 right-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      >
                        <FaTimes className="h-4 w-4" />
                      </motion.button>
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-5 w-5 ${
                            notification.level === 'high'
                              ? 'text-red-700'
                              : notification.level === 'slight'
                              ? 'text-yellow-700'
                              : 'text-green-700'
                          }`}
                        >
                          {/* Placeholder for AlertCircle icon */}
                          ⚠️
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-gray-900' : 'text-gray-800'}`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-700' : 'text-gray-600'}`}>
                            {notification.recommendation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                    {notificationError ? 'Failed to load notifications.' : 'No notifications available.'}
                  </p>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </div>
      </div>
      <BottomMenu />
    </div>
  )
}