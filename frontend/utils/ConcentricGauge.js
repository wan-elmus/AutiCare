import React from 'react'
import { motion } from 'framer-motion'
import { getHeartRateColor, getGSRColor, getTemperatureColor } from './colors'

export default function ConcentricGauge({ heartRate, gsr, temperature, isDark }) {
  const gauges = [
    {
      value: heartRate,
      max: 150,
      radius: 60,
      color: getHeartRateColor(heartRate),
      unit: 'bpm',
      label: 'BPM',
      textX: 70,
      textY: 20,
    },
    {
      value: gsr,
      max: 500,
      radius: 48,
      color: getGSRColor(gsr),
      unit: 'μS',
      label: 'GSR',
      textX: 70,
      textY: 30,
    },
    {
      value: temperature,
      max: 40,
      radius: 36,
      color: getTemperatureColor(temperature),
      unit: '°C',
      label: 'Temp',
      textX: 70,
      textY: 40,
    },
  ]

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-48 h-48"
      role="meter"
      aria-label="Real-time metrics: Heart Rate, GSR, Temperature"
    >
      <svg className="w-full h-full" viewBox="0 0 140 140">
        {gauges.map((gauge, index) => {
          const percentage = gauge.value !== null ? Math.min((gauge.value / gauge.max) * 100, 100) : 0
          const circumference = 2 * Math.PI * gauge.radius
          const strokeDashoffset = circumference - (percentage / 100) * circumference

          return (
            <g key={`${gauge.label}-${gauge.value}`}>
              {/* Background Circle */}
              <circle
                cx="70"
                cy="70"
                r={gauge.radius}
                fill="none"
                stroke={isDark ? '#4B5563' : '#E5E7EB'}
                strokeWidth="8"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="70"
                cy="70"
                r={gauge.radius}
                fill="none"
                stroke={gauge.value !== null ? gauge.color : '#6B7280'}
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                transform="rotate(-90 70 70)"
              />
              <text
                x={gauge.textX}
                y={gauge.textY}
                textAnchor="middle"
                className={`text-[0.5rem] ${isDark ? 'text-teal-300' : 'text-teal-700'}`}
              >
                {gauge.label}
              </text>
            </g>
          )
        })}
        <motion.text
          x="70"
          y="70"
          textAnchor="middle"
          dy=".3em"
          className={`text-sm font-bold ${isDark ? 'text-teal-100' : 'text-teal-900'}`}
          key={`bpm-${heartRate}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {heartRate !== null ? heartRate : 'N/A'}
        </motion.text>
      </svg>
    </motion.div>
  )
}