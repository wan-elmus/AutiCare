import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export default function StressIndicator({ level }) {
  const { isDark } = useTheme()

  const gradientMap = {
    low: isDark ? 'from-green-600 to-teal-700' : 'from-green-400 to-teal-500',
    moderate: isDark ? 'from-yellow-600 to-orange-700' : 'from-yellow-400 to-orange-500',
    high: isDark ? 'from-red-600 to-pink-700' : 'from-red-400 to-pink-500',
  }

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
      className={`p-3 rounded-lg shadow-md border ${
        isDark ? 'bg-gradient-to-r border-teal-700' : 'bg-gradient-to-r border-teal-200'
      } ${gradient} text-white w-full`}
    >
      <p className="text-[0.5rem] font-semibold capitalize">
        {level || 'Unknown'}
      </p>
    </motion.div>
  )
}