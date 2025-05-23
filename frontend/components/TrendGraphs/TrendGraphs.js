'use client'
import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from 'recharts'
import { UserContext } from '@/context/UserContext'
import { useWebSocket } from '@/context/WebSocketContext'

export default function TrendGraphs() {
  const { isDark } = useTheme()
  const { user, setUser } = useContext(UserContext)
  const { wsMessages } = useWebSocket()
  const [data, setData] = useState([])
  const [timeRange, setTimeRange] = useState('Today')
  const [isLoading, setIsLoading] = useState(true)

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  // Fetch user details on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        try {
          const response = await fetch('http://195.7.7.15:8002/users/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          })
          if (!response.ok) throw new Error('Failed to fetch user details')
          const userData = await response.json()
          setUser(userData)
        } catch (error) {
          console.log('Error fetching user details:', error)
        }
      }
    }
    fetchUserDetails()
  }, [user, setUser])

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true)
      if (!user?.id) {
        console.log('No user ID available, skipping historical data fetch')
        setIsLoading(false)
        return
      }
      try {
        const days = timeRange === 'Last Hour' ? 0.0417 : timeRange === 'Today' ? 1 : 7
        const response = await fetch(
          `http://195.7.7.15:8002/history/processed_data?days=${days}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        )
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to fetch data: ${response.status} - ${JSON.stringify(errorData)}`)
        }
        const historicalData = await response.json()
        setData(
          historicalData.map((d) => ({
            time: new Date(d.timestamp).toLocaleTimeString(),
            heartRate: d.heart_rate,
            temperature: d.temperature,
            gsr: d.gsr,
            stressLevel: d.stress_level,
          }))
        )
      } catch (error) {
        console.log('Error fetching trend data:', error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistoricalData()
  }, [timeRange, user?.id])

  // Append real-time data from WebSocket
  useEffect(() => {
    if (!user?.id) return

    const latestMessage = wsMessages[wsMessages.length - 1]
    if (!latestMessage) return

    setData((prevData) => [
      ...prevData,
      {
        time: new Date().toLocaleTimeString(),
        heartRate: latestMessage.heart_rate,
        temperature: latestMessage.temperature,
        gsr: latestMessage.gsr,
        stressLevel: latestMessage.stress_level,
      },
    ])
  }, [user?.id, wsMessages])

  const graphConfig = [
    {
      title: 'Heart Rate',
      dataKey: 'heartRate',
      stroke: isDark ? '#34D399' : '#22C55E', // Green shades
      icon: 'M12 20a8 8 0 0 0 8-8c0-2.5-1.2-4.8-3.2-6.2m-5.6 12a8 8 0 0 1-5.6-13.8',
    },
    {
      title: 'Temperature',
      dataKey: 'temperature',
      stroke: isDark ? '#FBBF24' : '#FACC15', // Yellow shades
      icon: 'M12 16a4 4 0 0 0 0-8m0 12v-4m-4-4h8',
    },
    {
      title: 'GSR',
      dataKey: 'gsr',
      stroke: isDark ? '#60A5FA' : '#2563EB', // Blue shades
      icon: 'M12 16l4-4m-4 0l-4 4m4-12v12',
    },
  ]

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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      className={`p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="mb-6">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className={`w-full p-2 rounded-lg border ${
            isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-100 border-teal-300 text-teal-900'
          } focus:ring-2 focus:ring-teal-400 transition-all`}
        >
          <option value="Last Hour">Last Hour</option>
          <option value="Today">Today</option>
          <option value="This Week">This Week</option>
        </select>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {graphConfig.map((config) => (
          <motion.div
            key={config.title}
            className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-teal-50'} shadow-md`}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg
                className={`h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
              </svg>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                {config.title}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data}>
                <XAxis
                  dataKey="time"
                  tick={{ fill: isDark ? '#A3BFFA' : '#6B7280', fontSize: 12 }}
                  stroke={isDark ? '#4B5563' : '#D1D5DB'}
                />
                <YAxis
                  tick={{ fill: isDark ? '#A3BFFA' : '#6B7280', fontSize: 12 }}
                  stroke={isDark ? '#4B5563' : '#D1D5DB'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
                    borderRadius: '8px',
                    color: isDark ? '#E5E7EB' : '#374151',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={config.dataKey}
                  stroke={config.stroke}
                  strokeWidth={2}
                  dot={false}
                />
                <Brush height={30} stroke={isDark ? '#4B5563' : '#D1D5DB'} travellerWidth={10} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}