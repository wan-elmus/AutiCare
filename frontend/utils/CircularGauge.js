import React from 'react';

export default function CircularGauge({ value, max, label, color, unit, ariaLabel }) {
  const percentage = (value / max) * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28 md:w-32 md:h-32" aria-label={ariaLabel}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color.replace('text-', '')}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
        {/* Center text */}
        <text x="50" y="50" textAnchor="middle" dy=".3em" className="text-xl md:text-2xl font-bold text-white">
          {value} {unit}
        </text>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center text-white text-sm md:text-base">{label}</div>
    </div>
  );
}
