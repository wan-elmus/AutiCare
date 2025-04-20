'use client'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useContext } from 'react'
import { UserContext } from '@/context/UserContext'
import { MoonIcon, SunIcon, Cog6ToothIcon } from '@heroicons/react/24/solid'
import { FaSignOutAlt } from 'react-icons/fa'
import { motion } from 'framer-motion'

export default function Navbar({ userData }) {
  const { isDark, toggleTheme } = useTheme()
  const { setUser } = useContext(UserContext)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('http://195.7.7.15:8002/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      router.push('/auth/login')
    } catch (error) {
      console.log('Logout failed:', error)
      setUser(null)
      router.push('/auth/login')
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-40 shadow-lg ${
        isDark
          ? 'bg-gradient-to-r from-gray-900/80 via-gray-800/80 to-gray-900/80'
          : 'bg-gradient-to-r from-teal-50/80 via-blue-50/80 to-teal-50/80'
      } backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo Section */}
          <div className="flex items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <Cog6ToothIcon
                className={`h-7 w-7 ${isDark ? 'text-teal-400' : 'text-teal-600'} animate-spin-slow`}
              />
              <span
                className={`ml-2 text-xl font-extrabold ${
                  isDark ? 'text-teal-300' : 'text-teal-700'
                } tracking-tight`}
              >
                AutiCare
              </span>
            </motion.div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-1.5 rounded-full ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-teal-100'
              } transition-colors duration-300`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5 text-yellow-400" />
              ) : (
                <MoonIcon className="h-5 w-5 text-teal-600" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg shadow-md ${
                isDark
                  ? 'bg-teal-600 text-teal-100 hover:bg-teal-700'
                  : 'bg-teal-500 text-white hover:bg-teal-600'
              } transition-colors duration-300`}
              aria-label="Logout"
            >
              <FaSignOutAlt className="h-4 w-4" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  )
}