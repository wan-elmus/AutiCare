"use client"
import { useState, useEffect, createContext, useContext } from "react"
import { io } from "socket.io-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, ChevronDown, Menu, X } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from "recharts"
import { StressIndicator } from "@/components/StressIndicator"
import { CircularGauge } from "@/components/CircularGauge"

// Initialize WebSocket connection (replace with your backend URL)
const socket = io("http://localhost:5000", { transports: ["websocket"] })

// Context for global state management
const StressDataContext = createContext(null)

export default function Dashboard() {
  const [stressData, setStressData] = useState({
    heartRate: 72,
    gsr: 25,
    temperature: 36.8,
  })
  const [notifications, setNotifications] = useState([]) // { id, message, read }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Listen for live updates from WebSocket
    socket.on("stress-update", (data) => {
      setStressData((prev) => ({ ...prev, ...data }))
      setLoading(false)
    })

    socket.on("new-alert", (alert) => {
      setNotifications((prev) => [...prev, { ...alert, read: false }])
    })

    socket.on("connect_error", () => {
      setError("Failed to connect to server")
      setLoading(false)
    })

    // Cleanup listeners on unmount
    return () => {
      socket.off("stress-update")
      socket.off("new-alert")
      socket.off("connect_error")
    }
  }, [])

  return (
    <StressDataContext.Provider value={stressData}>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-400">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-10 bg-blue-700 text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AutiCare-ML</h1>
          <Button variant="ghost" className="md:hidden">
            <Menu className="h-6 w-6" aria-label="Open menu" />
          </Button>
        </header>

        {/* Main Content */}
        <main className="pt-16 p-4">
          {loading ? (
            <p className="text-white text-center">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Live Monitoring */}
              <LiveMonitoringPanel />

              {/* Stress Trends */}
              <StressTrends />

              {/* Alerts & Child Profile */}
              <AlertsAndProfile notifications={notifications} setNotifications={setNotifications} />
            </div>
          )}
        </main>
      </div>
    </StressDataContext.Provider>
  )
}

/* ---------- Components ---------- */

// **Live Monitoring Panel**
function LiveMonitoringPanel() {
  const { heartRate, gsr, temperature } = useContext(StressDataContext)

  // Calculate composite stress level
  const calculateStressLevel = (hr, gsr, temp) => {
    const score = (hr / 120) * 0.5 + (gsr / 100) * 0.3 + ((temp - 36) / 4) * 0.2
    if (score > 0.7) return "high"
    if (score > 0.4) return "moderate"
    return "low"
  }

  return (
    <section className="sm:w-1/3" aria-label="Real-time Stress Indicators">
      <Card className="bg-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-green-400">Live Stress Indicators</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <StressIndicator level={calculateStressLevel(heartRate, gsr, temperature)} />
          <CircularGauge value={heartRate} max={120} label="Heart Rate" color="text-green-500" unit="bpm" aria-label={`Heart Rate: ${heartRate} bpm`} />
          <CircularGauge value={temperature} max={40} label="Temperature" color="text-yellow-500" unit="°C" aria-label={`Temperature: ${temperature} °C`} />
          <CircularGauge value={gsr} max={100} label="GSR" color="text-red-600" unit="μS" aria-label={`GSR: ${gsr} μS`} />
        </CardContent>
      </Card>
    </section>
  )
}

// **Stress Trends Graph**
function StressTrends() {
  const { heartRate, gsr, temperature } = useContext(StressDataContext)
  const [timeRange, setTimeRange] = useState("Today")
  const [trendData, setTrendData] = useState([])

  // Simulate dynamic trend data (replace with real data later)
  useEffect(() => {
    const simulateData = () => {
      const dataPoints = timeRange === "Last Hour" ? 6 : timeRange === "Today" ? 24 : 168
      return Array.from({ length: dataPoints }, (_, i) => ({
        time: `${i}:00`,
        heartRate: heartRate + (Math.random() - 0.5) * 10,
        gsr: gsr + (Math.random() - 0.5) * 5,
        temperature: temperature + (Math.random() - 0.5) * 0.5,
      }))
    }
    setTrendData(simulateData())
  }, [heartRate, gsr, temperature, timeRange])

  return (
    <section className="sm:w-1/2" aria-label="Stress Trends">
      <Card className="bg-white">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-yellow-500">Stress Trends</CardTitle>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded p-1"
            aria-label="Select time range"
          >
            <option value="Last Hour">Last Hour</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
          </select>
        </CardHeader>
        <CardContent>
          {["heartRate", "temperature", "gsr"].map((key, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-blue-600">{key.replace(/([A-Z])/g, " $1")}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey={key} stroke={index === 0 ? "#22C55E" : index === 1 ? "#FACC15" : "#2563EB"} />
                  <Brush height={30} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

// **Alerts & Child Profile**
function AlertsAndProfile({ notifications, setNotifications }) {
  const [profile, setProfile] = useState({ name: "Child Name", age: 8, avatar: "/placeholder.svg" })

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <section className="sm:w-1/4" aria-label="Child Profile and Alerts">
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-600">Child Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Avatar className="w-24 h-24 border-4 border-blue-600 rounded-full">
            <AvatarImage src={profile.avatar} alt="Child avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-bold">{profile.name}</h3>
          <p>Age: {profile.age}</p>
        </CardContent>
        <CardHeader>
          <CardTitle className="text-yellow-500">Alerts & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.map((alert) => (
            <Card key={alert.id} className={`relative ${alert.read ? "bg-gray-200" : "bg-red-100 border-red-500"}`}>
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => setNotifications(notifications.filter((n) => n.id !== alert.id))}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </Button>
              <CardContent>
                <p className={alert.read ? "text-gray-500" : "text-red-700"}>{alert.message}</p>
                {!alert.read && (
                  <Button variant="link" onClick={() => markAsRead(alert.id)} className="text-blue-600">
                    Mark as Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}