'use client'
import { useState, useEffect } from 'react'
// import Cookies from 'js-cookie'
import { UserCircleIcon } from '@heroicons/react/24/solid'
import { X } from 'lucide-react'

export default function ChildProfile({ initialData }) {
  const [userProfile, setUserProfile] = useState(initialData || null)
  const [notifications, setNotifications] = useState([])

  // Fetch the user profile if not provided via initialData
  useEffect(() => {
    async function fetchUserProfile() {
        try {
          const response = await fetch('http://localhost:8000/users/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: "include",
        })
        if (!response.ok) throw new Error(`Failed to fetch user profile ${response.status}`)
        const data = await response.json()
        setUserProfile(data)
      } catch (error) {
        console.error("Error fetching user profile:", error)
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
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error('Failed to fetch notifications')
        }
        const data = await response.json()
        setNotifications(data.notifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }
    fetchNotifications()
  }, [])

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (!userProfile) {
    return <div className="text-center p-6">Loading profile...</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      {/* Profile Section */}
      <div className="flex flex-col items-center mb-6">
        <UserCircleIcon className="h-16 w-16 text-gray-400 dark:text-gray-600" />
        <h2 className="text-xl font-semibold mt-2 dark:text-white">
          {userProfile?.child_name || 'Child Profile'}
        </h2>
      </div>
      
      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Age:</span>
          <span className="dark:text-white">{userProfile?.child_age || 'Not specified'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Joined:</span>
          <span className="dark:text-white">
            {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Not specified'}
          </span>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {userProfile.child_bio || 'No bio provided. Add a personal note about the child.'}
        </p>
      </div>
      
      {/* Notifications Section */}
      <h2 className="text-yellow-500 dark:text-yellow-400 text-2xl mb-4">Alerts &amp; Recommendations</h2>
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative p-4 rounded-lg border ${
                notification.level === 'high'
                  ? 'bg-red-200 border-red-600'
                  : notification.level === 'slight'
                  ? 'bg-yellow-200 border-yellow-600'
                  : 'bg-green-200 border-green-600'
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
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No notifications available.</p>
        )}
      </div>
    </div>
  )
}
