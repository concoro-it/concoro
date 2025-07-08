import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Suppress specific image loading errors for favicon services
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Suppress favicon image loading errors in development
  ...(process.env.NODE_ENV === 'development' && {
    compiler: {
      removeConsole: false, // Keep console logs in development but filter them
    },
  }),
  experimental: {
    serverComponentsExternalPackages: ['firebase', 'firebase-admin'],
    optimizeCss: true, // Enable CSS optimization
    optimizePackageImports: ['framer-motion', 'lodash', '@radix-ui/react-icons'], // Tree shake large packages
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Transpile packages that need to be processed by Next.js
  transpilePackages: [
    'marked'
  ],
  // Ensure proper script loading
  optimizeFonts: true,
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: false, // Enable Next.js image optimization
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // Cache for 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'faviconkit.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'besticon-demo.herokuapp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/favicons',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      
      // Optimize chunk splitting for better main thread performance
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Firebase in separate chunk
          firebase: {
            name: 'firebase',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            priority: 40,
          },
          // Animation libraries in separate chunks (load on demand)
          animations: {
            name: 'animations',
            chunks: 'async', // Only load when needed
            test: /[\\/]node_modules[\\/](framer-motion|gsap|matter-js|@tsparticles)[\\/]/,
            priority: 35,
          },
          // Radix UI components
          radix: {
            name: 'radix-ui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            priority: 30,
          },
          // Common vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
          },
        },
      };
    }
    
    // Handle ESM packages
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });
    
    return config;
  },
}

export default withBundleAnalyzer(nextConfig) 