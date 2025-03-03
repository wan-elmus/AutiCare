'use client'
import { useState, useEffect } from 'react'
import { FaUserCircle, FaArrowRight } from 'react-icons/fa' // Modern icons for card and expand
import { X, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export default function ChildProfile({ initialData, isExpanded = false, onExpand }) {
  const { isDark } = useTheme()
  const [userProfile, setUserProfile] = useState(initialData || null)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(!initialData)

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  const notificationVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
  }

  // Fetch user profile if not provided
  useEffect(() => {
    async function fetchUserProfile() {
      setIsLoading(true)
      try {
        const response = await fetch('http://localhost:8000/users/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (!response.ok) throw new Error(`Failed to fetch user profile: ${response.status}`)
        const data = await response.json()
        setUserProfile(data)
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    if (!userProfile) fetchUserProfile()
  }, [userProfile])

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch('http://localhost:8000/api/notifications/', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
        if (!response.ok) throw new Error(`Failed to fetch notifications: ${response.status}`)
        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
      }
    }
    fetchNotifications()
  }, [])

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (isLoading) {
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

  if (!userProfile) {
    return (
      <div className={`text-center p-6 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
        Unable to load profile.
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <FaUserCircle className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                Child Profile
              </h3>
              <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                {userProfile.child_name || 'Unknown Child'}
              </p>
            </div>
          </div>
          <FaArrowRight className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
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
      <div className="flex flex-col items-center mb-6">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isDark ? 'bg-teal-700' : 'bg-teal-200'
          } text-2xl font-bold ${isDark ? 'text-teal-200' : 'text-teal-800'} shadow-md`}
        >
          {userProfile.child_name?.charAt(0) || 'C'}
        </motion.div>
        <h2 className={`mt-3 text-xl font-semibold ${isDark ? 'text-teal-200' : 'text-teal-800'}`}>
          {userProfile.child_name || 'Child Profile'}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-teal-100'}`}>
          <span className={`text-sm font-medium ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>Age:</span>
          <span className={`text-sm ml-2 ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>
            {userProfile.child_age || 'Not specified'}
          </span>
        </div>
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-teal-100'}`}>
          <span className={`text-sm font-medium ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>Joined:</span>
          <span className={`text-sm ml-2 ${isDark ? 'text-teal-100' : 'text-teal-900'}`}>
            {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Not specified'}
          </span>
        </div>
      </div>

      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-teal-100'} mb-6`}>
        <p className={`text-sm ${isDark ? 'text-teal-100' : 'text-teal-900'} leading-relaxed`}>
          {userProfile.child_bio || 'No bio provided.'}
        </p>
      </div>

      <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
        Alerts & Recommendations
      </h2>
      <div className="space-y-4">
        <AnimatePresence>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <motion.div
                key={notification.id}
                variants={notificationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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
                  <X className="h-4 w-4" />
                </motion.button>
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`h-5 w-5 ${
                      notification.level === 'high' ? 'text-red-700' : notification.level === 'slight' ? 'text-yellow-700' : 'text-green-700'
                    }`}
                  />
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
            <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>No notifications available.</p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
