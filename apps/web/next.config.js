/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ["@monorepo/core", "@monorepo/ui", "@monorepo/types"],
}

module.exports = nextConfig
