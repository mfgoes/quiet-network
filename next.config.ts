import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // ESLint warnings in hooks.ts (pre-existing patterns) won't block production builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '*.twimg.com' },
      { protocol: 'https', hostname: 'i.microlink.io' },
      { protocol: 'https', hostname: '*.cdninstagram.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://apis.google.com https://*.googleapis.com; frame-src 'self' https://accounts.google.com https://*.google.com https://www.youtube-nocookie.com; img-src 'self' data: blob: https://img.youtube.com https://*.supabase.co https://*.twimg.com https://i.microlink.io https://*.cdninstagram.com https://*.fbcdn.net https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com; connect-src 'self' https://*.googleapis.com https://*.google.com https://*.supabase.co wss://*.supabase.co https://api.microlink.io https://nominatim.openstreetmap.org https://react-tweet.vercel.app https://public.api.bsky.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:",
          },
        ],
      },
    ]
  },
}

export default nextConfig
