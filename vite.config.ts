import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    root: 'demo',
    server: {
      port: 3000,
      strictPort: true,  // Will error if port 3000 is not available
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@velosem/core': path.resolve(__dirname, './src'),
        '@': path.resolve(__dirname, './demo'),
      }
    }
  };
});
