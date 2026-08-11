import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        'recharts',
        'framer-motion',
        'clsx',
        'tailwind-merge'
      ]
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
            'vendor-charts': ['recharts']
          }
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/db_storage.json',
          '**/integration_registry.json',
          '**/integration_events.log.json',
          '**/ai_usage.log.json',
          '**/ledgerflow_audit.log.json',
          '**/runtime/*.json',
          '**/runtime/*.log',
          '**/runtime/.chrome_profiles/**',
          '**/.chrome_profiles/**',
          '**/*.db',
          '**/*.sqlite',
          '**/*.log',
        ]
      },
    },
  };
});
