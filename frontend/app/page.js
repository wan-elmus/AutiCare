'use client'

// // app/page.js (Server Component)
// import LandingPageClient from '../components/LandingPage/LandingPageClient'
// import { redirect } from 'next/navigation'

// export default async function LandingPageServer() {
//   let initialUserProfile = null
//   try {
//     const res = await fetch('http://localhost:8000/users/me', {
//       method: 'GET',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include',
//     })
//     if (!res.ok) {
//       throw new Error(`Failed to fetch user profile: ${res.status}`)
//     }
//     initialUserProfile = await res.json()
//   } catch (error) {
//     console.error('Error fetching initial user profile:', error)
//     redirect('/auth/login') // Redirect to login on failure
//   }

//   return <LandingPageClient initialUserProfile={initialUserProfile} />
// }

// app/page.js
// import LandingPageClient from '../components/LandingPage/LandingPageClient';

// export default function Home() {
//   // Skip server-side fetch; let client handle it
//   return <LandingPageClient initialUserProfile={null} />;
// }

'use client'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserContext } from '@/context/UserContext'
import LandingPageClient from '../components/LandingPage/LandingPageClient'

export default function Home() {
  const { user } = useContext(UserContext)
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Home: UserContext user:', user)
    if (!user && !loading) {
      console.log('Home: No user, redirecting to /auth/login')
      router.push('/auth/login')
    }
    setLoading(false)
  }, [user, router, loading])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-teal-600 dark:text-teal-400">Loading...</p>
      </div>
    )
  }

  return <LandingPageClient userProfile={user} />
}