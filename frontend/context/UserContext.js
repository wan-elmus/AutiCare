'use client'
import { createContext, useState } from 'react'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ 
        user, setUser 
    }}>
      {children}
    </UserContext.Provider>
  )
}


// 'use client'
// import { createContext, useContext, useState, useEffect } from 'react'

// const UserContext = createContext()

// export function UserProvider({ children }) {
//   const [user, setUser] = useState(null)
//   const [accessToken, setAccessToken] = useState(null)
//   const [refreshToken, setRefreshToken] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)

//   // Secure token storage with encryption in production
//   const storeTokens = (access, refresh) => {
//     try {
//       if (typeof window !== 'undefined') {
//         localStorage.setItem('access_token', access)
//         localStorage.setItem('refresh_token', refresh)
//       }
//     } catch (error) {
//       console.error('Error storing tokens:', error)
//     }
//   }

//   const clearTokens = () => {
//     try {
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('access_token')
//         localStorage.removeItem('refresh_token')
//       }
//     } catch (error) {
//       console.error('Error clearing tokens:', error)
//     }
//   }

//   // Restore session on mount
//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         const storedAccessToken = typeof window !== 'undefined' 
//           ? localStorage.getItem('access_token')
//           : null
        
//         if (storedAccessToken) {
//           await fetchUserDetails(storedAccessToken)
//         }
//       } catch (error) {
//         console.error('Initialization error:', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     initializeAuth()
//   }, [])

//   const fetchUserDetails = async (token) => {
//     try {
//       const response = await fetch('http://192.7.7.15:8002/users/me', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         credentials: 'include',
//       })

//       if (response.status === 401) {
//         // Token expired, try to refresh
//         const newToken = await refreshAccessToken()
//         if (newToken) {
//           return await fetchUserDetails(newToken)
//         }
//         throw new Error('Session expired')
//       }

//       if (!response.ok) {
//         throw new Error('Failed to fetch user details')
//       }

//       const userData = await response.json()
//       setUser(userData)
//       setAccessToken(token)
//       return true
//     } catch (error) {
//       console.error('Error fetching user details:', error)
//       logout()
//       return false
//     }
//   }

//   const refreshAccessToken = async () => {
//     try {
//       const storedRefreshToken = typeof window !== 'undefined'
//         ? localStorage.getItem('refresh_token')
//         : null

//       if (!storedRefreshToken) {
//         throw new Error('No refresh token available')
//       }

//       const response = await fetch('http://192.7.7.15:8002/auth/refresh', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ refresh_token: storedRefreshToken }),
//         credentials: 'include',
//       })

//       if (!response.ok) {
//         throw new Error('Failed to refresh token')
//       }

//       const { access_token, refresh_token } = await response.json()
//       setAccessToken(access_token)
//       setRefreshToken(refresh_token)
//       storeTokens(access_token, refresh_token)
//       return access_token
//     } catch (error) {
//       console.error('Error refreshing token:', error)
//       logout()
//       return null
//     }
//   }

//   const login = async (userData, accessToken, refreshToken) => {
//     setUser(userData)
//     setAccessToken(accessToken)
//     setRefreshToken(refreshToken)
//     storeTokens(accessToken, refreshToken)
    
//     // Verify the tokens work by fetching user details
//     const success = await fetchUserDetails(accessToken)
//     if (!success) {
//       clearTokens()
//       setUser(null)
//       setAccessToken(null)
//       setRefreshToken(null)
//       throw new Error('Login verification failed')
//     }
//   }

//   const logout = async () => {
//     try {
//       // Optional: Send logout request to backend
//       if (accessToken) {
//         await fetch('http://192.7.7.15:8002/auth/logout', {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//           },
//           credentials: 'include',
//         })
//       }
//     } catch (error) {
//       console.error('Error during logout:', error)
//     } finally {
//       setUser(null)
//       setAccessToken(null)
//       setRefreshToken(null)
//       clearTokens()
//     }
//   }

//   // Add token refresh interval
//   useEffect(() => {
//     if (!accessToken || !refreshToken) return

//     const refreshInterval = setInterval(async () => {
//       try {
//         await refreshAccessToken()
//       } catch (error) {
//         console.error('Background token refresh failed:', error)
//       }
//     }, 15 * 60 * 1000) // Refresh every 15 minutes

//     return () => clearInterval(refreshInterval)
//   }, [accessToken, refreshToken])

//   return (
//     <UserContext.Provider value={{ 
//       user, 
//       accessToken, 
//       refreshToken, 
//       isLoading,
//       login, 
//       logout, 
//       setUser,
//       refreshAccessToken
//     }}>
//       {children}
//     </UserContext.Provider>
//   )
// }

// // export const userContext = () => {
// //   const context = useContext(UserContext)
// //   if (!context) {
// //     throw new Error('useAuth must be used within a UserProvider')
// //   }
// //   return context
// // }