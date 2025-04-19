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
import LandingPageClient from '../components/LandingPage/LandingPageClient';

export default function Home() {
  // Skip server-side fetch; let client handle it
  return <LandingPageClient initialUserProfile={null} />;
}