import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export default function CircularGauge({ value, max, label, color, unit, ariaLabel }) {
  const { isDark } = useTheme()
  const percentage = (value / max) * 100
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Animation variants
  const gaugeVariants = {
    hidden: { strokeDashoffset: circumference },
    visible: { strokeDashoffset, transition: { duration: 1, ease: 'easeOut' } },
  }

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36"
      role="meter"
      aria-label={ariaLabel || `${label}: ${value} ${unit}`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={isDark ? '#4B5563' : '#E5E7EB'} // Gray shades
          strokeWidth="10"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          initial="hidden"
          animate="visible"
          variants={gaugeVariants}
          transform="rotate(-90 50 50)"
        />
        {/* Center Text */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dy=".3em"
          className={`text-xl md:text-2xl font-bold ${isDark ? 'text-teal-100' : 'text-teal-900'}`}
        >
          {value} {unit}
        </text>
      </svg>
      <div className={`absolute bottom-0 left-0 right-0 text-center text-sm md:text-base ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
        {label}
      </div>
    </motion.div>
  )
}
