import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Optimized Vite Configuration for LedgerFlow Studio
 * 
 * Features:
 * - Code splitting for faster page loads
 * - Reduced bundle size
 * - Better caching
 * - Production optimizations
 */

export default defineConfig({
  plugins: [react()],
  
  // ======================================================================
  // RESOLVE - Path aliases for cleaner imports
  // ======================================================================
  resolve: {
    alias: {
      // Use @/ for src imports
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@app': path.resolve(__dirname, './src/app'),
      '@context': path.resolve(__dirname, './src/context'),
      '@data': path.resolve(__dirname, './src/data'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@config': path.resolve(__dirname, './src/config'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
  
  // ======================================================================
  // BUILD - Optimizations
  // ======================================================================
  build: {
    // Output directory
    outDir: 'dist',
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Minify
    minify: 'esbuild',
    
    // Enable sourcemaps for debugging
    sourcemap: true,
    
    // Rollup options for better tree-shaking
    rollupOptions: {
      // Manual chunks - Split code by feature
      manualChunks: {
        // Vendor libraries
        vendor: [
          'react',
          'react-dom',
          'react-router-dom',
          'zustand',
          'lucide-react',
          'recharts',
        ],
        
        // Tailwind and CSS
        tailwind: [
          'tailwindcss',
          '@tailwindcss/vite',
        ],
        
        // AI related
        ai: [
          '@google/genai',
          'zod',
        ],
        
        // Express server
        express: [
          'express',
          'express-rate-limit',
          'helmet',
          'dotenv',
          'multer',
        ],
        
        // Heavy libraries
        heavy: [
          'puppeteer',
          'xlsx',
          'simple-git',
        ],
      },
      
      // Optimize chunk size
      output: {
        // Manual chunk naming
        manualChunks: undefined, // Use the manualChunks above
        
        // Better file naming
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        
        // Compact output
        compact: true,
        
        // Generate hash for cache busting
        hashCharacters: 'hex',
      },
      
      // External dependencies (for server-side)
      external: [
        // Node.js built-ins
        'path',
        'fs',
        'crypto',
        'http',
        'https',
        'child_process',
        'os',
        'util',
        'stream',
        'zlib',
        
        // Electron
        'electron',
        
        // Database
        'better-sqlite3',
      ],
      
      // Preserve modules for better debugging
      preserveEntrySignatures: 'strict',
    },
    
    // Analyze bundle size (optional)
    // analyze: true,
    
    // Target modern browsers
    target: 'es2020',
    
    // Empty outDir before build
    emptyOutDir: true,
    
    // Report compressed sizes
    reportCompressedSize: true,
  },
  
  // ======================================================================
  // SERVER - For development
  // ======================================================================
  server: {
    port: 3000,
    host: true,
    
    // Enable HMR
    hmr: {
      overlay: true,
    },
    
    // Watch for changes in these directories
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  
  // ======================================================================
  // OPTIMIZE DEPS - For faster development
  // ======================================================================
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      '@google/genai',
      'zod',
      'express',
      'lucide-react',
      'recharts',
    ],
    exclude: [
      // Don't pre-bundle these
      'puppeteer',
      'xlsx',
    ],
  },
  
  // ======================================================================
  // CSS OPTIMIZATIONS
  // ======================================================================
  css: {
    // Enable CSS modules
    modules: {
      localsConvention: 'camelCase',
    },
    
    // Preprocessor options
    preprocessorOptions: {
      // For SCSS if used in the future
      scss: {
        additionalData: '',
      },
    },
  },
  
  // ======================================================================
  // DEFINES - Environment variables
  // ======================================================================
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.ELECTRON_DESKTOP': JSON.stringify(process.env.ELECTRON_DESKTOP || 'false'),
  },
  
  // ======================================================================
  // JSON - Handle JSON imports
  // ======================================================================
  json: {
    stringify: true,
  },
  
  // ======================================================================
  // LOG LEVEL
  // ======================================================================
  logLevel: 'info',
  
  // ======================================================================
  // CACHE
  // ======================================================================
  cacheDir: 'node_modules/.vite-optimized',
});
