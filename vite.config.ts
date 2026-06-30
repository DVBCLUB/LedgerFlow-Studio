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
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const normalizedId = id.replace(/\\/g, '/');
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('scheduler') ||
                id.includes('react-router')
              ) {
                return 'vendor-core';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (normalizedId.includes('/node_modules/xlsx/')) {
                return 'vendor-spreadsheets';
              }
              if (
                normalizedId.includes('/node_modules/jspdf/') ||
                normalizedId.includes('/node_modules/jspdf-autotable/')
              ) {
                return 'vendor-pdf';
              }
              if (normalizedId.includes('/node_modules/qrcode/')) {
                return 'vendor-qrcode';
              }
              if (normalizedId.includes('/node_modules/motion')) {
                return 'vendor-motion';
              }
              if (normalizedId.includes('/node_modules/zustand/')) {
                return 'vendor-state';
              }
              if (id.includes('html2canvas')) {
                return 'vendor-utils';
              }
              return 'vendor';
            }
          },
        },
      },
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
          '**/*.db',
          '**/*.sqlite',
          '**/*.log',
        ]
      },
    },
  };
});
