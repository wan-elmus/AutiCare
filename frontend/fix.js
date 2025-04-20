'use client'
import { useState, useEffect } from 'react'
import { UserProvider } from '@/context/UserContext'
import { WebSocketProvider } from '@/context/WebSocketContext'
import BottomMenu from '@/components/BottomMenu'

export default function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notificationError, setNotificationError] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
          // Create Caregiver profile if not exists
          await createCaregiver(data)
        } else {
          console.log('No user session found')
          setUser(null)
        }
      } catch (err) {
        console.log('Error fetching user:', err)
        setUser(null)
      }
    }

    const createCaregiver = async (userData) => {
      try {
        const res = await fetch(`${API_URL}/caregivers/me`, {
          credentials: 'include',
        })
        if (res.status === 404) {
          const caregiverData = {
            name: `${userData.first_name} ${userData.last_name}`,
            email: userData.email,
            phone: null,
            relation_type: 'Parent',
          }
          await fetch(`${API_URL}/caregivers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(caregiverData),
          })
          console.log('Created caregiver profile')
        }
      } catch (err) {
        console.log('Error creating caregiver:', err)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`)
        const data = await res.json()
        setNotifications(data.notifications || [])
        setNotificationError(null)
      } catch (err) {
        setNotificationError('Unable to fetch notifications')
        console.log('Error fetching notifications:', err)
      }
    }
    if (user) fetchNotifications()
  }, [user])

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
  }

  const dismissNotification = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/dismiss`, {
        method: 'PUT',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to dismiss notification')
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.log('Error dismissing notification:', err)
    }
  }

  const dismissAllNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/dismiss-all`, {
        method: 'PUT',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to dismiss all notifications')
      setNotifications([])
    } catch (err) {
      console.log('Error dismissing all notifications:', err)
    }
  }

  return (
    <UserProvider>
      <WebSocketProvider>
        <Component {...pageProps} />
        <BottomMenu
          notifications={notifications}
          notificationError={notificationError}
          showNotifications={showNotifications}
          toggleNotifications={toggleNotifications}
          dismissNotification={dismissNotification}
          dismissAllNotifications={dismissAllNotifications}
        />
      </WebSocketProvider>
    </UserProvider>
  )
}