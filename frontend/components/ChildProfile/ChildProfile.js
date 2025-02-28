// components/ChildProfile.js
'use client'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@shadcn-ui/react'
import { Bell, X } from 'lucide-react'

const ChildProfile = () => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    // Fetch notifications from backend (placeholder)
    setNotifications([
      { id: 1, level: 'high', message: 'High Stress Detected: Heart Rate at 95 bpm', recommendation: 'Try deep breathing exercises' },
      { id: 2, level: 'moderate', message: 'Moderate Stress Warning: GSR levels rising', recommendation: 'Consider a calming activity' }
    ])
  }, [])

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-lg">
      <h2 className="text-blue-600 text-2xl mb-4">Child Profile</h2>
      <div className="flex flex-col items-center gap-4 mb-6">
        <Avatar className="w-24 h-24 border-4 border-blue-600 rounded-full">
          <AvatarImage src="/placeholder.svg" alt="Child avatar" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold">Child Name</h3>
        <p>Age: 8</p>
        <p>Loves soft music</p>
      </div>
      <h2 className="text-yellow-500 text-2xl mb-4">Alerts & Recommendations</h2>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className={`relative p-4 rounded-lg ${notification.level === 'high' ? 'bg-red-100 border-red-500' : 'bg-yellow-100 border-yellow-500'}`}>
            <button onClick={() => dismissNotification(notification.id)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium">{notification.message}</p>
            <p className="text-xs mt-1">{notification.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChildProfile