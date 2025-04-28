'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FaUser, FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export default function SignupPage() {
  const { isDark } = useTheme()
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('http://195.7.7.15:8002/users/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Registration failed')
      }

      const data = await response.json()
      if (data.message === 'User created successfully') {
        router.push('/auth/login')
      } else {
        throw new Error('Unexpected response from server')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-teal-950 to-gray-800' : 'bg-gradient-to-br from-teal-50 via-blue-50 to-teal-100'
      }`}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        className={`w-full max-w-md p-6 sm:p-8 rounded-xl shadow-xl ${
          isDark ? 'bg-gray-800 border-teal-700' : 'bg-teal-50 border-teal-200'
        } border`}
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDark ? 'bg-teal-700' : 'bg-teal-200'
            } text-3xl font-bold ${isDark ? 'text-teal-200' : 'text-teal-800'} shadow-md mb-4`}
          >
            A 
          </motion.div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-teal-300' : 'text-teal-800'}`}>Join AutiCare</h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
            Start supporting your child today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <FaUser className={`absolute top-3 left-3 h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full pl-10 p-2 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-100 border-teal-300 text-teal-900'
                } focus:ring-2 focus:ring-teal-400 transition-all`}
                placeholder="First Name"
                required
              />
            </div>
            <div className="relative">
              <FaUser className={`absolute top-3 left-3 h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full pl-10 p-2 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-100 border-teal-300 text-teal-900'
                } focus:ring-2 focus:ring-teal-400 transition-all`}
                placeholder="Last Name"
                required
              />
            </div>
          </div>

          <div className="relative">
            <FaEnvelope className={`absolute top-3 left-3 h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full pl-10 p-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-100 border-teal-300 text-teal-900'
              } focus:ring-2 focus:ring-teal-400 transition-all`}
              placeholder="Email"
              required
            />
          </div>

          <div className="relative">
            <FaLock className={`absolute top-3 left-3 h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full pl-10 p-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-teal-100' : 'bg-teal-100 border-teal-300 text-teal-900'
              } focus:ring-2 focus:ring-teal-400 transition-all`}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading}
            className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 ${
              isDark ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-500 hover:bg-teal-600'
            } text-white transition-colors duration-300`}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-5 w-5 border-2 border-t-white rounded-full"
              />
            ) : (
              <>
                Create Account
                <FaArrowRight className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm">
          <span className={`${isDark ? 'text-teal-400' : 'text-teal-600'}`}>Already with AutiCare?</span>{' '}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push('/auth/login')}
            className={`inline-block px-2 py-1 rounded-md font-medium ${
              isDark ? 'bg-teal-700 text-teal-200 hover:bg-teal-600' : 'bg-teal-200 text-teal-800 hover:bg-teal-300'
            } transition-colors duration-300`}
          >
            Sign In
          </motion.button>
        </p>
      </motion.div>
    </div>
  )
}