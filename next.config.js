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

    // Handle missing CSS file issue by creating a virtual module
    config.plugins.push(
      new (require('webpack').DefinePlugin)({
        'process.env.NEXT_PUBLIC_CSS_FIX': JSON.stringify('true'),
      })
    );

    // Add a plugin to handle the missing CSS file
    config.plugins.push({
      apply: compiler => {
        compiler.hooks.beforeCompile.tapAsync(
          'EnsureCSSFile',
          (params, callback) => {
            const fs = require('fs');
            const path = require('path');

            const cssFile = path.join(
              process.cwd(),
              '.next',
              'browser',
              'default-stylesheet.css'
            );
            const cssDir = path.dirname(cssFile);

            if (!fs.existsSync(cssDir)) {
              fs.mkdirSync(cssDir, { recursive: true });
            }

            if (!fs.existsSync(cssFile)) {
              fs.writeFileSync(
                cssFile,
                '/* Default stylesheet for Next.js build process */\n'
              );
            }

            callback();
          }
        );
      },
    });

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
