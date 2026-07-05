/**
 * Next.js Configuration
 * Raw Deal Verifier v1.0
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Handle pdfkit and other native module dependencies
    if (!isServer) {
      config.externals = {
        ...config.externals,
        pdfkit: 'commonjs pdfkit',
      };
    }

    return config;
  },
  // Enable API route compression
  compress: true,
};

module.exports = nextConfig;
