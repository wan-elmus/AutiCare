// 'use client'
// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'

// export default function ProtectedRoute({ children }) {
//   const router = useRouter()
//   const [isAuthenticated, setIsAuthenticated] = useState(null)

//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const response = await fetch('http://localhost:8000/users/me', {
//           credentials: 'include',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         })
//         if (!response.ok) {
//           console.error(`Auth check failed: ${response.status}`)
//           router.push('/auth/login')
//         } else {
//           setIsAuthenticated(true)
//         }
//       } catch (error) {
//         console.error("Error checking auth:", error)
//         router.push('/auth/login')
//       }
//     }
//     checkAuth()
//   }, [router])

//   if (isAuthenticated === null) {
//     return <div>Loading...</div> 
//   }

//   return children
// }

