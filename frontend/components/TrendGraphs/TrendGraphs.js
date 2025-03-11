'use client'
import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { FaChartLine, FaArrowRight } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from 'recharts'
import { UserContext } from '@/context/UserContext'

export default function TrendGraphs({ isExpanded = false, onExpand }) {
  const { isDark } = useTheme()
  const { user, setUser } = useContext(UserContext)
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
          const response = await fetch('http://localhost:8000/users/me', {
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

  // historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true)
      try {
        const days = timeRange === 'Last Hour' ? 0.0417 : timeRange === 'Today' ? 1 : 7
        const response = await fetch(
          `http://localhost:8000/history/processed_data?days=${days}&user_id=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        )
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`)
        const historicalData = await response.json()
        setData(
          historicalData.map((d) => ({
            time: new Date(d.timestamp).toLocaleTimeString(),
            heartRate: d.heart_rate,
            temperature: d.temp,
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
  }, [timeRange])

  // WebSocket for real-time updates
  useEffect(() => {
    if (!user?.id) return 
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
    if (!token) {
      console.log('No authentication token found')
      return
    }

    const ws = new WebSocket(`ws://localhost:8000/sensor/ws/sensor/data?token=${encodeURIComponent(token)}`)
    
    ws.onopen = () => console.log('WebSocket connected')
    ws.onmessage = (event) => {
      if (event.data === 'ping') return 
      try {
        const newData = JSON.parse(event.data)
        setLiveData((prevData) => ({
            ...prevData,
            labels: [...(prevData.labels || []), new Date().toLocaleTimeString()],
            heartRate: [...(prevData.heart_rate || []), newData.heart_rate],
            temperature: [...prevData.temperature || [], newData.temperature],
            gsr: [...prevData.gsr || [], newData.gsr],
            stressLevel: [...prevData.stress_level || [], newData.stress_level],
          }));
        } catch (error){
          console.log('Error parsing WebSocket message:', error)
        } 
      }
      ws.onerror = (error) => console.log('WebSocket error:', error)
      ws.onclose = () => console.log('WebSocket disconnected')

      return () => ws.close()
    }, [user])

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

  // Minimal Card View (for Landing Page)
  if (!isExpanded) {
    const latestData = data.length > 0 ? data[data.length - 1] : null
    const trendSummary = latestData
      ? latestData.stressLevel < 1
        ? 'Stable'
        : latestData.stressLevel < 3
        ? 'Moderate Stress'
        : 'High Stress'
      : 'Loading trends...'

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        transition={{ duration: 0.6 }}
        onClick={onExpand}
        className={`p-4 rounded-lg shadow-md cursor-pointer ${
          isDark ? 'bg-gray-800 border-teal-700' : 'bg-teal-50 border-teal-200'
        } border`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <FaChartLine className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                Stress Trends
              </h3>
              <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                {trendSummary}
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
      <h2 className={`text-2xl font-semibold mb-6 ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
        Stress Trends
      </h2>
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
