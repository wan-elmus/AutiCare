'use client'
import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { UserContext } from '@/context/UserContext'
import { FaHome, FaUser, FaBell, FaRobot, FaTimes } from 'react-icons/fa'

export default function BottomMenu({
  notifications,
  error: notificationError,
  show: showNotifications,
  onToggle,
  onDismiss,
  onDismissAll,
}) {
  const { isDark } = useTheme()
  const { user } = useContext(UserContext)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [dosages, setDosages] = useState([])
  const [dosageError, setDosageError] = useState(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://195.7.7.15:8002'

  console.log('BottomMenu: Rendering, user:', user)

  useEffect(() => {
    if (user?.email) {
      fetchDosages()
    } else {
      setDosages([])
      setDosageError(null)
    }
  }, [user])

  const fetchDosages = async () => {
    try {
      if (!user?.email) {
        throw new Error('No user email available')
      }
      const res = await fetch(`${API_URL}/dosages?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
      })
      if (!res.ok) {
        if (res.status === 404) {
          setDosages([])
          setDosageError('No dosages found. Add a child profile first.')
        } else {
          throw new Error(`Failed to fetch dosages: ${res.status}`)
        }
      } else {
        const data = await res.json()
        setDosages(data)
        setDosageError(null)
        console.log('BottomMenu: Dosages fetched:', data)
      }
    } catch (err) {
      setDosageError(err.message)
      console.error('BottomMenu: Error fetching dosages:', err)
    }
  }

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission)
      })
    } else {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    const checkDosages = () => {
      const now = new Date()
      const currentDay = now.toLocaleString('en-US', { weekday: 'long' })
      const currentTime = now.toTimeString().slice(0, 5)

      dosages.forEach((dosage) => {
        if (dosage.status !== 'active') return
        const startDate = new Date(dosage.start_date)
        if (startDate > now) return

        let shouldNotify = false
        if (dosage.frequency === 'daily') {
          const [doseHour, doseMinute] = dosage.intervals?.[0]?.split(':')?.map(Number) || [0, 0]
          const doseTime = new Date(now)
          doseTime.setHours(doseHour, doseMinute, 0, 0)
          const reminderTime = new Date(doseTime.getTime() - 10 * 60 * 1000)
          const reminderTimeStr = reminderTime.toTimeString().slice(0, 5)
          if (currentTime === reminderTimeStr) {
            shouldNotify = true
          }
        } else if (dosage.frequency === 'specific_days' && dosage.intervals.includes(currentDay)) {
          const [doseHour, doseMinute] = dosage.intervals?.[0]?.split(':')?.map(Number) || [0, 0]
          const doseTime = new Date(now)
          doseTime.setHours(doseHour, doseMinute, 0, 0)
          const reminderTime = new Date(doseTime.getTime() - 10 * 60 * 1000)
          const reminderTimeStr = reminderTime.toTimeString().slice(0, 5)
          if (currentTime === reminderTimeStr) {
            shouldNotify = true
          }
        } else if (dosage.frequency === 'every_x_hours') {
          const hours = parseInt(dosage.intervals[0]) || 24
          const start = new Date(dosage.start_date)
          const elapsed = now.getTime() - start.getTime()
          const intervalsPassed = Math.floor(elapsed / (hours * 60 * 60 * 1000))
          const nextDoseTime = new Date(start.getTime() + intervalsPassed * hours * 60 * 60 * 1000)
          const reminderTime = new Date(nextDoseTime.getTime() - 10 * 60 * 1000)
          const reminderTimeStr = reminderTime.toTimeString().slice(0, 5)
          if (currentTime === reminderTimeStr && nextDoseTime <= now) {
            shouldNotify = true
          }
        }

        if (shouldNotify && notificationPermission === 'granted') {
          new Notification(`Dosage Reminder: ${dosage.medication}`, {
            body: `Time to administer ${dosage.dosage} of ${dosage.medication} for ${dosage.condition} in 10 minutes.`,
            icon: '/favicon.ico',
          })
        }
      })
    }

    const interval = setInterval(checkDosages, 60 * 1000)
    return () => clearInterval(interval)
  }, [dosages, notificationPermission])

  const tabs = [
    { id: 'home', icon: <FaHome className="h-6 w-6" />, label: 'Home', route: '/' },
    { id: 'account', icon: <FaUser className="h-6 w-6" />, label: 'Account', route: '/profile' },
    {
      id: 'notifications',
      icon: (
        <div className="relative">
          <FaBell className="h-6 w-6" />
          {user && notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </div>
      ),
      label: 'Notifications',
      route: null,
    },
    { id: 'ai', icon: <FaRobot className="h-6 w-6" />, label: 'AI', route: '/chatbot' },
  ]

  const handleTabClick = (tabId, route) => {
    console.log(`BottomMenu: Tab clicked: ${tabId}, route: ${route}, user:`, user)
    if (!user) {
      console.log('BottomMenu: No user, redirecting to /auth/login')
      router.push('/auth/login')
      return
    }
    setActiveTab(tabId)
    if (tabId === 'notifications') {
      onToggle()
    } else if (route) {
      router.push(route)
    }
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 ${
        isDark ? 'bg-gradient-to-tl from-gray-900 via-teal-950 to-gray-800' : 'bg-white'
      } shadow-lg pb-safe`}
    >
      <AnimatePresence>
        {showNotifications && user && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`absolute bottom-16 left-0 right-0 p-6 max-h-[400px] overflow-y-auto ${
              isDark ? 'bg-gray-800 border-teal-700' : 'bg-white border-teal-200'
            } border rounded-t-xl shadow-lg`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                Notifications
              </h2>
              {notifications.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDismissAll}
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
                        onClick={() => onDismiss(notification.id)}
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
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTabClick(tab.id, tab.route)}
            className={`flex flex-col items-center ${
              activeTab === tab.id
                ? isDark
                  ? 'text-teal-400'
                  : 'text-teal-600'
                : isDark
                  ? 'text-gray-400'
                  : 'text-gray-600'
            }`}
          >
            {tab.icon}
            <span className="text-xs font-semibold mt-1">{tab.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}