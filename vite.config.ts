import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Ensure support for top-level await used in PDF libraries
  },
  optimizeDeps: {
    include: ['pdfjs-dist'], // Ensure PDF.js is pre-bundled correctly
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
