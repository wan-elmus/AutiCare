'use client'

import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useWebSocket } from '../../context/WebSocketContext'
import { FaHeartbeat, FaUserCircle, FaChartLine, FaArrowRight, FaTimes } from 'react-icons/fa'
import RealTimeMonitoring from '../RealTimeMonitoring/RealTimeMonitoring'
import ChildProfile from '../ChildProfile/ChildProfile'
import TrendGraphs from '../TrendGraphs/TrendGraphs'
import Navbar from '../Navbar/Navbar'
import Footer from '../Footer/Footer'
import BottomMenu from '../Navbar/BottomMenu'
import dynamic from 'next/dynamic'
const Plot = dynamic(() => import('../UI/Plot'), {ssr: false,})

export default function LandingPageClient({ initialUserProfile }) {
  const { isDark } = useTheme()
  const { user, setUser } = useContext(UserContext)
  const [userProfile, setUserProfile] = useState(initialUserProfile)
  const { wsMessages } = useWebSocket()
  const [notifications, setNotifications] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeComponent, setActiveComponent] = useState(null)
  const [notificationError, setNotificationError] = useState('')

    let Origin = useState([36.825474,-1.285374]);
    let Destinations = useState([]);
    let Mode = useState('driving');


  useEffect(() => {
    if (initialUserProfile && !user) {
      setUser(initialUserProfile)
      setUserProfile(initialUserProfile)
    }
  }, [initialUserProfile, user, setUser])

  const generatePopupData = (coords) => {
    coords = JSON.parse(coords);
    return {
        latitude: coords[1],
        longitude: coords[0],
        order: '#AZ3XO90P',
        name: 'Jane Doe',
        address: 'Railside Appartments, 7D'
    }
}


  useEffect(() => {
    async function fetchUserProfile() {
      if (!user){
        try {
          const response = await fetch('http://localhost:8000/users/me', {
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

  // notifications
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
        setNotificationError('')
      } catch (error) {
        console.log('Error fetching notifications:', error.message)
        setNotifications([])
        setNotificationError('Unable to load notifications. Please try again later.')
      }
    }
    fetchNotifications()
  }, [])

    // WebSocket messages for notifications
    useEffect(() => {
      const latestMessage = wsMessages[wsMessages.length - 1];
      if (!latestMessage) return;
  
      if (latestMessage.type === 'dismiss_notification') {
        setNotifications((prev) => prev.filter((n) => n.id !== latestMessage.id));
      } else if (latestMessage.type === 'dismiss_all_notifications') {
        setNotifications([]);
      }
    }, [wsMessages]);
  
    const dismissNotification = async (id) => {
      try {
        const response = await fetch(`http://localhost:8000/api/notifications/${id}/dismiss`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to dismiss notification');
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (error) {
        console.log('Error dismissing notification:', error);
      }
    };
  
    const dismissAllNotifications = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/notifications/dismiss-all', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to dismiss all notifications');
        setNotifications([]);
      } catch (error) {
        console.error('Error dismissing all notifications:', error);
      }
    }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  const sidebarVariants = {
    hidden: { x: '-100%' },
    visible: { x: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
    exit: { x: '-100%', transition: { duration: 0.4, ease: 'easeInOut' } },
  }

  const notificationVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
  }

  const cards = [
    {
      title: 'Real-Time Monitoring',
      icon: <FaHeartbeat className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />,
      summary: 'Monitor live stress indicators',
      component: <RealTimeMonitoring isExpanded={true} onExpand={() => setSidebarOpen(false)} />,
    },
    {
      title: 'Child Profile',
      icon: <FaUserCircle className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />,
      summary: userProfile?.child_name ? `${userProfile.child_name}` : 'Profile loading...',
      component: <ChildProfile isExpanded={true} initialData={userProfile} onExpand={() => setSidebarOpen(false)} />,
    },
    {
      title: 'Stress Trends',
      icon: <FaChartLine className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />,
      summary: 'View recent trends over time',
      component: <TrendGraphs isExpanded={true} onExpand={() => setSidebarOpen(false)} />,
    },
  ]

  return (
    <div
      className={`min-h-screen ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-teal-950 to-gray-800' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100'
      }`}
    >
      <Navbar userProfile={userProfile} />
      <div className="flex flex-col lg:flex-row pt-16 px-4 sm:px-6 lg:px-8">
        <main className="flex-1 max-w-4xl mx-auto lg:mr-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`text-3xl sm:text-4xl font-bold text-center mb-8 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}
          >
            Welcome to AutiCare
          </motion.h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  setActiveComponent(card.component)
                  setSidebarOpen(true)
                }}
                className={`p-4 rounded-lg shadow-md cursor-pointer ${
                  isDark ? 'bg-gray-800 border-teal-700' : 'bg-teal-50 border-teal-200'
                } border`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {card.icon}
                    <div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                        {card.title}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{card.summary}</p>
                    </div>
                  </div>
                  <FaArrowRight className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </main>

        <div className="h-[70vh] md:w-3/5 2xl:w-2/3 md:mx-auto rounded-xl border-2 relative">
            <Plot Origin={Origin} Destinations={Destinations} Mode={Mode} query={generatePopupData}/>
        </div>
        {/* Notifications Panel */}
        {/* <aside className="lg:w-1/3 mt-8 lg:mt-0 lg:ml-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={`p-6 rounded-xl shadow-xl ${
              isDark ? 'bg-gray-800 border-teal-700' : 'bg-teal-50 border-teal-200'
            } border h-[calc(100vh-4rem)] overflow-y-auto`}
        >
            <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
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
                      variants={notificationVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
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
                        <X className="h-4 w-4" />
                      </motion.button>
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className={`h-5 w-5 ${
                            notification.level === 'high'
                              ? 'text-red-700'
                              : notification.level === 'slight'
                              ? 'text-yellow-700'
                              : 'text-green-700'
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
                  <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                    {notificationError ? 'Failed to load notifications.' : 'No notifications available.'}
                  </p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </aside> */}
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={sidebarVariants}
            className={`fixed top-0 left-0 h-full w-full sm:w-96 z-40 ${
              isDark ? 'bg-gradient-to-r from-gray-900 to-teal-950' : 'bg-gradient-to-r from-teal-50 to-blue-50'
            } shadow-2xl`}
          >
            <div className="flex justify-between items-center p-4 border-b border-teal-200/50 dark:border-teal-900/50">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                Details
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-teal-100'}`}
              >
                <FaTimes className={`h-6 w-6 ${isDark ? 'text-teal-300' : 'text-teal-600'}`} />
              </motion.button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">{activeComponent}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* <Footer /> */}
      <BottomMenu/>
    </div>
  )
}