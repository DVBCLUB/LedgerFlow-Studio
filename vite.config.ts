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
    build: {},
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
          '**/*.db',
          '**/*.sqlite',
          '**/*.log',
        ]
      },
    },
  };
});
