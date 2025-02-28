// app/dashboard/page.js
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import RealTimeMonitoring from '../components/RealTimeMonitoring/RealTimeMonitoring'
import TrendGraphs from '../components/TrendGraphs/TrendGraphs'
import ChildProfile from '../components/ChildProfile/ChildProfile'

export default function Dashboard() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  if (!token) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-400 pt-16 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <section className="md:w-1/3">
          <RealTimeMonitoring />
        </section>
        <section className="md:w-1/2">
          <TrendGraphs />
        </section>
        <section className="md:w-1/4">
          <ChildProfile />
        </section>
      </div>
    </div>
  )
}