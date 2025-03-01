/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
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
                value: 'true'
              }
            ]
          }
        ]
      }
};

export default nextConfig;