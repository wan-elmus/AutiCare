

import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import RealTimeMonitoring from '../../components/RealTimeMonitoring/RealTimeMonitoring'
import TrendGraphs from '../../components/TrendGraphs/TrendGraphs'
import ChildProfile from '../../components/ChildProfile/ChildProfile'
import { redirect } from 'next/navigation'

// Server component - no 'use client' or getServerSideProps needed
export default async function Dashboard() {
  let userProfile = null
  try {
    const res = await fetch('http://localhost:8000/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch user profile: ${res.status}`)
    }

    userProfile = await res.json()
  } catch (error) {
    console.error('Error fetching user profile:', error)
    redirect('/auth/login') // Redirect to login on failure
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-blue-600 pt-16 p-4 sm:p-6 lg:p-8">
      <Navbar userProfile={userProfile} />
      <main className="max-w-7xl mx-auto pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <RealTimeMonitoring />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <TrendGraphs />
          </div>
          <div>
            <ChildProfile userData={userProfile} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}