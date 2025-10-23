/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@amihuman/shared-types', '@amihuman/prompt-packs', '@amihuman/auth-sdk'],
  outputFileTracingRoot: '../../',
}

module.exports = nextConfig
