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
  // Remove console.log in production, keep error and warn
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'], // Keep error and warn for debugging
      },
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
        hostname: 'firebasestorage.googleapis.com',
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
        http2: false,
        child_process: false,
        stream: false,
        url: false,
        buffer: false,
        util: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        path: false,
        querystring: false,
        'firebase-admin': false,
      };
      
      // Exclude problematic WebAssembly modules on client-side
      config.resolve.alias = {
        ...config.resolve.alias,
        'farmhash-modern': false,
      };
      
      // Optimize chunk splitting for better main thread performance
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Firebase in separate chunk
          firebase: {
            name: 'firebase',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            priority: 50,
            enforce: true,
          },
          // Animation libraries in separate chunks (load on demand)
          animations: {
            name: 'animations',
            chunks: 'async', // Only load when needed
            test: /[\\/]node_modules[\\/](framer-motion|gsap|matter-js|@tsparticles)[\\/]/,
            priority: 45,
          },
          // Radix UI components
          radix: {
            name: 'radix-ui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Large UI libraries
          ui: {
            name: 'ui-libs',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](lucide-react|@headlessui|@heroicons)[\\/]/,
            priority: 35,
          },
          // Common vendor chunk (smaller)
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            minChunks: 2,
            maxSize: 200000,
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
    
    // Handle WebAssembly modules
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    // Enable WebAssembly support for packages like farmhash-modern
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
    };
    
    return config;
  },
}

export default withBundleAnalyzer(nextConfig) 