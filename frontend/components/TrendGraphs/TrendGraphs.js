'use client'
import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from 'recharts'

const TrendGraphs = () => {
  const [data, setData] = useState([])
  const [timeRange, setTimeRange] = useState('Today')

  useEffect(() => {
    // Client-side cookie parsing
    const token = Cookies.get('token')

    if (!token) return

    const fetchData = async () => {
      const days = timeRange === 'Last Hour' ? 0.0417 : timeRange === 'Today' ? 1 : 7
      const response = await fetch(
        `http://localhost:8000/history/processed_data?days=${days}&user_id=1`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      const processedData = await response.json()
      setData(
        processedData.map(d => ({
          time: new Date(d.timestamp).toLocaleTimeString(),
          heartRate: d.hrate_mean,
          temperature: d.temp_avg,
          gsr: d.gsr_mean
        }))
      )
    }
    fetchData()
  }, [timeRange])

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-yellow-500 text-2xl mb-4">Stress Trends</h2>
      <select 
        value={timeRange} 
        onChange={(e) => setTimeRange(e.target.value)} 
        className="mb-4 p-2 border rounded"
      >
        <option value="Last Hour">Last Hour</option>
        <option value="Today">Today</option>
        <option value="This Week">This Week</option>
      </select>
      <div className="space-y-6">
        <div>
          <h3 className="text-blue-600 text-lg font-semibold mb-2">Heart Rate</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="heartRate" stroke="#22C55E" strokeWidth={2} />
              <Brush height={30} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-blue-600 text-lg font-semibold mb-2">Temperature</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#FACC15" strokeWidth={2} />
              <Brush height={30} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-blue-600 text-lg font-semibold mb-2">GSR</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="gsr" stroke="#2563EB" strokeWidth={2} />
              <Brush height={30} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default TrendGraphs
