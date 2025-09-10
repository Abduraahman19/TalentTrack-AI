import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // refresh par sahi routing ke liye
  define: {
    'process.env': {} // vite env variables ko handle karega, error nahi aayega
  }
});
