/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      turbo: {
        optimizeFonts: false,
      },
      serverActions: {
        allowedOrigins: ['localhost:3000', 'http://localhost:3000'],
      },
    },
    
    // Fix for WebSocket HMR connection
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
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          ],
        },
        {
          source: '/_next/static/(.*)',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ],
        },
      ];
    },
  
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://192.7.7.15:8002/api/:path*',
        },
        {
          source: '/sensor/:path*',
          destination: 'http://192.7.7.15:8002/sensor/:path*',
        },
        {
          source: '/:path(users|auth)/:subpath*',
          destination: 'http://192.7.7.15:8002/:path/:subpath*',
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