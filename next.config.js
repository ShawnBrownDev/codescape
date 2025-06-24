/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Handle WebSocket dependencies for Supabase realtime
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Ignore optional dependencies that cause warnings
    config.externals = config.externals || [];
    config.externals.push({
      'bufferutil': 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    });

    // Handle critical dependency warning
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'utf-8-validate': false,
      bufferutil: false,
    };

    return config;
  },
  async redirects() {
    return [
      {
        source: '/auth/callback',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

module.exports = nextConfig;
