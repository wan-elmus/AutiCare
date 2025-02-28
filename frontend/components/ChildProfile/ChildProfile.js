'use client'
import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { X } from 'lucide-react'

// Avatar components
function Avatar({ className, children }) {
  return (
    <div className={`flex items-center justify-center ${className} relative`}>
      {children}
    </div>
  )
}

function AvatarImage({ src, alt, className }) {
  return <img src={src} alt={alt} className={`object-cover ${className}`} />
}

function AvatarFallback({ children, className }) {
  return (
    <span className={`absolute inset-0 flex items-center justify-center text-white ${className}`}>
      {children}
    </span>
  )
}

const ChildProfile = () => {
  const [notifications, setNotifications] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  // const [token, setToken] = useState('')


  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const Token = Cookies.get('token')
        if (!Token) {
          console.error('No token found')
          return
        }
        const response = await fetch('http://localhost:8000/users/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`}
          })
          if (!response.ok) throw new Error("Failed to fetch user profile")
          const data = await response.json()
          setUserProfile(data)
          } catch (error) {
            console.error("Error fetching user profile:", error)
          }
        }
        fetchUserProfile()
      }, [])

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const Token = Cookies.get('token')
        const response = await fetch('http://localhost:8000/api/notifications/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Token}`,
          },
        })
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setNotifications(data.notifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }
    fetchNotifications()
  }, [] || [])

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (!userProfile) {
    return <div className="text-center p-6">Loading...</div>
  }

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-lg">
      <h2 className="text-blue-600 text-2xl mb-4">Child Profile</h2>
      <div className="flex flex-col items-center gap-4 mb-6">
        <Avatar className="w-24 h-24 border-4 border-blue-600 rounded-full overflow-hidden">
          <AvatarImage src="/placeholder.svg" alt="Child avatar" className="w-full h-full" />
          <AvatarFallback>
            {userProfile.first_name.charAt(0).toUpperCase()}{' '}
            {userProfile.last_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold">{userProfile.first_name} {userProfile.last_name}</h3>
        <p className="text-gray-600">Email: {userProfile.email}</p>
      </div>
      <h2 className="text-yellow-500 text-2xl mb-4">Alerts &amp; Recommendations</h2>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative p-4 rounded-lg border ${
              notification.level === 'high'
                ? 'bg-red-100 border-red-500'
                : 'bg-yellow-100 border-yellow-500'
            }`}
          >
            <button
              onClick={() => dismissNotification(notification.id)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
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
