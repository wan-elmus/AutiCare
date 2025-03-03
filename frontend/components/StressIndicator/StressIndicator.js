import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export default function StressIndicator({ level, color }) {
  const { isDark } = useTheme()

  // Gradient color map based on level
  const gradientMap = {
    low: isDark ? 'from-green-600 to-teal-700' : 'from-green-400 to-teal-500',
    moderate: isDark ? 'from-yellow-600 to-orange-700' : 'from-yellow-400 to-orange-500',
    high: isDark ? 'from-red-600 to-pink-700' : 'from-red-400 to-pink-500',
  }

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  const gradient = gradientMap[level] || gradientMap.low

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      className={`p-6 rounded-xl shadow-lg border ${isDark ? 'bg-gradient-to-r border-gray-700' : 'bg-gradient-to-r border-teal-200'} ${gradient} text-white w-full max-w-xs`}
    >
      <p className="text-lg font-semibold tracking-wide">Stress Level</p>
      <p className="text-3xl font-bold mt-2 capitalize">
        {level || 'Unknown'}
      </p>
    </motion.div>
  )
}
