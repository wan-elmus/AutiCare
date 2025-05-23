'use client'
import { useRouter } from 'next/navigation'
import { useState, useContext, useEffect } from 'react'
import { FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { UserContext } from '@/context/UserContext'

export default function LoginPage() {
  const { isDark } = useTheme()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, setUser } = useContext(UserContext)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://195.7.7.15:8002'

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        throw new Error('Invalid email or password')
      }
      const data = await res.json()
      const userData = {
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
      }
      console.log('Login: User set:', userData)
      setUser(userData)
      localStorage.setItem('user_email', userData.email)
      router.push('/')
    } catch (err) {
      setError(err.message)
      console.error('Login error:', err)
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
          <h1 className={`text-3xl font-bold ${isDark ? 'text-teal-300' : 'text-teal-800'}`}>Care Begins Here</h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
            Sign in to monitor and support your child
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <FaEnvelope className={`absolute top-3 left-3 h-5 w-5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                Sign In
                <FaArrowRight className="h-5 w-5" />
              </>
            )}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm">
          <span className={`${isDark ? 'text-teal-400' : 'text-teal-600'}`}>New to AutiCare?</span>{' '}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push('/auth/signup')}
            className={`inline-block px-2 py-1 rounded-md font-medium ${
              isDark ? 'bg-teal-700 text-teal-200 hover:bg-teal-600' : 'bg-teal-200 text-teal-800 hover:bg-teal-300'
            } transition-colors duration-300`}
          >
            Create Account
          </motion.button>
        </p>
      </motion.div>
    </div>
  )
}