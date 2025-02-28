import React from 'react';

export default function StressIndicator({ level }) {
  const colorMap = {
    low: 'bg-green-500',
    moderate: 'bg-yellow-500',
    high: 'bg-red-500',
  };

  const color = colorMap[level];

  return (
    <div className={`p-4 text-center ${color[level]} text-white rounded-lg`}>
      <p className="text-2xl font-bold">Stress Level</p>
      <p className="text-4xl font-bold">
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </p>
    </div>
  );
}



