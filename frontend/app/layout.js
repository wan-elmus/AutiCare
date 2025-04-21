'use client'
import { useState, useEffect } from 'react'
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const headers = user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {}
        const res = await fetch(`${API_URL}/users/me`, {
          credentials: 'include',
          headers,
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
          await createCaregiverProfile(data)
        } else {
          console.log('No active user session')
          setUser(null)
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setUser(null)
      }
    }

    const createCaregiverProfile = async (userData) => {
      try {
        const headers = userData?.access_token ? { 'Authorization': `Bearer ${userData.access_token}` } : {}
        const res = await fetch(`${API_URL}/caregivers/me`, {
          credentials: 'include',
          headers,
        })
        if (res.status === 404) {
          const caregiverData = {
            name: `${userData.first_name} ${userData.last_name}`,
            email: userData.email,
            phone: null,
            relation_type: 'Parent',
          }
          const caregiverRes = await fetch(`${API_URL}/caregivers/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...headers },
            credentials: 'include',
            body: JSON.stringify(caregiverData),
          })
          if (!caregiverRes.ok) throw new Error(`Failed to create caregiver: ${caregiverRes.status}`)
          console.log('Created caregiver profile')

          // Create a Child record
          const childData = {
            name: 'Test Child',
            age: 5,
            gender: 'Other',
            conditions: '',
            allergies: '',
            milestones: '',
            behavioral_notes: '',
            emergency_contacts: '',
            medical_history: '',
          }
          const childRes = await fetch(`${API_URL}/children`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            credentials: 'include',
            body: JSON.stringify(childData),
          })
          if (!childRes.ok) throw new Error(`Failed to create child: ${childRes.status}`)
          console.log('Created child profile')
        }
      } catch (err) {
        console.error('Error handling caregiver/child profile:', err)
      }
    }

    fetchUser()
  }, [API_URL])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const headers = user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {}
        const res = await fetch(`${API_URL}/api/notifications`, {
          credentials: 'include',
          headers,
        })
        if (!res.ok) throw new Error(`Failed with status ${res.status}`)
        const data = await res.json()
        setNotifications(data.notifications || [])
        setNotificationError(null)
      } catch (err) {
        setNotificationError('Failed to load notifications')
        console.error('Notification error:', err)
      }
    }

    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [user, API_URL])

  const handleNotificationActions = {
    toggle: () => setShowNotifications((prev) => !prev),
    dismiss: async (id) => {
      try {
        const headers = user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {}
        const res = await fetch(`${API_URL}/api/notifications/${id}/dismiss`, {
          method: 'PUT',
          credentials: 'include',
          headers,
        })
        if (!res.ok) throw new Error('Dismiss failed')
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      } catch (err) {
        console.error('Dismiss error:', err)
      }
    },
    dismissAll: async () => {
      try {
        const headers = user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {}
        const res = await fetch(`${API_URL}/api/notifications/dismiss-all`, {
          method: 'PUT',
          credentials: 'include',
          headers,
        })
        if (!res.ok) throw new Error('Bulk dismiss failed')
        setNotifications([])
      } catch (err) {
        console.error('Bulk dismiss error:', err)
      }
    },
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <UserProvider value={{ user, setUser }}>
            <WebSocketProvider>
              {children}
              <BottomMenu
                notifications={notifications}
                error={notificationError}
                show={showNotifications}
                onToggle={handleNotificationActions.toggle}
                onDismiss={handleNotificationActions.dismiss}
                onDismissAll={handleNotificationActions.dismissAll}
              />
            </WebSocketProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}





// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
// import { ThemeProvider } from '@/context/ThemeContext';
// import { UserProvider } from '@/context/UserContext';
// import { WebSocketProvider } from '@/context/WebSocketContext';

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata = {
//   title: "AutiCare",
//   description: "Empowering children with autism through compassionate monitoring and data-driven insights.",
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
//         <ThemeProvider>
//           <UserProvider>
//             <WebSocketProvider>
//             {children}
//             </WebSocketProvider>
//           </UserProvider>
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }