/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      optimizeFonts: false,
    },
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy API routes (e.g., /api/notifications/)
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      // Proxy sensor routes (e.g., /sensor/data)
      {
        source: '/sensor/:path*',
        destination: 'http://localhost:8000/sensor/:path*',
      },
      // Proxy user and auth routes (e.g., /users/me, /auth/login)
      {
        source: '/:path(users|auth)/:subpath*',
        destination: 'http://localhost:8000/:path/:subpath*',
      },
    ];
  },
};

export default nextConfig;



// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     experimental: {
//       turbo: {
//         optimizeFonts: false,
//       },
//       serverActions: {
//         allowedOrigins: ['localhost:3000'],
//       },
//     },
//     async headers() {
//       return [
//         {
//           source: '/(.*)',
//           headers: [
//             {
//               key: 'Access-Control-Allow-Credentials',
//               value: 'true',
//             },
//             {
//               key: 'Access-Control-Allow-Origin',
//               value: 'http://localhost:3000',
//             },
//             {
//               key: 'Access-Control-Allow-Methods',
//               value: 'GET, POST, PUT, DELETE, OPTIONS',
//             },
//             {
//               key: 'Access-Control-Allow-Headers',
//               value: 'Content-Type, Authorization',
//             },
//           ],
//         },
//       ];
//     },
//     async rewrites() {
//       return [
//         {
//           source: '/api/:path*',
//           destination: 'http://195.7.7.15:8000/api/:path*',
//         },
//         {
//           source: '/sensor/:path*',
//           destination: 'http://195.7.7.15:8000/sensor/:path*',
//         },
//         {
//           source: '/:path(users|auth)/:subpath*',
//           destination: 'http://195.7.7.15:8000/:path/:subpath*',
//         },
//       ];
//     },
//   };
  
//   export default nextConfig;