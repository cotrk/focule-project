import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: false, // Prevents serving marketing site during development
  build: {
    outDir: 'dist',
    sourcemap: false, // Explicitly disable source maps
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy components into separate chunks
          'results-view': ['./src/components/ResultsViewRedesigned.tsx'],
          'marketing': ['./src/components/MarketingContentGenerator.tsx'],
          'settings': ['./src/components/SettingsPanel.tsx'],
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react'],
          'vendor-state': ['zustand']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    // Optimize bundle size
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(new URL(import.meta.url).pathname), './src'),
    },
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'zustand'],
    exclude: ['@types/node']
  }
});

