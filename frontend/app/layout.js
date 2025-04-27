'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { UserProvider } from '@/context/UserContext'
import { WebSocketProvider } from '@/context/WebSocketContext'
import BottomMenu from '@/components/Navbar/BottomMenu'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notificationError, setNotificationError] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://195.7.7.15:8002'

  const createCaregiverProfile = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/caregivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.id,
          name: `${userData.first_name} ${userData.last_name}`.trim() || 'Unknown',
          email: userData.email,
          phone: '', 
          relation_type: '' 
        }),
      })
      if (res.ok) {
        console.log('RootLayout: Caregiver profile created:', userData.email)
      } else if (res.status !== 409) {
        console.error('RootLayout: Failed to create caregiver profile, status:', res.status)
      }
    } catch (err) {
      console.error('RootLayout: Error creating caregiver profile:', err)
    }
  }

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        console.log('RootLayout: Stored user from localStorage:', storedUser)
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          const res = await fetch(`${API_URL}/users/me?email=${encodeURIComponent(parsedUser.email)}`)
          if (res.ok) {
            const userData = await res.json()
            console.log('RootLayout: User fetched successfully:', userData)
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
            await createCaregiverProfile(userData)
          } else {
            console.error('RootLayout: Failed to verify user, status:', res.status)
            setUser(null)
            localStorage.removeItem('user')
            localStorage.removeItem('user_email')
          }
        } else {
          console.log('RootLayout: No user in storage')
          setUser(null)
          localStorage.removeItem('user_email')
        }
      } catch (err) {
        console.error('RootLayout: Error initializing user:', err)
        setUser(null)
        localStorage.removeItem('user')
        localStorage.removeItem('user_email')
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()
  }, [API_URL])

  useEffect(() => {
    if (user) {
      console.log('RootLayout: User state changed:', user)
      localStorage.setItem('user', JSON.stringify(user))
    }

    const fetchNotifications = async () => {
      try {
        if (!user?.email) {
          setNotifications([])
          setNotificationError(null)
          return
        }
        const res = await fetch(`${API_URL}/api/notifications?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
          setNotificationError(null)
          console.log('RootLayout: Notifications fetched:', data.notifications)
        } else if (res.status === 404) {
          setNotifications([])
          setNotificationError(null)
          console.log('RootLayout: No notifications found (404)')
        } else {
          throw new Error(`Failed with status ${res.status}`)
        }
      } catch (err) {
        setNotificationError('Failed to load notifications')
        console.error('RootLayout: Notification error:', err)
      }
    }

    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    } else {
      setNotifications([])
      setNotificationError(null)
      setShowNotifications(false)
      console.log('RootLayout: Cleared notifications due to no user')
    }
  }, [user, API_URL])

  const handleNotificationActions = {
    toggle: () => setShowNotifications((prev) => !prev),
    dismiss: async (id) => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/${id}/dismiss?email=${encodeURIComponent(user.email)}`, {
          method: 'PUT',
        })
        if (!res.ok) throw new Error('Dismiss failed')
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        console.log('RootLayout: Dismissed notification:', id)
      } catch (err) {
        console.error('RootLayout: Dismiss error:', err)
      }
    },
    dismissAll: async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/dismiss-all?email=${encodeURIComponent(user.email)}`, {
          method: 'PUT',
        })
        if (!res.ok) throw new Error('Bulk dismiss failed')
        setNotifications([])
        console.log('RootLayout: Dismissed all notifications')
      } catch (err) {
        console.error('RootLayout: Bulk dismiss error:', err)
      }
    },
  }

  console.log('RootLayout: Rendering, user:', user, 'BottomMenu?', !!user)

  if (isLoading) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-gray-900`}>
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-teal-600 dark:text-teal-400">Loading...</p>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-gray-900`}>
        <ThemeProvider>
          <UserProvider value={{ user, setUser }}>
            <WebSocketProvider>
              {children}
              {user && (
                <BottomMenu
                  notifications={notifications}
                  error={notificationError}
                  show={showNotifications}
                  onToggle={handleNotificationActions.toggle}
                  onDismiss={handleNotificationActions.dismiss}
                  onDismissAll={handleNotificationActions.dismissAll}
                />
              )}
            </WebSocketProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
