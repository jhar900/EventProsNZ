/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['tyzyldvtvzxbmuomwftj.supabase.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  webpack: (config, { isServer }) => {
    // Fix for CSS processing issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Handle missing CSS file issue
    config.plugins.push(
      new (require('webpack').DefinePlugin)({
        'process.env.NEXT_PUBLIC_CSS_FIX': JSON.stringify('true'),
      })
    );

    return config;
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default_value',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
