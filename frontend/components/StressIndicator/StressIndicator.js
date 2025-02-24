// import { Card, CardContent } from "@/components/ui/card"

// export function StressIndicator({ level }) {
//   const colorMap = {
//     low: "bg-green-500",
//     moderate: "bg-yellow-500",
//     high: "bg-red-500",
//   }

//   return (
//     <Card className={`p-4 text-center shadow-md rounded-lg ${colorMap[level]}`}>
//       <CardContent>
//         <p className="text-xl md:text-2xl font-semibold text-white">Stress Level</p>
//         <p className="text-3xl md:text-4xl font-bold text-white capitalize">{level}</p>
//       </CardContent>
//     </Card>
//   )
// }

// components/StressIndicator.js
import React from 'react';

export function StressIndicator({ level }) {
  const colorMap = {
    low: 'bg-green-500',
    moderate: 'bg-yellow-500',
    high: 'bg-red-500',
  };

  return (
    <div className={`p-4 text-center ${colorMap[level]} text-white rounded-lg`}>
      <p className="text-2xl font-bold">Stress Level</p>
      <p className="text-4xl font-bold">{level.charAt(0).toUpperCase() + level.slice(1)}</p>
    </div>
  );
}


// import React, { useEffect, useState } from "react";

// const StressUpdates = () => {
//     const [stressLevel, setStressLevel] = useState("Waiting for updates...");

//     useEffect(() => {
//         const token = localStorage.getItem("token");  // Assume token is stored in localStorage
//         const ws = new WebSocket(`ws://localhost:8000/ws/predictions?token=${token}`);

//         ws.onmessage = (event) => {
//             setStressLevel(event.data);
//         };

//         ws.onclose = () => {
//             console.log("WebSocket Disconnected");
//         };

//         return () => {
//             ws.close();
//         };
//     }, []);

//     return (
//         <div>
//             <h2>Real-Time Stress Level Updates</h2>
//             <p>{stressLevel}</p>
//         </div>
//     );
// };

// export default StressUpdates;
