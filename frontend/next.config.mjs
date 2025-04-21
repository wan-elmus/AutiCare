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

  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
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
            value: '*',
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
        destination: 'http://195.7.7.15:8002/api/:path*',
      },
      // Proxy sensor routes (e.g., /sensor/data)
      {
        source: '/sensor/:path*',
        destination: 'http://195.7.7.15:8002/sensor/:path*',
      },
      // Proxy user and auth routes (e.g., /users/me, /auth/login)
      {
        source: '/:path(users|auth|caregivers|children|dosages)/:subpath*',
        destination: 'http://195.7.7.15:8002/:path/:subpath*',
      },
    ];
  },
  images: {
    domains: ['api.mapbox.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
        port: '',
        pathname: '/**',
      },
    ],
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