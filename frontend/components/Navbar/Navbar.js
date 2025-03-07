'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { MoonIcon, SunIcon, Cog6ToothIcon } from '@heroicons/react/24/solid'
import { FaUserCircle, FaSignOutAlt, FaEdit } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar({ userData }) {
  const { isDark, toggleTheme } = useTheme()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  }

  const HamburgerButton = () => (
    <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className="lg:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400"
      aria-label="Toggle menu"
    >
      <div className={`w-6 h-0.5 bg-teal-100 transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
      <div className={`w-6 h-0.5 bg-teal-100 my-1 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
      <div className={`w-6 h-0.5 bg-teal-100 transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
    </button>
  )

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 shadow-lg ${isDark ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="flex items-center">
              <Cog6ToothIcon className={`h-8 w-8 ${isDark ? 'text-teal-400' : 'text-teal-600'} animate-spin-slow`} />
              <span className={`ml-2 text-2xl font-extrabold ${isDark ? 'text-teal-300' : 'text-teal-700'} tracking-tight`}>
                AutiCare
              </span>
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-teal-100'} transition-colors duration-300`}
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-teal-600" />}
            </motion.button>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-teal-100'} transition-colors duration-300`}
                aria-label="User profile"
              >
                <FaUserCircle className={`h-6 w-6 ${isDark ? 'text-teal-300' : 'text-teal-600'}`} />
              </motion.button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`absolute right-0 mt-2 w-72 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-teal-100'} rounded-lg shadow-2xl border p-4`}
                  >
                    <ProfileDropdown userData={userData} setIsProfileOpen={setIsProfileOpen} isDark={isDark} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Navigation */}
          <HamburgerButton />
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`lg:hidden ${isDark ? 'bg-gray-900' : 'bg-teal-50'} px-4 py-4 shadow-inner`}
            >
              <div className="flex flex-col gap-4">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-teal-100'} transition-colors duration-300`}
                  aria-label="Toggle theme"
                >
                  {isDark ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-teal-600" />}
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-teal-100'} transition-colors duration-300`}
                  aria-label="User profile"
                >
                  <FaUserCircle className={`h-6 w-6 ${isDark ? 'text-teal-300' : 'text-teal-600'}`} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

function ProfileDropdown({ userData, setIsProfileOpen, isDark }) { 
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    childName: userData?.child_name || '',
    childAge: userData?.child_age || '',
    childBio: userData?.child_bio || '',
    newPassword: '',
  })
  const router = useRouter()

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          child_name: formData.childName,
          child_age: formData.childAge,
          child_bio: formData.childBio,
          password: formData.newPassword || undefined,
        }),
      })
      if (response.ok) {
        setIsEditing(false)
        setIsProfileOpen(false)
      } else {
        console.error(`Update failed: ${response.status}`)
      }
    } catch (error) {
      console.log('Update failed:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/auth/login')
    } catch (error) {
      console.log('Logout failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
              Child's Name
            </label>
            <input
              type="text"
              value={formData.childName}
              onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
              className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'} focus:ring-2 focus:ring-teal-400 transition-all`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
              Child's Age
            </label>
            <input
              type="number"
              value={formData.childAge}
              onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
              className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'} focus:ring-2 focus:ring-teal-400 transition-all`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
              Bio
            </label>
            <textarea
              value={formData.childBio}
              onChange={(e) => setFormData({ ...formData, childBio: e.target.value })}
              className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'} focus:ring-2 focus:ring-teal-400 transition-all`}
              rows={3}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-teal-200' : 'text-teal-700'}`}>
              New Password
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className={`w-full p-2 mt-1 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900'} focus:ring-2 focus:ring-teal-400 transition-all`}
            />
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsEditing(false)}
              className={`flex-1 px-4 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-600 text-teal-200 hover:bg-gray-500' : 'bg-teal-200 text-teal-800 hover:bg-teal-300'}`}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="flex-1 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Save
            </motion.button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-teal-700' : 'bg-teal-200'} text-xl font-bold ${isDark ? 'text-teal-200' : 'text-teal-800'}`}>
              {userData?.child_name?.charAt(0) || 'U'}
            </div>
            <div className="space-y-1">
              <h3 className={`font-semibold text-lg ${isDark ? 'text-teal-200' : 'text-teal-800'}`}>
                {userData?.child_name || 'Child Name'}
              </h3>
              <p className={`text-sm ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                Age: {userData?.child_age || 'N/A'}
              </p>
            </div>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
            {userData?.child_bio || 'No bio provided.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className={`w-full py-2 px-4 text-sm rounded-lg flex items-center justify-center gap-2 ${isDark ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-500 hover:bg-teal-600'} text-white`}
          >
            <FaEdit /> Edit Profile
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="w-full py-2 px-4 text-sm rounded-lg flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700"
          >
            <FaSignOutAlt /> Logout
          </motion.button>
        </>
      )}
    </div>
  )
}