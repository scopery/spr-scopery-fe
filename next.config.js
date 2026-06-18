/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Suppress vendor/source-map warnings from third-party packages
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { message: /Failed to parse source map/ },
    ]
    return config
  },
}

module.exports = nextConfig

