'use client'
import { useTheme } from '@/context/ThemeContext'
import { FaSun, FaMoon } from 'react-icons/fa' // Modern icons
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  // Animation variants
  const buttonVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.95 },
  }

  return (
    <motion.button
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={toggleTheme}
      className={`p-2 rounded-full shadow-md transition-colors duration-300 ${isDark ? 'bg-gradient-to-r from-gray-700 to-teal-800' : 'bg-gradient-to-r from-teal-200 to-blue-300'}`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FaSun className="h-6 w-6 text-yellow-400" />
      ) : (
        <FaMoon className="h-6 w-6 text-teal-600" />
      )}
    </motion.button>
  )
}