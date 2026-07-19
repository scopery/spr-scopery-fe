/** @type {import('next').NextConfig} */

const BE_URL = process.env.API_INTERNAL_URL

const nextConfig = {
  reactStrictMode: true,

  // Tree-shake heavy icon / editor packages instead of bundling full entrypoints.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      'platejs',
      '@platejs/basic-nodes',
      '@platejs/table',
      '@platejs/list',
      '@platejs/link',
      '@platejs/callout',
      '@platejs/code-block',
      '@platejs/slash-command',
      '@platejs/toggle',
      '@platejs/indent',
    ],
  },

  // Proxy API requests to the backend.
  // Browser calls relative /api/* (see shared/lib/api-paths.ts API_BASE_PATH).
  // Next forwards to API_INTERNAL_URL — mirrors BE ApiPaths.BASE_PATH = "/api".
  // Filesystem routes (/api/auth/*, /api/proxy/*) take precedence over this rewrite.
  async rewrites() {
    if (!BE_URL) return []
    return [
      {
        source: '/api/:path*',
        destination: `${BE_URL}/api/:path*`,
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/org/:workspaceId',
        destination: '/workspace/:workspaceId',
        permanent: true,
      },
      {
        source: '/org/:workspaceId/:path*',
        destination: '/workspace/:workspaceId/:path*',
        permanent: true,
      },
      // P4: Directory consolidates people routes
      {
        source: '/workspace/:workspaceId/members',
        destination: '/workspace/:workspaceId/directory?tab=members',
        permanent: false,
      },
      {
        source: '/workspace/:workspaceId/teams',
        destination: '/workspace/:workspaceId/directory?tab=teams',
        permanent: false,
      },
      {
        source: '/workspace/:workspaceId/invitations',
        destination: '/workspace/:workspaceId/directory?tab=invitations',
        permanent: false,
      },
      {
        source: '/workspace/:workspaceId/join-requests',
        destination: '/workspace/:workspaceId/directory?tab=join-requests',
        permanent: false,
      },
    ]
  },

  ...(process.env.TURBOPACK !== '1' && {
    webpack: (config) => {
      config.ignoreWarnings = [{ module: /node_modules/ }, { message: /Failed to parse source map/ }]
      return config
    },
  }),
}

module.exports = nextConfig
