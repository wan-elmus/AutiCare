// export function CircularGauge({ value, max, label, color, unit }) {
//     const percentage = Math.min((value / max) * 100, 100) // Ensure it doesn't exceed 100%
//     const circumference = 251.2
//     const offset = circumference - (percentage / 100) * circumference
  
//     return (
//       <div className="relative w-28 h-28 md:w-32 md:h-32 flex flex-col items-center">
//         <svg className="w-full h-full" viewBox="0 0 100 100" role="img" aria-label={`${label}: ${value} ${unit}`}>
//           {/* Background Circle */}
//           <circle className="text-gray-300 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent" />
  
//           {/* Dynamic Value Circle */}
//           <circle
//             className={`stroke-current ${color} transition-all duration-500`}
//             strokeWidth="10"
//             strokeLinecap="round"
//             cx="50"
//             cy="50"
//             r="40"
//             fill="transparent"
//             strokeDasharray={circumference}
//             strokeDashoffset={offset}
//             transform="rotate(-90 50 50)"
//           />
  
//           {/* Center Text */}
//           <text x="50" y="50" className="text-lg md:text-xl font-bold" textAnchor="middle" dy=".3em" fill="black">
//             {value} {unit}
//           </text>
//         </svg>
  
//         {/* Label Below Gauge */}
//         <div className="absolute bottom-0 text-xs md:text-sm text-center text-gray-700 font-medium">{label}</div>
//       </div>
//     )
//   }
  

// components/CircularGauge.js
import React from 'react';

export function CircularGauge({ value, max, label, color, unit, ariaLabel }) {
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
          stroke={color.replace('text-', '')} // Convert Tailwind text color to stroke color
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
        {/* Text in the center */}
        <text x="50" y="50" textAnchor="middle" dy=".3em" className="text-xl md:text-2xl font-bold text-white">
          {value} {unit}
        </text>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 text-center text-white text-sm md:text-base">{label}</div>
    </div>
  );
}